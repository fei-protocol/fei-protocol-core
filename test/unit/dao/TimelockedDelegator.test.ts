import { getAddresses, time } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer } from 'ethers';

const TimelockedDelegator = artifacts.readArtifactSync('TimelockedDelegator');
const MockTribe = artifacts.readArtifactSync('MockTribe');
const toBN = ethers.BigNumber.from;

describe('TimelockedDelegator', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let beneficiaryAddress1: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.secondUserAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, secondUserAddress, beneficiaryAddress1 } = await getAddresses());

    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [beneficiaryAddress1]
    });

    const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);

    const mockTribeFactory = await ethers.getContractFactory(
      MockTribe.abi,
      MockTribe.bytecode,
      beneficiaryAddress1Signer
    );
    this.tribe = await mockTribeFactory.deploy();
    this.window = toBN(4 * 365 * 24 * 60 * 60);

    const delegatorFactory = await ethers.getContractFactory(
      TimelockedDelegator.abi,
      TimelockedDelegator.bytecode,
      beneficiaryAddress1Signer
    );
    this.delegator = await delegatorFactory.deploy(this.tribe.address, beneficiaryAddress1, this.window, {
      gasLimit: 8000000
    });
    this.totalTribe = toBN('10000');
    await this.tribe.mint(this.delegator.address, this.totalTribe);

    await hre.network.provider.request({
      method: 'hardhat_stopImpersonatingAccount',
      params: [beneficiaryAddress1]
    });
  });

  describe('Init', function () {
    it('tribe', async function () {
      expect(await this.delegator.tribe()).to.be.equal(this.tribe.address);
    });

    it('totalDelegated', async function () {
      expect(await this.delegator.totalDelegated()).to.be.equal(toBN('0'));
    });

    it('totalToken', async function () {
      expect(await this.delegator.totalToken()).to.be.equal(this.totalTribe);
    });
  });

  describe('Release', function () {
    describe('Immediate', function () {
      it('reverts', async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(
          this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, '100')
        ).to.be.revertedWith('TokenTimelock: not enough released tokens');
        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
      });
    });

    describe('Zero', function () {
      it('reverts', async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(
          this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, '0')
        ).to.be.revertedWith('TokenTimelock: no amount desired');
        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
      });
    });

    describe('One Quarter', function () {
      beforeEach(async function () {
        this.quarter = Number(this.window.div(toBN(4)).toString());
        await time.increase(this.quarter);
        this.quarterAmount = this.totalTribe.div(toBN(4));
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(
          await this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, this.quarterAmount)
        )
          .to.emit(this.delegator, 'Release')
          .withArgs(beneficiaryAddress1, beneficiaryAddress1, this.quarterAmount);
      });

      it('releases tokens', async function () {
        expect(await this.delegator.totalToken()).to.be.equal(this.quarterAmount.mul(toBN(3)));
        expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(this.quarterAmount);
      });

      it('updates released amounts', async function () {
        expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.quarterAmount);
        expect(await this.delegator.availableForRelease()).to.be.equal(toBN(0));
      });

      describe('Another Quarter', function () {
        beforeEach(async function () {
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await time.increase(this.quarter);
          expect(await this.delegator.availableForRelease()).to.be.equal(this.quarterAmount);
          await this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, this.quarterAmount);
          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });
        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(this.totalTribe.div(toBN(2)));
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(this.totalTribe.div(toBN(2)));
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.totalTribe.div(toBN(2)));
        });
      });

      describe('ReleaseMax Another Quarter', function () {
        beforeEach(async function () {
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await time.increase(this.quarter);
          expect(await this.delegator.availableForRelease()).to.be.equal(this.quarterAmount);
          await this.delegator.connect(beneficiaryAddress1Signer).releaseMax(beneficiaryAddress1);
          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });
        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(this.totalTribe.div(toBN(2)));
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(this.totalTribe.div(toBN(2)));
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.totalTribe.div(toBN(2)));
        });
      });

      describe('Excess Release', function () {
        it('reverts', async function () {
          await time.increase(this.quarter);
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await expect(
            this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, this.totalTribe)
          ).to.be.revertedWith('TokenTimelock: not enough released tokens');
          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });
      });
    });

    describe('Total Window', function () {
      beforeEach(async function () {
        await time.increase(Number(this.window.toString()));
      });

      describe('Total Release', function () {
        beforeEach(async function () {
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await expect(
            await this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, this.totalTribe)
          )
            .to.emit(this.delegator, 'Release')
            .withArgs(beneficiaryAddress1, beneficiaryAddress1, this.totalTribe);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(toBN(0));
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(this.totalTribe);
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.equal(toBN(0));
        });
      });

      describe('Release To', function () {
        beforeEach(async function () {
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await expect(await this.delegator.connect(beneficiaryAddress1Signer).release(userAddress, this.totalTribe))
            .to.emit(this.delegator, 'Release')
            .withArgs(beneficiaryAddress1, userAddress, this.totalTribe);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(toBN(0));
          expect(await this.tribe.balanceOf(userAddress)).to.be.equal(this.totalTribe);
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(toBN(0));
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.totalTribe);
          expect(await this.delegator.availableForRelease()).to.be.equal(toBN(0));
        });
      });

      describe('Partial Release', function () {
        beforeEach(async function () {
          this.halfAmount = this.totalTribe.div(toBN(2));
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await expect(
            await this.delegator.connect(beneficiaryAddress1Signer).release(beneficiaryAddress1, this.halfAmount)
          )
            .to.emit(this.delegator, 'Release')
            .withArgs(beneficiaryAddress1, beneficiaryAddress1, this.halfAmount);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });

        it('releases tokens', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(this.halfAmount);
          expect(await this.tribe.balanceOf(beneficiaryAddress1)).to.be.equal(this.halfAmount);
        });

        it('updates released amounts', async function () {
          expect(await this.delegator.alreadyReleasedAmount()).to.be.equal(this.halfAmount);
          expect(await this.delegator.availableForRelease()).to.be.equal(this.halfAmount);
        });
      });
    });
  });

  describe('Delegation', function () {
    describe('Not enough Tribe', function () {
      it('reverts', async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(this.delegator.connect(beneficiaryAddress1Signer).delegate(userAddress, 10001)).to.be.revertedWith(
          'TimelockedDelegator: Not enough Tribe'
        );
        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
      });
    });
    describe('Enough Tribe', function () {
      beforeEach(async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(await this.delegator.connect(beneficiaryAddress1Signer).delegate(userAddress, 100))
          .to.emit(this.delegator, 'Delegate')
          .withArgs(userAddress, 100);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
      });
      describe('Single Delegation', function () {
        it('updates balances', async function () {
          expect(await this.tribe.balanceOf(this.delegator.address)).to.be.equal(toBN(9900));
          const delegatee = await this.delegator.delegateContract(userAddress);
          expect(await this.tribe.balanceOf(delegatee)).to.be.equal(toBN(100));
        });

        it('updates delegated amount', async function () {
          expect(await this.delegator.totalDelegated()).to.be.equal(toBN(100));
        });

        it('maintains total token', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(toBN(10000));
        });
      });

      describe('Double Delegation', function () {
        beforeEach(async function () {
          this.originalDelegatee = await this.delegator.delegateContract(userAddress);
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await this.delegator.connect(beneficiaryAddress1Signer).delegate(userAddress, 100);
          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });
        it('updates balances', async function () {
          expect(await this.tribe.balanceOf(this.delegator.address)).to.be.equal(toBN(9800));
          const delegatee = await this.delegator.delegateContract(userAddress);
          expect(await this.tribe.balanceOf(delegatee)).to.be.equal(toBN(200));
        });

        it('updates delegated amount', async function () {
          expect(await this.delegator.totalDelegated()).to.be.equal(toBN(200));
        });

        it('maintains total token', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(toBN(10000));
        });

        it('original delegatee is deleted', async function () {
          expect(await ethers.provider.getCode(this.originalDelegatee)).to.be.equal('0x');
        });
      });

      describe('Undelegation', function () {
        beforeEach(async function () {
          this.delegatee = await this.delegator.delegateContract(userAddress);
          await hre.network.provider.request({
            method: 'hardhat_impersonateAccount',
            params: [beneficiaryAddress1]
          });
          const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
          await expect(await this.delegator.connect(beneficiaryAddress1Signer).undelegate(userAddress))
            .to.emit(this.delegator, 'Undelegate')
            .withArgs(userAddress, 100);

          await hre.network.provider.request({
            method: 'hardhat_stopImpersonatingAccount',
            params: [beneficiaryAddress1]
          });
        });
        it('updates balances', async function () {
          expect(await this.tribe.balanceOf(this.delegator.address)).to.be.equal(toBN(10000));
          expect(await this.tribe.balanceOf(this.delegatee)).to.be.equal(toBN(0));
        });

        it('updates delegated amount', async function () {
          expect(await this.delegator.totalDelegated()).to.be.equal(toBN(0));
        });

        it('maintains total token', async function () {
          expect(await this.delegator.totalToken()).to.be.equal(toBN(10000));
        });

        it('delegatee is deleted', async function () {
          expect(await ethers.provider.getCode(this.delegatee)).to.be.equal('0x');
        });

        describe('Double Undelegation', function () {
          it('reverts', async function () {
            await hre.network.provider.request({
              method: 'hardhat_impersonateAccount',
              params: [beneficiaryAddress1]
            });
            const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
            await expect(this.delegator.connect(beneficiaryAddress1Signer).undelegate(userAddress)).to.be.revertedWith(
              'TimelockedDelegator: Delegate contract nonexistent'
            );
            await hre.network.provider.request({
              method: 'hardhat_stopImpersonatingAccount',
              params: [beneficiaryAddress1]
            });
          });
        });
      });
    });
  });

  describe('Token Drop', function () {
    beforeEach(async function () {
      await this.tribe.mint(this.delegator.address, 10000);
    });

    it('updates total token', async function () {
      expect(await this.delegator.totalToken()).to.be.equal(toBN(20000));
    });
  });

  describe('Access', function () {
    describe('Delegate', function () {
      it('Non-beneficiary set reverts', async function () {
        await expect(
          this.delegator.connect(impersonatedSigners[userAddress]).delegate(userAddress, toBN(100), {})
        ).to.be.revertedWith('TokenTimelock: Caller is not a beneficiary');
      });
    });
    describe('Undelegate', function () {
      it('Non-beneficiary set reverts', async function () {
        await expect(
          this.delegator.connect(impersonatedSigners[userAddress]).undelegate(userAddress, {})
        ).to.be.revertedWith('TokenTimelock: Caller is not a beneficiary');
      });
    });
    describe('Set Pending Beneficiary', function () {
      it('Beneficiary set succeeds', async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await expect(await this.delegator.connect(beneficiaryAddress1Signer).setPendingBeneficiary(userAddress))
          .to.emit(this.delegator, 'PendingBeneficiaryUpdate')
          .withArgs(userAddress);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
        expect(await this.delegator.pendingBeneficiary()).to.be.equal(userAddress);
      });

      it('Non-beneficiary set reverts', async function () {
        await expect(
          this.delegator.connect(impersonatedSigners[userAddress]).setPendingBeneficiary(userAddress, {})
        ).to.be.revertedWith('TokenTimelock: Caller is not a beneficiary');
      });
    });

    describe('Accept Beneficiary', function () {
      it('Pending Beneficiary succeeds', async function () {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [beneficiaryAddress1]
        });
        const beneficiaryAddress1Signer = await ethers.getSigner(beneficiaryAddress1);
        await this.delegator.connect(beneficiaryAddress1Signer).setPendingBeneficiary(userAddress);
        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [beneficiaryAddress1]
        });
        const userAddressSigner = await ethers.getSigner(userAddress);
        await expect(await this.delegator.connect(userAddressSigner).acceptBeneficiary())
          .to.emit(this.delegator, 'BeneficiaryUpdate')
          .withArgs(userAddress);

        expect(await this.delegator.beneficiary()).to.be.equal(userAddress);
      });

      it('Non pending beneficiary reverts', async function () {
        await expect(
          this.delegator.connect(impersonatedSigners[secondUserAddress]).acceptBeneficiary({})
        ).to.be.revertedWith('TokenTimelock: Caller is not pending beneficiary');
      });
    });

    describe('Release', function () {
      it('Non-beneficiary set reverts', async function () {
        await expect(
          this.delegator.connect(impersonatedSigners[userAddress]).release(userAddress, '100', {})
        ).to.be.revertedWith('TokenTimelock: Caller is not a beneficiary');
      });
    });
  });
});
