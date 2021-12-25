import {
  expectRevert,
  getAddresses,
  getCore,
  getImpersonatedSigner,
  increaseTime,
  ZERO_ADDRESS,
  latestTime
} from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { BalancerLBPSwapper, Core, Fei, Tribe } from '@custom-types/contracts';
import { MockVault } from '@custom-types/contracts/MockVault';
import { MockWeightedPool } from '@custom-types/contracts/MockWeightedPool';

const toBN = ethers.BigNumber.from;

describe('BalancerLBPSwapper', function () {
  let userAddress: string;
  let burnerAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  let minterAddress: string;
  let core: Core;
  let fei: Fei;
  let tribe: Tribe;
  let balancerLBPSwapper: BalancerLBPSwapper;
  let pool: MockWeightedPool;
  let vault: MockVault;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.minterAddress,
      addresses.burnerAddress
    ];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, pcvControllerAddress, governorAddress, minterAddress, burnerAddress } = await getAddresses());

    core = await getCore();

    fei = await ethers.getContractAt('Fei', await core.fei());
    tribe = await ethers.getContractAt('Tribe', await core.tribe());

    const mockOracleFactory = await ethers.getContractFactory('MockOracle');
    const oracle = await mockOracleFactory.deploy(2); // 2 FEI price for TRIBE

    const balancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
    balancerLBPSwapper = await balancerLBPSwapperFactory.deploy(
      core.address,
      {
        _oracle: oracle.address,
        _backupOracle: ZERO_ADDRESS,
        _invertOraclePrice: true,
        _decimalsNormalizer: 0
      },
      600, // 600 seconds frequency
      ethers.constants.WeiPerEther.mul(toBN(5)).div(toBN(100)), // small weight
      ethers.constants.WeiPerEther.mul(toBN(95)).div(toBN(100)), // large weight
      fei.address,
      tribe.address,
      userAddress,
      ethers.constants.WeiPerEther // min tokens 1
    );

    const mockVaultFactory = await ethers.getContractFactory('MockVault');
    vault = await mockVaultFactory.deploy([fei.address, tribe.address], balancerLBPSwapper.address);

    pool = await ethers.getContractAt('MockWeightedPool', await vault._pool());
  });

  describe('Init', function () {
    describe('Before Init', function () {
      it('SMALL_PERCENT', async function () {
        expect(await balancerLBPSwapper.SMALL_PERCENT()).to.be.equal(
          ethers.constants.WeiPerEther.mul(toBN(5)).div(toBN(100))
        );
      });

      it('LARGE_PERCENT', async function () {
        expect(await balancerLBPSwapper.LARGE_PERCENT()).to.be.equal(
          ethers.constants.WeiPerEther.mul(toBN(95)).div(toBN(100))
        );
      });

      it('tokenSpent', async function () {
        expect(await balancerLBPSwapper.tokenSpent()).to.be.equal(fei.address);
      });

      it('tokenReceived', async function () {
        expect(await balancerLBPSwapper.tokenReceived()).to.be.equal(tribe.address);
      });

      it('tokenReceivingAddress', async function () {
        expect(await balancerLBPSwapper.tokenReceivingAddress()).to.be.equal(userAddress);
      });

      it('minTokenSpentBalance', async function () {
        expect(await balancerLBPSwapper.minTokenSpentBalance()).to.be.bignumber.equal(ethers.constants.WeiPerEther);
      });

      it('isTimeStarted', async function () {
        expect(await balancerLBPSwapper.isTimeStarted()).to.be.false;
      });

      it('pool', async function () {
        expect(await balancerLBPSwapper.pool()).to.be.equal(ethers.constants.AddressZero);
      });

      it('vault', async function () {
        expect(await balancerLBPSwapper.vault()).to.be.equal(ethers.constants.AddressZero);
      });
    });

    describe('After Init', function () {
      beforeEach(async function () {
        await balancerLBPSwapper.init(pool.address);
      });

      it('tokenSpent', async function () {
        expect(await balancerLBPSwapper.tokenSpent()).to.be.equal(fei.address);
      });

      it('tokenReceived', async function () {
        expect(await balancerLBPSwapper.tokenReceived()).to.be.equal(tribe.address);
      });

      it('tokenReceivingAddress', async function () {
        expect(await balancerLBPSwapper.tokenReceivingAddress()).to.be.equal(userAddress);
      });

      it('minTokenSpentBalance', async function () {
        expect(await balancerLBPSwapper.minTokenSpentBalance()).to.be.bignumber.equal(ethers.constants.WeiPerEther);
      });

      it('isTimeStarted', async function () {
        expect(await balancerLBPSwapper.isTimeStarted()).to.be.true;
      });

      it('pool', async function () {
        expect(await balancerLBPSwapper.pool()).to.be.equal(pool.address);
      });

      it('vault', async function () {
        expect(await balancerLBPSwapper.vault()).to.be.equal(vault.address);
      });

      it('pid', async function () {
        expect(await balancerLBPSwapper.pid()).to.be.equal(await pool.getPoolId());
      });
    });
  });

  describe('getTokensIn', function () {
    beforeEach(async function () {
      await balancerLBPSwapper.init(pool.address);
    });

    it('succeeds', async function () {
      const results = await balancerLBPSwapper.getTokensIn(100000);
      const tokens = results[0];
      const amounts = results[1];

      expect(tokens[0]).to.be.equal(fei.address);
      expect(tokens[1]).to.be.equal(tribe.address);

      expect(amounts[0]).to.be.equal(toBN(100000));
      expect(amounts[1]).to.be.bignumber.equal(toBN(2631));
    });
  });

  describe('swap', function () {
    beforeEach(async function () {
      await balancerLBPSwapper.init(pool.address);
    });

    describe('before time', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
      });

      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(),
          'Timed: time not ended'
        );
      });
    });

    describe('paused', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
        await increaseTime(await balancerLBPSwapper.remainingTime());
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).pause();
      });

      it('reverts', async function () {
        await expectRevert(balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(), 'Pausable: paused');
      });
    });

    describe('Non-Governor or Admin', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
        await increaseTime(await balancerLBPSwapper.remainingTime());
      });

      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).swap(),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('Not enough tokenSpent', function () {
      beforeEach(async function () {
        await increaseTime(await balancerLBPSwapper.remainingTime());
      });

      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(),
          'BalancerLBPSwapper: not enough for new swap'
        );
      });
    });

    describe('Successful', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
        await core
          .connect(impersonatedSigners[governorAddress])
          .allocateTribe(balancerLBPSwapper.address, ethers.constants.WeiPerEther);

        await increaseTime(await balancerLBPSwapper.remainingTime());
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap();
      });

      it('succeeds', async function () {
        expect(await pool.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(await vault.LIQUIDITY_AMOUNT());
        expect(await balancerLBPSwapper.isTimeEnded()).to.be.false; // pool reset

        // Transfers held TRIBE
        expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(ethers.constants.WeiPerEther);

        const weightUpdate = await pool.getGradualWeightUpdateParams();
        const now = await latestTime();
        expect(weightUpdate[0].toNumber()).to.be.equal(now);
        expect(weightUpdate[1].toNumber()).to.be.greaterThan(now);
      });

      describe('Subsequent Swaps', function () {
        describe('Weight update in progress', function () {
          beforeEach(async function () {
            await fei
              .connect(impersonatedSigners[minterAddress])
              .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
            await increaseTime(await balancerLBPSwapper.remainingTime());

            const weight = ethers.constants.WeiPerEther.div(10);
            await pool.updateWeightsGradually(0, (await latestTime()) + 1000, [weight, weight]);
          });

          it('reverts', async function () {
            await expectRevert(
              balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(),
              'BalancerLBPSwapper: weight update in progress'
            );
          });
        });

        describe('Not enough tokenSpent', function () {
          beforeEach(async function () {
            await fei
              .connect(impersonatedSigners[burnerAddress])
              .burnFrom(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
            await increaseTime(await balancerLBPSwapper.remainingTime());
          });

          it('reverts', async function () {
            await expectRevert(
              balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(),
              'BalancerLBPSwapper: not enough for new swap'
            );
          });
        });
      });
    });
  });

  describe('forceSwap', function () {
    beforeEach(async function () {
      await balancerLBPSwapper.init(pool.address);
    });

    describe('before time', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));

        await core
          .connect(impersonatedSigners[governorAddress])
          .allocateTribe(balancerLBPSwapper.address, ethers.constants.WeiPerEther);
      });

      it('should succeed, no time restriction', async function () {
        await increaseTime(await balancerLBPSwapper.remainingTime());
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap();

        expect(await pool.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(await vault.LIQUIDITY_AMOUNT());
        expect(await balancerLBPSwapper.isTimeEnded()).to.be.false; // pool reset

        // Transfers held TRIBE
        expect(await tribe.balanceOf(userAddress)).to.be.bignumber.equal(ethers.constants.WeiPerEther);

        const weightUpdate = await pool.getGradualWeightUpdateParams();
        const now = await latestTime();
        expect(weightUpdate[0].toNumber()).to.be.equal(now);
        expect(weightUpdate[1].toNumber()).to.be.greaterThan(now);
      });
    });

    describe('paused', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
        await increaseTime(await balancerLBPSwapper.remainingTime());
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).pause();
      });

      it('reverts', async function () {
        await expectRevert(balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap(), 'Pausable: paused');
      });
    });

    describe('Non-Governor', function () {
      beforeEach(async function () {
        await fei
          .connect(impersonatedSigners[minterAddress])
          .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
        await increaseTime(await balancerLBPSwapper.remainingTime());
      });

      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).swap(),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });

  describe('exitPool', function () {
    beforeEach(async function () {
      await balancerLBPSwapper.init(pool.address);

      await fei
        .connect(impersonatedSigners[minterAddress])
        .mint(balancerLBPSwapper.address, ethers.constants.WeiPerEther.mul(2));
      await increaseTime(await balancerLBPSwapper.remainingTime());
      await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).swap();
    });

    it('succeeds', async function () {
      expect(await pool.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(await vault.LIQUIDITY_AMOUNT());
      await balancerLBPSwapper.connect(impersonatedSigners[pcvControllerAddress]).exitPool(userAddress);
      expect(await pool.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(toBN(0));
      expect(await fei.balanceOf(userAddress)).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul(toBN(2)));
    });

    it('non-PCV controller reverts', async function () {
      await expectRevert(
        balancerLBPSwapper.connect(impersonatedSigners[userAddress]).exitPool(userAddress),
        'CoreRef: Caller is not a PCV controller'
      );
    });
  });

  describe('setSwapFrequency', function () {
    describe('Not Governor', function () {
      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).setSwapFrequency(10),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('From Governor', function () {
      it('succeeds', async function () {
        expect(await balancerLBPSwapper.duration()).to.be.bignumber.equal(toBN(600));
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).setSwapFrequency(10),
          expect(await balancerLBPSwapper.duration()).to.be.bignumber.equal(toBN(10));
      });
    });
  });

  describe('setMinTokenSpent', function () {
    describe('Not Governor', function () {
      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).setMinTokenSpent(10),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('From Governor', function () {
      it('succeeds', async function () {
        expect(await balancerLBPSwapper.minTokenSpentBalance()).to.be.bignumber.equal(ethers.constants.WeiPerEther);
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).setMinTokenSpent(10),
          expect(await balancerLBPSwapper.minTokenSpentBalance()).to.be.bignumber.equal(toBN(10));
      });
    });
  });

  describe('setReceivingAddress', function () {
    describe('Not Governor', function () {
      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).setReceivingAddress(governorAddress),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('From Governor', function () {
      it('succeeds', async function () {
        expect(await balancerLBPSwapper.tokenReceivingAddress()).to.be.equal(userAddress);
        await balancerLBPSwapper.connect(impersonatedSigners[governorAddress]).setReceivingAddress(governorAddress),
          expect(await balancerLBPSwapper.tokenReceivingAddress()).to.be.equal(governorAddress);
      });
    });
  });

  describe('WithdrawERC20', function () {
    describe('Not PCVController', function () {
      it('reverts', async function () {
        await expectRevert(
          balancerLBPSwapper.connect(impersonatedSigners[userAddress]).withdrawERC20(fei.address, userAddress, 100),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('From PCVController', function () {
      beforeEach(async function () {
        await fei.connect(impersonatedSigners[minterAddress]).mint(balancerLBPSwapper.address, 100);
      });

      it('succeeds', async function () {
        expect(await fei.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(toBN(100));
        await balancerLBPSwapper
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawERC20(fei.address, userAddress, 100);

        expect(await fei.balanceOf(balancerLBPSwapper.address)).to.be.bignumber.equal(toBN(0));
        expect(await fei.balanceOf(userAddress)).to.be.bignumber.equal(toBN(100));
      });
    });
  });
});
