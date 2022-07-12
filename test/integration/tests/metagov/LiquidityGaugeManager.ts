import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { getImpersonatedSigner, expectRevert } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { AngleDelegatorPCVDeposit } from '@custom-types/contracts';

const e18 = (x: any) => ethers.constants.WeiPerEther.mul(x);

describe('e2e-metagov', function () {
  let deployAddress: string;
  let contracts: NamedContracts;
  let e2eCoord: TestEndtoEndCoordinator;
  const logging = Boolean(process.env.LOGGING);

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    deployAddress = (await ethers.getSigners())[0].address;
    const config = {
      logging,
      deployAddress,
      version: 1
    };
    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);
    ({ contracts } = await e2eCoord.loadEnvironment());
  });

  describe('utils/LiquidityGaugeManager.sol', function () {
    let manager: AngleDelegatorPCVDeposit;

    before(async function () {
      // Create the contract
      const factory = await ethers.getContractFactory('AngleDelegatorPCVDeposit');
      manager = await factory.deploy(contracts.core.address, deployAddress);
      await manager.deployTransaction.wait();

      // Whitelist contract for veToken locking
      const ANGLE_MULTISIG_ADDRESS = '0xdC4e6DFe07EFCa50a197DF15D9200883eF4Eb1c8';
      await forceEth(ANGLE_MULTISIG_ADDRESS);
      const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
      const abi = ['function approveWallet(address _wallet)'];
      const smartWalletCheckerInterface = new ethers.utils.Interface(abi);
      const encodeWhitelistingCall = smartWalletCheckerInterface.encodeFunctionData('approveWallet', [manager.address]);
      await (
        await angleMultisigSigner.sendTransaction({
          data: encodeWhitelistingCall,
          to: '0xAa241Ccd398feC742f463c534a610529dCC5888E' // SmartWalletChecker
        })
      ).wait();
      // Seed the contract with some tokens
      const holder = '0x4f91F01cE8ec07c9B1f6a82c18811848254917Ab';
      await forceEth(holder);
      const signer = await getImpersonatedSigner(holder);
      await contracts.angle.connect(signer).transfer(manager.address, e18(10_000_000));

      // lock tokens to get voting power
      await forceEth(contracts.feiDAOTimelock.address);
      const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
      await manager.lock();
      await contracts.core
        .connect(daoSigner)
        .revokeRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), deployAddress);
    });

    describe('without METAGOVERNANCE_GAUGE_ADMIN role', function () {
      it('setGaugeController() should revert', async function () {
        await expectRevert(
          manager.setGaugeController(
            contracts.angleGaugeController.address // gauge controller
          ),
          'UNAUTHORIZED'
        );
      });

      it('setTokenToGauge() should revert', async function () {
        await expectRevert(
          manager.setTokenToGauge(
            contracts.angleAgEurFeiPool.address, // token
            contracts.angleGaugeUniswapV2FeiAgEur.address // gauge
          ),
          'UNAUTHORIZED'
        );
      });

      it('stakeInGauge() should revert', async function () {
        await expectRevert(
          manager.stakeInGauge(
            contracts.angleAgEurFeiPool.address, // token
            '123' // amount
          ),
          'UNAUTHORIZED'
        );
      });

      it('stakeAllInGauge() should revert', async function () {
        await expectRevert(
          manager.stakeAllInGauge(
            contracts.angleAgEurFeiPool.address // token
          ),
          'UNAUTHORIZED'
        );
      });

      it('unstakeFromGauge() should revert', async function () {
        await expectRevert(
          manager.unstakeFromGauge(
            contracts.angleAgEurFeiPool.address, // token
            '123' // amount
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('without METAGOVERNANCE_VOTE_ADMIN role', function () {
      it('voteForGaugeWeight() should revert', async function () {
        await expectRevert(
          manager.voteForGaugeWeight(
            contracts.angleAgEurFeiPool.address, // token
            '10000' // 100%
          ),
          'UNAUTHORIZED'
        );
      });
    });

    describe('with roles', function () {
      before(async function () {
        // grant roles
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), deployAddress);
        await contracts.core.connect(daoSigner).grantRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
      });

      after(async function () {
        // revoke roles
        await forceEth(contracts.feiDAOTimelock.address);
        const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await contracts.core
          .connect(daoSigner)
          .revokeRole(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), deployAddress);
        await contracts.core.connect(daoSigner).revokeRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), deployAddress);
      });

      it('setGaugeController()', async function () {
        expect(await manager.gaugeController()).to.be.equal(contracts.angleGaugeController.address);
        await manager.setGaugeController(deployAddress);
        expect(await manager.gaugeController()).to.be.equal(deployAddress);
        await manager.setGaugeController(contracts.angleGaugeController.address);
        expect(await manager.gaugeController()).to.be.equal(contracts.angleGaugeController.address);
      });

      it('setTokenToGauge()', async function () {
        expect(await manager.tokenToGauge(contracts.angleAgEurFeiPool.address)).to.be.equal(
          ethers.constants.AddressZero
        );
        await manager.setTokenToGauge(
          contracts.angleAgEurFeiPool.address,
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );
        expect(await manager.tokenToGauge(contracts.angleAgEurFeiPool.address)).to.be.equal(
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );
      });

      it('voteForGaugeWeight()', async function () {
        expect(
          await contracts.angleGaugeController.last_user_vote(
            manager.address,
            contracts.angleGaugeUniswapV2FeiAgEur.address
          )
        ).to.be.equal('0'); // timestamp of last vote = 0, never voted

        // set token/gauge map
        await manager.setTokenToGauge(
          contracts.angleAgEurFeiPool.address,
          contracts.angleGaugeUniswapV2FeiAgEur.address
        );

        // vote
        // this sometimes runds out of gas, why ???
        await manager.voteForGaugeWeight(contracts.angleAgEurFeiPool.address, '10000');

        expect(
          await contracts.angleGaugeController.last_user_vote(
            manager.address,
            contracts.angleGaugeUniswapV2FeiAgEur.address
          )
        ).to.be.at.least('1'); // timestamp of last vote
      });

      it('stakeInGauge()', async function () {
        // seed the manager with some tokens
        const HOLDER = '0xd6282C5aEAaD4d776B932451C44b8EB453E44244';
        expect(await contracts.angleAgEurFeiPool.balanceOf(HOLDER)).to.be.at.least(e18(2000));
        const signer = await getImpersonatedSigner(HOLDER);
        await forceEth(HOLDER);
        await contracts.angleAgEurFeiPool.connect(signer).transfer(manager.address, e18(2000));

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal('0');

        // stake 500 tokens in gauge
        await manager.stakeInGauge(
          contracts.angleAgEurFeiPool.address, // token
          e18(500) // amount
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(500));
      });

      it('stakeAllInGauge()', async function () {
        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(500));

        // stake remaining 1500 tokens in gauge
        await manager.stakeAllInGauge(
          contracts.angleAgEurFeiPool.address // token
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(2000));
      });

      it('unstakeFromGauge()', async function () {
        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal(e18(2000));
        expect(await contracts.angleAgEurFeiPool.balanceOf(manager.address)).to.be.equal('0');

        // unstake 2000 tokens from gauge
        await manager.unstakeFromGauge(
          contracts.angleAgEurFeiPool.address, // token
          e18(2000) // amount
        );

        expect(await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(manager.address)).to.be.equal('0');
        expect(await contracts.angleAgEurFeiPool.balanceOf(manager.address)).to.be.equal(e18(2000));
      });
    });

    describe('claimGaugeRewards()', function () {
      it('should be able to claim rewards', async function () {
        // not reverting is enough of a test here (we'd have to simulate
        // seeding the gauge with rewards & actually staking tokens to
        // have a non-zero claim...).
        manager.claimGaugeRewards(contracts.angleAgEurFeiPool.address);
      });

      it('should revert for gauges that are not configured', async function () {
        await expectRevert(
          manager.claimGaugeRewards(contracts.angle.address),
          'LiquidityGaugeManager: token has no gauge configured'
        );
      });
    });
  });
});
