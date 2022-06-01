import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { getImpersonatedSigner, expectRevert, expectEvent } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { BalancerGaugeStaker } from '@custom-types/contracts';

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
    e2eCoord = new TestEndtoEndCoordinator(config, proposals);
    ({ contracts } = await e2eCoord.loadEnvironment());
  });

  describe('BalancerGaugeStaker.sol', function () {
    let staker: BalancerGaugeStaker;
    let daoSigner: any;
    let randomSigner: any;

    before(async function () {
      // Create the contract
      const factory = await ethers.getContractFactory('BalancerGaugeStaker');
      staker = await factory.deploy(
        contracts.core.address,
        contracts.balancerGaugeController.address,
        contracts.balancerMinter.address,
        contracts.balancerVotingEscrowDelegation.address
      );
      await staker.deployTransaction.wait();

      // get signer for a random address
      randomSigner = await getImpersonatedSigner('0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148');
      await forceEth(randomSigner.address);

      // seed the staker with some LP tokens
      const lpTokenHolder = '0x4f9463405f5bc7b4c1304222c1df76efbd81a407';
      const lpTokenSigner = await getImpersonatedSigner(lpTokenHolder);
      await forceEth(lpTokenHolder);
      await contracts.bpt30Fei70Weth.connect(lpTokenSigner).transfer(staker.address, `1000${e18}`);

      // also airdrop some BAL so that balance is not zero
      const balTokenHolder = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
      const balTokenSigner = await getImpersonatedSigner(balTokenHolder);
      await forceEth(balTokenHolder);
      await contracts.bal.connect(balTokenSigner).transfer(staker.address, '10000');

      // grant roles to dao and initialize dao signer
      await forceEth(contracts.feiDAOTimelock.address);
      daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await contracts.core
        .connect(daoSigner)
        .grantRole(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'), daoSigner.address);
      await contracts.core
        .connect(daoSigner)
        .grantRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), daoSigner.address);

      // set approve for all from veBAL locker to the staker
      await forceEth(contracts.veBalDelegatorPCVDeposit.address);
      const vebalDelegatorSigner = await getImpersonatedSigner(contracts.veBalDelegatorPCVDeposit.address);
      await contracts.balancerVotingEscrowDelegation
        .connect(vebalDelegatorSigner)
        .setApprovalForAll(staker.address, true);
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
        await staker.connect(daoSigner).setBalancerMinter(deployAddress);
        expect(await staker.balancerMinter()).to.be.equal(deployAddress);
        await staker.connect(daoSigner).setBalancerMinter(contracts.balancerMinter.address);
        expect(await staker.balancerMinter()).to.be.equal(contracts.balancerMinter.address);
      });
    });

    describe('withdraw()', function () {
      it('should revert if user has no role', async function () {
        await expectRevert(
          staker.connect(randomSigner).withdraw(daoSigner.address, '10'),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('should revert if contract is paused', async function () {
        await staker.connect(daoSigner).pause();
        await expectRevert(staker.withdraw(daoSigner.address, '10'), 'Pausable: paused');
        await staker.connect(daoSigner).unpause();
      });

      it('should work if user has PCV_CONTROLLER_ROLE role', async function () {
        const balanceBefore = await contracts.bal.balanceOf(daoSigner.address);
        await staker.connect(daoSigner).withdraw(daoSigner.address, '10');
        const balanceAfter = await contracts.bal.balanceOf(daoSigner.address);
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
          .connect(daoSigner)
          .setTokenToGauge(contracts.bpt30Fei70Weth.address, contracts.balancerGaugeBpt30Fei70Weth.address);
        await staker.connect(daoSigner).stakeAllInGauge(contracts.bpt30Fei70Weth.address);

        staker.mintGaugeRewards(contracts.bpt30Fei70Weth.address);
        expect(await staker.balance()).to.be.at.least('9991');
        expect((await staker.resistantBalanceAndFei())[0]).to.be.at.least('9991');
        expect((await staker.resistantBalanceAndFei())[1]).to.be.equal('0');
      });
    });

    describe('withdrawERC20()', function () {
      it('should revert if user has no role', async function () {
        await expectRevert(
          staker.connect(randomSigner).withdrawERC20(contracts.bal.address, daoSigner.address, '10'),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('should revert if contract is paused', async function () {
        await staker.connect(daoSigner).pause();
        await expectRevert(staker.withdrawERC20(contracts.bal.address, daoSigner.address, '10'), 'Pausable: paused');
        await staker.connect(daoSigner).unpause();
      });

      it('should work if user has PCV_CONTROLLER_ROLE role', async function () {
        const balanceBefore = await contracts.bal.balanceOf(daoSigner.address);
        expectEvent(
          await staker.connect(daoSigner).withdrawERC20(contracts.bal.address, daoSigner.address, '10'),
          staker,
          'WithdrawERC20',
          [daoSigner.address, contracts.bal.address, daoSigner.address, '10']
        );
        const balanceAfter = await contracts.bal.balanceOf(daoSigner.address);
        expect(balanceAfter.sub(balanceBefore)).to.be.equal('10');
      });
    });

    describe('boost management', function () {
      describe('setVotingEscrowDelegation()', function () {
        it('should revert if user has no role', async function () {
          await expectRevert(staker.connect(randomSigner).setVotingEscrowDelegation(daoSigner.address), 'UNAUTHORIZED');
        });

        it('should revert if contract is paused', async function () {
          await staker.connect(daoSigner).pause();
          await expectRevert(staker.setVotingEscrowDelegation(daoSigner.address), 'Pausable: paused');
          await staker.connect(daoSigner).unpause();
        });

        it('should work if user has METAGOVERNANCE_TOKEN_STAKING role', async function () {
          expectEvent(
            await staker.connect(daoSigner).setVotingEscrowDelegation(daoSigner.address),
            staker,
            'VotingEscrowDelegationChanged',
            [contracts.balancerVotingEscrowDelegation.address, daoSigner.address]
          );
          // restore value
          await staker.connect(daoSigner).setVotingEscrowDelegation(contracts.balancerVotingEscrowDelegation.address);
        });
      });

      describe('create_boost()', function () {
        it('should revert if user has no role', async function () {
          await expectRevert(
            staker.connect(randomSigner).create_boost(
              contracts.veBalDelegatorPCVDeposit.address, // address _delegator
              staker.address, // address _receiver
              '10000', // int256 _percentage
              Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // uint256 _cancel_time = 1 week from now
              Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // uint256 _expire_time = 1 month from now
              '42' // uint256 _id
            ),
            'UNAUTHORIZED'
          );
        });

        it('should revert if contract is paused', async function () {
          await staker.connect(daoSigner).pause();
          await expectRevert(
            staker.create_boost(
              contracts.veBalDelegatorPCVDeposit.address, // address _delegator
              staker.address, // address _receiver
              '10000', // int256 _percentage
              Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // uint256 _cancel_time = 1 week from now
              Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // uint256 _expire_time = 1 month from now
              '42' // uint256 _id
            ),
            'Pausable: paused'
          );
          await staker.connect(daoSigner).unpause();
        });

        it('should work if user has METAGOVERNANCE_TOKEN_STAKING role', async function () {
          await staker.connect(daoSigner).create_boost(
            contracts.veBalDelegatorPCVDeposit.address, // address _delegator
            staker.address, // address _receiver
            '10000', // int256 _percentage
            Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // uint256 _cancel_time = 1 week from now
            Math.floor(Date.now() / 1000) + 3600 * 24 * 30, // uint256 _expire_time = 1 month from now
            '42' // uint256 _id
          );
          const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b200000000000000000000002a';
          expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least('1');
        });
      });

      describe('extend_boost()', function () {
        const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b200000000000000000000002a';
        const cancelTime = Math.floor(Date.now() / 1000) + 3600 * 24 * 14; // uint256 _expire_time = 14d from now
        const expireTime = Math.floor(Date.now() / 1000) + 3600 * 24 * 60; // uint256 _expire_time = 60d from now

        it('should revert if user has no role', async function () {
          await expectRevert(
            staker.connect(randomSigner).extend_boost(
              tokenId,
              '10000', // int256 _percentage
              cancelTime,
              expireTime
            ),
            'UNAUTHORIZED'
          );
        });

        it('should revert if contract is paused', async function () {
          await staker.connect(daoSigner).pause();
          await expectRevert(
            staker.extend_boost(
              tokenId,
              '10000', // int256 _percentage
              cancelTime,
              expireTime
            ),
            'Pausable: paused'
          );
          await staker.connect(daoSigner).unpause();
        });

        it.skip('should work if user has METAGOVERNANCE_TOKEN_STAKING role', async function () {
          await staker.connect(daoSigner).extend_boost(
            tokenId,
            '10000', // int256 _percentage
            cancelTime,
            expireTime
          );
          expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal(expireTime);
        });
      });

      describe('cancel_boost()', function () {
        const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b200000000000000000000002a';

        it('should revert if user has no role', async function () {
          await expectRevert(staker.connect(randomSigner).cancel_boost(tokenId), 'UNAUTHORIZED');
        });

        it('should revert if contract is paused', async function () {
          await staker.connect(daoSigner).pause();
          await expectRevert(staker.cancel_boost(tokenId), 'Pausable: paused');
          await staker.connect(daoSigner).unpause();
        });

        it('should work if user has METAGOVERNANCE_TOKEN_STAKING role', async function () {
          await staker.connect(daoSigner).cancel_boost(tokenId);
          expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal('0');
        });
      });

      describe('burn()', function () {
        const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b200000000000000000000002a';

        it('should revert if user has no role', async function () {
          await expectRevert(staker.connect(randomSigner).burn(tokenId), 'UNAUTHORIZED');
        });

        it('should revert if contract is paused', async function () {
          await staker.connect(daoSigner).pause();
          await expectRevert(staker.burn(tokenId), 'Pausable: paused');
          await staker.connect(daoSigner).unpause();
        });

        it('should work if user has METAGOVERNANCE_TOKEN_STAKING role', async function () {
          await staker.connect(daoSigner).burn(tokenId);
          expect(await contracts.balancerVotingEscrowDelegation.ownerOf(tokenId)).to.equal(
            '0x0000000000000000000000000000000000000000'
          );
        });
      });
    });
  });
});
