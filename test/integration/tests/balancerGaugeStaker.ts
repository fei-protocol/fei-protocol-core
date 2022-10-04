import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { getImpersonatedSigner, expectRevert, expectEvent } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { BalancerGaugeStakerV2 } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const e18 = '000000000000000000';

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

  describe('BalancerGaugeStaker.sol', function () {
    let staker: BalancerGaugeStakerV2;
    let veBalOtcHelperContract: SignerWithAddress;
    let daoSigner: SignerWithAddress;
    let randomSigner: SignerWithAddress;

    before(async function () {
      // Create the contract - the implementation contract
      const factory = await ethers.getContractFactory('BalancerGaugeStakerV2');
      staker = await factory.deploy(
        contracts.core.address,
        contracts.balancerGaugeController.address,
        contracts.balancerMinter.address
      );
      await staker.deployTransaction.wait();

      // Initialise contract with V2 variables
      const owner = (await ethers.getSigners())[0].address;
      await staker._initialize(owner, contracts.balancerVotingEscrowDelegation.address);

      // get signer for a random address
      randomSigner = await getImpersonatedSigner('0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148');
      await forceEth(randomSigner.address);

      // seed the staker with some LP tokens
      const lpTokenHolder = '0xf4adc8369e83d6a599e51438d44b5e53a412f807';
      const lpTokenSigner = await getImpersonatedSigner(lpTokenHolder);
      await forceEth(lpTokenHolder);
      await contracts.bpt30Fei70Weth.connect(lpTokenSigner).transfer(staker.address, `100${e18}`);

      // also airdrop some BAL so that balance is not zero
      const balTokenHolder = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
      const balTokenSigner = await getImpersonatedSigner(balTokenHolder);
      await forceEth(balTokenHolder);
      await contracts.bal.connect(balTokenSigner).transfer(staker.address, '10000');

      veBalOtcHelperContract = await getImpersonatedSigner(contracts.vebalOtcHelper.address);
      await forceEth(contracts.vebalOtcHelper.address);

      // Initialise dao signer
      daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await forceEth(contracts.feiDAOTimelock.address);
    });

    it('init', async function () {
      expect(await staker.balanceReportedIn()).to.be.equal(contracts.bal.address);
      expect(await staker.balance()).to.be.equal('10000');
      expect((await staker.resistantBalanceAndFei())[0]).to.be.equal('10000');
      expect((await staker.resistantBalanceAndFei())[1]).to.be.equal('0');
    });

    describe('setBalancerMinter()', function () {
      it('should revert if user has no role', async function () {
        await expectRevert(staker.setBalancerMinter(contracts.balancerMinter.address), 'UNAUTHORIZED');
      });

      it('should work if user has METAGOVERNANCE_GAUGE_ADMIN role', async function () {
        expect(await staker.balancerMinter()).to.be.equal(contracts.balancerMinter.address);
        await staker.connect(veBalOtcHelperContract).setBalancerMinter(deployAddress);
        expect(await staker.balancerMinter()).to.be.equal(deployAddress);
        await staker.connect(veBalOtcHelperContract).setBalancerMinter(contracts.balancerMinter.address);
        expect(await staker.balancerMinter()).to.be.equal(contracts.balancerMinter.address);
      });
    });

    describe('withdraw()', function () {
      it('should revert if user has no role', async function () {
        await expectRevert(
          staker.connect(randomSigner).withdraw(veBalOtcHelperContract.address, '10'),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('should revert if contract is paused', async function () {
        await staker.connect(daoSigner).pause();
        await expectRevert(staker.withdraw(veBalOtcHelperContract.address, '10'), 'Pausable: paused');
        await staker.connect(daoSigner).unpause();
      });

      it('should work if user has PCV_CONTROLLER_ROLE role', async function () {
        const balanceBefore = await contracts.bal.balanceOf(veBalOtcHelperContract.address);
        await staker.connect(veBalOtcHelperContract).withdraw(veBalOtcHelperContract.address, '10');
        const balanceAfter = await contracts.bal.balanceOf(veBalOtcHelperContract.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.equal('10');
        expect(await staker.balance()).to.be.equal('9990');
      });
    });

    describe('mintGaugeRewards()', function () {
      it('should revert for gauges that are not configured', async function () {
        await expectRevert(
          staker.mintGaugeRewards(contracts.bal.address),
          'BalancerGaugeStaker: token has no gauge configured'
        );
      });

      it('should be able to mint BAL', async function () {
        // set gauge and stake a bunch of tokens
        await staker
          .connect(veBalOtcHelperContract)
          .setTokenToGauge(contracts.bpt30Fei70Weth.address, contracts.balancerGaugeBpt30Fei70Weth.address);
        await staker.connect(veBalOtcHelperContract).stakeAllInGauge(contracts.bpt30Fei70Weth.address);

        await staker.mintGaugeRewards(contracts.bpt30Fei70Weth.address);
        expect(await staker.balance()).to.be.at.least('9990');
        expect((await staker.resistantBalanceAndFei())[0]).to.be.at.least('9990');
        expect((await staker.resistantBalanceAndFei())[1]).to.be.equal('0');
      });
    });

    describe('withdrawERC20()', function () {
      it('should revert if user has no role', async function () {
        await expectRevert(
          staker.connect(randomSigner).withdraw(veBalOtcHelperContract.address, '10'),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('should revert if contract is paused', async function () {
        await staker.connect(daoSigner).pause();
        await expectRevert(staker.withdraw(veBalOtcHelperContract.address, '10'), 'Pausable: paused');
        await staker.connect(daoSigner).unpause();
      });

      it('should work if user has PCV_CONTROLLER_ROLE role', async function () {
        const balanceBefore = await contracts.bal.balanceOf(veBalOtcHelperContract.address);
        await expectEvent(
          staker
            .connect(veBalOtcHelperContract)
            .withdrawERC20(contracts.bal.address, veBalOtcHelperContract.address, '10'),
          staker,
          'WithdrawERC20',
          [veBalOtcHelperContract.address, contracts.bal.address, veBalOtcHelperContract.address, '10']
        );
        const balanceAfter = await contracts.bal.balanceOf(veBalOtcHelperContract.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.equal('10');
      });
    });
  });
});
