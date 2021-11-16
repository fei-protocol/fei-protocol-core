import { expectRevert, expectApprox, getAddresses, getCore, getUniswapV3Mock, getRaiMock } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import UniswapV3PoolArtifacts from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { encodePriceSqrt, getMaxTick, getMinTick, sortAddress } from '../utils/uniswapV3';
const toBN = ethers.BigNumber.from;
const toWei = ethers.utils.parseEther;
const toRay = (ether) => toWei(ether).mul(toBN(10).pow(9));
const toBytes32 = ethers.utils.formatBytes32String;

describe('RaiPCVDepositUniV3Lp', function () {
  const RAY = toRay('1');
  const WAD = toWei('1');
  const collateral = toWei('10'); // 10 ETH
  const targetCRatio = toWei('2'); // 200 %
  const raiPerEth = toRay('100'); // ETH 400$ RAI 4$

  let userAddress;
  let governorAddress;
  let minterAddress;
  let beneficiaryAddress1;
  let pcvControllerAddress;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
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
    ({ userAddress, governorAddress, minterAddress, beneficiaryAddress1, pcvControllerAddress } = await getAddresses());
    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.weth = await (await ethers.getContractFactory('MockWeth')).deploy();
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 ETH/USD oracle price

    const {
      safeEngine,
      coin: rai,
      coinJoin,
      collateralJoin,
      safeManager,
      liquidationEngine
    } = await getRaiMock(this.weth.address);
    this.rai = rai;
    this.safeEngine = safeEngine;
    this.collateralJoin = collateralJoin;
    this.coinJoin = coinJoin;
    this.safeManager = safeManager;
    this.liquidationEngine = liquidationEngine;

    const reserves =
      sortAddress(this.fei.address, this.rai.address)[0] == this.fei.address
        ? [toWei('4'), toWei('1')]
        : [toWei('1'), toWei('4')];
    const { positionManager, factory, pool, router } = await getUniswapV3Mock(
      this.rai.address,
      this.fei.address,
      this.weth.address,
      500,
      reserves[0],
      reserves[1]
    );
    this.positionManager = positionManager;
    this.factory = factory;
    this.pool = pool;
    this.router = router;
    this.saviour = await (
      await ethers.getContractFactory(
        'MockGeneralUnderlyingMaxUniswapV3SafeSaviour',
        impersonatedSigners[governorAddress]
      )
    ).deploy(
      this.coinJoin.address,
      this.collateralJoin.address,
      ethers.constants.AddressZero,
      this.safeManager.address,
      ethers.constants.AddressZero,
      this.positionManager.address,
      this.liquidationEngine.address,
      0
    );
    await liquidationEngine.connect(impersonatedSigners[governorAddress]).connectSAFESaviour(this.saviour.address);

    this.pcvDeposit = await (
      await ethers.getContractFactory('RaiPCVDepositUniV3Lp')
    ).deploy(
      this.core.address,
      this.positionManager.address,
      this.oracle.address,
      this.oracle.address,
      this.collateralJoin.address,
      this.coinJoin.address,
      this.saviour.address,
      this.safeManager.address,
      this.router.address
    );
    /* Setup */
    //  Mint RAI to create uniswapv3 pair
    await this.weth.mint(minterAddress, toWei('100'));
    await this.weth.connect(impersonatedSigners[minterAddress]).approve(this.collateralJoin.address, toWei('100'));
    await this.collateralJoin.connect(impersonatedSigners[minterAddress]).join(minterAddress, toWei('100'));
    await this.safeEngine.connect(impersonatedSigners[minterAddress]).approveSAFEModification(coinJoin.address);
    await this.safeEngine.connect(impersonatedSigners[minterAddress]).modifySAFECollateralization(
      toBytes32('ETH-A'), // 0x4554482d41000000000000000000000000000000000000000000000000000000
      minterAddress,
      minterAddress,
      minterAddress,
      toWei('100'), // deltaCollateral
      toWei('5000') // deltaDebt
    );

    await coinJoin.connect(impersonatedSigners[minterAddress]).exit(minterAddress, toWei('5000'));
    await this.fei.connect(impersonatedSigners[minterAddress]).mint(minterAddress, toWei('4'));
    await this.fei
      .connect(impersonatedSigners[minterAddress])
      .approve(this.positionManager.address, ethers.constants.MaxUint256);
    await this.rai
      .connect(impersonatedSigners[minterAddress])
      .approve(this.positionManager.address, ethers.constants.MaxUint256);
    const tokens = sortAddress(this.fei.address, this.rai.address);
    // Add Liquidity 1:1 FEI/RAI
    await this.positionManager.connect(impersonatedSigners[minterAddress]).mint({
      token0: tokens[0],
      token1: tokens[1],
      fee: 500,
      tickLower: getMinTick(10),
      tickUpper: getMaxTick(10),
      amount0Desired: reserves[0],
      amount1Desired: reserves[1],
      amount0Min: 0,
      amount1Min: 0,
      recipient: minterAddress,
      deadline: Math.floor(Date.now() / 1000) + 3600
    });
    /* Set initial PCVDeposit parameters */
    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.pcvDeposit.address, {});
    await this.pcvDeposit
      .connect(impersonatedSigners[governorAddress])
      .setPositionTicks(getMinTick(10), getMaxTick(10));
    await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setTargetCollateralRatio(targetCRatio); // 200%
    await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(1000);
    await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxSlipageBasisPoints(1000);
  });

  function getDebtDesired(collateral, raiPerEth, cRatio) {
    return collateral.mul(raiPerEth).div(RAY).mul(WAD).div(cRatio);
  }

  describe('Initialize', function () {
    it('succeeds', async function () {
      expect(await this.pcvDeposit.core()).to.be.equal(this.core.address);
      expect(await this.pcvDeposit.positionManager()).to.be.equal(this.positionManager.address);
      expect(await this.pcvDeposit.oracle()).to.be.equal(this.oracle.address);
      expect(await this.pcvDeposit.safeManager()).to.be.equal(this.safeManager.address);
      expect(await this.pcvDeposit.router()).to.be.equal(this.router.address);
      expect(await this.pcvDeposit.balanceReportedIn()).to.be.equal(this.rai.address);
      expect(await this.pcvDeposit.maxBasisPointsFromPegLP()).to.be.equal(1000);
      expect(await this.pcvDeposit.maxSlippageBasisPoints()).to.be.equal(1000);
      expect(await this.pcvDeposit.maximumAvailableETH()).to.be.equal(toWei('100'));
      expect(await this.pcvDeposit.targetCRatio()).to.be.equal(targetCRatio);
      expect(await this.pcvDeposit.tokenId()).to.be.equal(0);
    });
  });

  describe('Deposit', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).pause({});
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: this.pcvDeposit.address,
          value: 100
        });
        await expectRevert(this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({}), 'Pausable: paused');
      });
    });

    describe('Pre deposit values', function () {
      it('position', async function () {
        const tokenId = await this.pcvDeposit.tokenId();
        await expect(this.positionManager.positions(tokenId)).to.be.reverted;
      });
      it('pair reserves', async function () {
        expect(await this.fei.balanceOf(this.pool.address)).to.be.equal(toWei('4'));
        expect(await this.rai.balanceOf(this.pool.address)).to.be.equal(toWei('1'));
        const result = await this.pcvDeposit.getPositionAmounts();
        expect(result[0]).to.be.equal(0);
        expect(result[1]).to.be.equal(0);
      });
      it('balance', async function () {
        expect(await this.pcvDeposit.balance()).to.be.equal(0);
      });
    });

    describe('Post deposit values', function () {
      const safeDebt = getDebtDesired(collateral, raiPerEth, targetCRatio);
      beforeEach(async function () {
        await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(10000);
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: this.pcvDeposit.address,
          value: collateral
        });
        await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
      });
      describe('No existing liquidity', function () {
        it('position', async function () {
          const tokenId = await this.pcvDeposit.tokenId();
          expect(tokenId).to.be.equal(2);
          const { operator, token0, token1, fee, tickLower, tickUpper, liquidity } =
            await this.positionManager.positions(tokenId);
          const tokens = sortAddress(this.fei.address, this.rai.address);
          expect(operator).to.be.equal(ethers.constants.AddressZero);
          expect(token0).to.be.equal(tokens[0]);
          expect(token1).to.be.equal(tokens[1]);
          expect(fee).to.be.equal(500);
          expect(tickLower).to.be.equal(getMinTick(10));
          expect(tickUpper).to.be.equal(getMaxTick(10));
          expect(liquidity).to.be.gt(0);
          await expectApprox(await this.fei.balanceOf(this.pool.address), toWei('4').add(toWei('2000')), '1');
          await expectApprox(await this.rai.balanceOf(this.pool.address), toWei('1').add(safeDebt), '1');
        });
        // it('liquidityOwned', async function () {
        //   expect(await this.pcvDeposit.liquidityOwned()).to.be.gt(0);
        // });
        it('pair reserves', async function () {
          // Liquidity calculation
          const tokens = sortAddress(this.fei.address, this.rai.address);
          const result = await this.pcvDeposit.getPositionAmounts();
          await expectApprox(result[0], tokens[0] == this.fei.address ? toWei('2000') : safeDebt);
          await expectApprox(result[1], tokens[0] == this.fei.address ? toWei('2000') : safeDebt);
        });
        it('balance', async function () {
          await expectApprox(await this.pcvDeposit.balance(), safeDebt, '1');
        });
        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(0);
        });
        it('safe Balance', async function () {
          const { lockedCollateral, generatedDebt } = await this.safeEngine.safes(
            toBytes32('ETH-A'),
            await this.safeManager.safes(await this.pcvDeposit.safeId())
          );
          expect(lockedCollateral).to.be.equal(collateral);
          expect(generatedDebt).to.be.equal(safeDebt);
        });
        it('safe saviour', async function () {
          expect(
            await this.liquidationEngine.chosenSAFESaviour(
              toBytes32('ETH-A'),
              await this.safeManager.safes(await this.pcvDeposit.safeId())
            )
          ).to.be.equal(this.saviour.address);
          expect(await this.positionManager.ownerOf(await this.pcvDeposit.tokenId())).to.be.equal(this.saviour.address);
        });
      });
      describe('Existing liquidity', function () {
        beforeEach(async function () {
          this.feiPoolBalBefore = this.fei.balanceOf(this.pool.address);
          this.raiPoolBalBefore = this.rai.balanceOf(this.pool.address);
          // Deposit extra 1 ETH in the safe and mint 50 RAI and increase liquidity.
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: toWei('1')
          });
          await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
        });
        it('position', async function () {
          const tokenId = await this.pcvDeposit.tokenId();
          expect(tokenId).to.be.equal(2);
          const { operator, token0, token1, fee, tickLower, tickUpper, liquidity } =
            await this.positionManager.positions(2);
          const tokens = sortAddress(this.fei.address, this.rai.address);
          expect(operator).to.be.equal(ethers.constants.AddressZero);
          expect(token0).to.be.equal(tokens[0]);
          expect(token1).to.be.equal(tokens[1]);
          expect(fee).to.be.equal(500);
          expect(tickLower).to.be.equal(getMinTick(10));
          expect(tickUpper).to.be.equal(getMaxTick(10));
          expect(liquidity).to.be.gt(0);
        });
        it('pair reserves', async function () {
          const tokens = sortAddress(this.fei.address, this.rai.address);
          const result = await this.pcvDeposit.getPositionAmounts();
          await expectApprox(result[0], tokens[0] == this.fei.address ? toWei('2200') : safeDebt.add(toWei('50')));
          await expectApprox(result[1], tokens[0] == this.fei.address ? toWei('2200') : safeDebt.add(toWei('50')));
        });
        it('balance', async function () {
          await expectApprox(await this.pcvDeposit.balance(), safeDebt.add(toWei('50')), '1');
        });
        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(0);
        });
        it('safe Balance', async function () {
          const { lockedCollateral, generatedDebt } = await this.safeEngine.safes(
            toBytes32('ETH-A'),
            await this.safeManager.safes(await this.pcvDeposit.safeId())
          );
          expect(lockedCollateral).to.be.equal(collateral.add(toWei('1')));
          expect(generatedDebt).to.be.equal(safeDebt.add(toWei('50')));
        });
        it('safe saviour', async function () {
          expect(
            await this.liquidationEngine.chosenSAFESaviour(
              toBytes32('ETH-A'),
              await this.safeManager.safes(await this.pcvDeposit.safeId())
            )
          ).to.be.equal(this.saviour.address);
          expect(await this.positionManager.ownerOf(await this.pcvDeposit.tokenId())).to.be.equal(this.saviour.address);
        });
      });
    });
  });

  describe('Withdraw', function () {
    beforeEach(async function () {
      await impersonatedSigners[userAddress].sendTransaction({
        from: userAddress,
        to: this.pcvDeposit.address,
        value: collateral
      });
      // Deposit
      await this.pcvDeposit.connect(impersonatedSigners[userAddress]).deposit({});
      this.beneficiaryBalance = await ethers.provider.getBalance(beneficiaryAddress1);
    });
    describe('Paused', function () {
      it('reverts', async function () {
        await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          this.pcvDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdraw(beneficiaryAddress1, toWei('1'), {}),
          'Pausable: paused'
        );
      });
      describe('Reverts', function () {
        it('not pcv controller', async function () {
          await expectRevert(
            this.pcvDeposit.connect(impersonatedSigners[userAddress]).withdraw(beneficiaryAddress1, toWei('1'), {}),
            'CoreRef: Caller is not a PCV controller'
          );
        });
        it('no balance', async function () {
          await this.core.connect(impersonatedSigners[governorAddress]).grantPCVController(userAddress, {});
          await expectRevert(
            this.pcvDeposit.connect(impersonatedSigners[userAddress]).withdraw(beneficiaryAddress1, toWei('1000'), {}),
            'RaiPCVDepositUniV3Lp: exceed withdrawable collateral'
          );
        });
      });
    });
    describe('With Balance', function () {
      describe('Partial - without withdrawing NFT LP', function () {
        const amountWithdrawn = toWei('1');
        const safeDebt = getDebtDesired(collateral, raiPerEth, targetCRatio);
        beforeEach(async function () {
          this.feiPoolBalBefore = await this.fei.balanceOf(this.pool.address);
          this.raiPoolBalBefore = await this.rai.balanceOf(this.pool.address);
          // Set target cRatio 160%
          await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setTargetCollateralRatio(toWei('1.6'));
          // Withdrawing 1 ether results in cRatio 180%
          await expect(
            await this.pcvDeposit
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdraw(beneficiaryAddress1, amountWithdrawn)
          )
            .to.emit(this.pcvDeposit, 'Withdrawal')
            .withArgs(pcvControllerAddress, beneficiaryAddress1, amountWithdrawn);
        });

        it('position', async function () {
          const tokenId = await this.pcvDeposit.tokenId();
          expect(tokenId).to.be.gt(0);
          const { token0, token1, liquidity } = await this.positionManager.positions(tokenId);
          const tokens = sortAddress(this.fei.address, this.rai.address);
          expect(token0).to.be.equal(tokens[0]);
          expect(token1).to.be.equal(tokens[1]);
          expect(liquidity).to.be.gt(0);
        });

        it('user balance updates', async function () {
          expect(await ethers.provider.getBalance(beneficiaryAddress1)).to.be.equal(
            amountWithdrawn.add(this.beneficiaryBalance)
          );
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(0);
        });

        it('pair balances update', async function () {
          const tokenId = await this.pcvDeposit.tokenId();
          expect(await this.positionManager.ownerOf(tokenId)).to.be.equal(this.saviour.address);
          expect(await this.fei.balanceOf(this.pool.address)).to.be.equal(this.feiPoolBalBefore);
          expect(await this.rai.balanceOf(this.pool.address)).to.be.equal(this.raiPoolBalBefore);
        });

        it('safe balance', async function () {
          const { lockedCollateral, generatedDebt } = await this.safeEngine.safes(
            toBytes32('ETH-A'),
            await this.safeManager.safes(await this.pcvDeposit.safeId())
          );
          expect(lockedCollateral).to.be.equal(collateral.sub(amountWithdrawn));
          expect(generatedDebt).to.be.equal(safeDebt);
        });
      });
      describe('Partial - Withdrawing NFT LP', function () {
        const amountWithdrawn = toWei('1');
        beforeEach(async function () {
          this.tokenId = await this.pcvDeposit.tokenId();
          // To keep cRatio 200% with collateral 9 ETH, repay 50 RAI.
          await expect(
            await this.pcvDeposit
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdraw(beneficiaryAddress1, amountWithdrawn)
          )
            .to.emit(this.pcvDeposit, 'Withdrawal')
            .withArgs(pcvControllerAddress, beneficiaryAddress1, amountWithdrawn);
        });

        it('position', async function () {
          expect(await this.pcvDeposit.tokenId()).to.be.equal(0);
          const { token0, token1, liquidity } = await this.positionManager.positions(this.tokenId);
          const tokens = sortAddress(this.fei.address, this.rai.address);
          expect(token0).to.be.equal(tokens[0]);
          expect(token1).to.be.equal(tokens[1]);
          expect(liquidity).to.be.eq(0);
        });

        it('user balance updates', async function () {
          expect(await ethers.provider.getBalance(beneficiaryAddress1)).to.be.equal(
            amountWithdrawn.add(this.beneficiaryBalance)
          );
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(0);
        });

        it('pair balances update', async function () {
          await expectApprox(await this.rai.balanceOf(this.pool.address), toWei('1'), '1');
          await expectApprox(await this.fei.balanceOf(this.pool.address), toWei('4'), '1');
        });

        it('safe balance', async function () {
          const expectedDebt = getDebtDesired(collateral.sub(amountWithdrawn), raiPerEth, targetCRatio);
          const { lockedCollateral, generatedDebt } = await this.safeEngine.safes(
            toBytes32('ETH-A'),
            await this.safeManager.safes(await this.pcvDeposit.safeId())
          );
          expect(lockedCollateral).to.be.equal(collateral.sub(amountWithdrawn));
          expect(generatedDebt).to.be.equal(expectedDebt);
        });
      });
      describe('Partial - Swap PCV asset to RAI', function () {
        const amountWithdrawn = toWei('1');
        beforeEach(async function () {
          /* setup */
          // Deploy ETH/RAI pool
          const tokens = sortAddress(this.weth.address, this.rai.address);
          const reserves = tokens[0] == this.weth.address ? [toWei('20'), toWei('2000')] : [toWei('2000'), toWei('20')];
          await this.positionManager.createAndInitializePoolIfNecessary(
            tokens[0],
            tokens[1],
            3000,
            encodePriceSqrt(reserves[1], reserves[0])
          );
          this.pool2 = new ethers.Contract(
            await this.factory.getPool(tokens[0], tokens[1], 3000),
            UniswapV3PoolArtifacts.abi
          );
          // Set Liquidity ETH/RAI pool
          await this.positionManager.connect(impersonatedSigners[minterAddress]).mint(
            {
              token0: tokens[0],
              token1: tokens[1],
              fee: 3000,
              tickLower: getMinTick(60),
              tickUpper: getMaxTick(60),
              amount0Desired: reserves[0],
              amount1Desired: reserves[1],
              amount0Min: 0,
              amount1Min: 0,
              recipient: minterAddress,
              deadline: Math.floor(Date.now() / 1000) + 3600
            },
            { value: toWei('20') }
          );
          // Mock exercising SAFE saviour which results in burning position
          await this.saviour.mockSAFEProtection(await this.safeManager.safes(await this.pcvDeposit.safeId()));

          /* Set tokens to swap to compensate debt */
          // Fund ETH to swap for RAI to repay
          await impersonatedSigners[userAddress].sendTransaction({
            from: userAddress,
            to: this.pcvDeposit.address,
            value: toWei('1')
          });

          // Governor sets token data to swap PCV asset for RAI in order to repay debt
          await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setSwapTokenApproval(
            [this.weth.address],
            [
              {
                oracle: this.oracle.address,
                poolFee: 3000,
                minimumAmountIn: 0
              }
            ]
          );
          await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxSlipageBasisPoints(1000);
          // To keep cRatio 200% with collateral 9 ETH, repay 50 RAI.
          await expect(
            await this.pcvDeposit
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdraw(beneficiaryAddress1, amountWithdrawn)
          )
            .to.emit(this.pcvDeposit, 'Withdrawal')
            .withArgs(pcvControllerAddress, beneficiaryAddress1, amountWithdrawn);
        });

        it('user balance updates', async function () {
          expect(await ethers.provider.getBalance(beneficiaryAddress1)).to.be.equal(
            amountWithdrawn.add(this.beneficiaryBalance)
          );
        });

        it('no fei held', async function () {
          expect(await this.fei.balanceOf(this.pcvDeposit.address)).to.be.equal(0);
        });

        it('pair balances update', async function () {
          expect(await this.pcvDeposit.tokenId()).to.be.equal(0);
          await expectApprox(await this.rai.balanceOf(this.pool.address), toWei('1'), '1');
          await expectApprox(await this.fei.balanceOf(this.pool.address), toWei('4'), '1');
        });

        it('safe balance', async function () {
          const expectedDebt = getDebtDesired(collateral.sub(amountWithdrawn), raiPerEth, targetCRatio);
          const { lockedCollateral, generatedDebt } = await this.safeEngine.safes(
            toBytes32('ETH-A'),
            await this.safeManager.safes(await this.pcvDeposit.safeId())
          );
          expect(lockedCollateral).to.be.equal(collateral.sub(amountWithdrawn));
          expect(generatedDebt).to.be.equal(expectedDebt);
        });
      });

      describe('Access', function () {
        describe('setTargetCollateralRatio', function () {
          it('Governor set succeeds', async function () {
            await expect(
              await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setTargetCollateralRatio(toWei('3'))
            )
              .to.emit(this.pcvDeposit, 'TargetCollateralRatioUpdate')
              .withArgs(targetCRatio, toWei('3'));

            expect(await this.pcvDeposit.targetCRatio()).to.be.equal(toWei('3'));
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setTargetCollateralRatio(targetCRatio, {}),
              'CoreRef: Caller is not a governor'
            );
          });

          it('over 100%', async function () {
            await expectRevert(
              this.pcvDeposit
                .connect(impersonatedSigners[governorAddress])
                .setTargetCollateralRatio(toWei('1').sub(1), {}),
              'RaiPCVDepositUniV3Lp: target ratio too low'
            );
          });
        });
        describe('setMaxBasisPointsFromPegLP', function () {
          it('Governor set succeeds', async function () {
            const oldMaxBasisPointsFromPegLP = await this.pcvDeposit.maxBasisPointsFromPegLP();
            await expect(
              await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(300)
            )
              .to.emit(this.pcvDeposit, 'MaxBasisPointsFromPegLPUpdate')
              .withArgs(oldMaxBasisPointsFromPegLP, '300');

            expect(await this.pcvDeposit.maxBasisPointsFromPegLP()).to.be.equal('300');
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setMaxBasisPointsFromPegLP(300, {}),
              'CoreRef: Caller is not a governor or contract admin'
            );
          });

          it('over 100%', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxBasisPointsFromPegLP(10001, {}),
              'RaiPCVDepositUniV3Lp: basis points from peg too high'
            );
          });
        });
        describe('setMaxSlipageBasisPoints', function () {
          it('Governor set succeeds', async function () {
            const oldSlipage = await this.pcvDeposit.maxSlippageBasisPoints();
            await expect(
              await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxSlipageBasisPoints(300)
            )
              .to.emit(this.pcvDeposit, 'MaxSlippageUpdate')
              .withArgs(oldSlipage, '300');

            expect(await this.pcvDeposit.maxSlippageBasisPoints()).to.be.equal('300');
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setMaxSlipageBasisPoints(300, {}),
              'CoreRef: Caller is not a governor or contract admin'
            );
          });

          it('over 100%', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxSlipageBasisPoints(10001, {}),
              'RaiPCVDepositUniV3Lp: slipage too high'
            );
          });
        });
        describe('setMaxAvailableETH', function () {
          it('Governor set succeeds', async function () {
            await expect(
              await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setMaxAvailableETH(toWei('200'))
            )
              .to.emit(this.pcvDeposit, 'MaximumAvailableETHUpdate')
              .withArgs(toWei('100'), toWei('200'));

            expect(await this.pcvDeposit.maximumAvailableETH()).to.be.equal(toWei('200'));
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setMaxAvailableETH(toWei('200'), {}),
              'CoreRef: Caller is not a governor'
            );
          });
        });
        describe('setSwapTokenApproval', function () {
          it('Governor set succeeds', async function () {
            await expect(
              await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setSwapTokenApproval(
                [this.weth.address],
                [
                  {
                    oracle: this.oracle.address,
                    poolFee: 3000,
                    minimumAmountIn: 1000
                  }
                ]
              )
            )
              .to.emit(this.pcvDeposit, 'SwapTokenApprovalUpdate')
              .withArgs(this.weth.address);
            const { oracle, poolFee, minimumAmountIn } = await this.pcvDeposit.tokenSwapParams(this.weth.address);
            expect(await this.pcvDeposit.tokenSpents(0)).to.be.equal(this.weth.address);
            expect(oracle).to.be.equal(this.oracle.address);
            expect(poolFee).to.be.equal(3000);
            expect(minimumAmountIn).to.be.equal(1000);
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setSwapTokenApproval(
                [this.weth.address],
                [
                  {
                    oracle: this.oracle.address,
                    poolFee: 3000,
                    minimumAmountIn: 1000
                  }
                ],
                {}
              ),
              'CoreRef: Caller is not a governor'
            );
          });
          it('toekn address zero', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setSwapTokenApproval(
                [ethers.constants.AddressZero],
                [
                  {
                    oracle: this.oracle.address,
                    poolFee: 3000,
                    minimumAmountIn: 1000
                  }
                ],
                {}
              ),
              'RaiPCVDepositUniV3Lp: token address zero'
            );
          });
          it('not same length', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setSwapTokenApproval(
                [this.weth.address, this.rai.address],
                [
                  {
                    oracle: this.oracle.address,
                    poolFee: 3000,
                    minimumAmountIn: 1000
                  }
                ],
                {}
              ),
              'RaiPCVDepositUniV3Lp: not same length'
            );
          });
        });
        describe('setPositionTicks', function () {
          it('Governor set succeeds', async function () {
            await expect(await this.pcvDeposit.connect(impersonatedSigners[governorAddress]).setPositionTicks(0, 3000))
              .to.emit(this.pcvDeposit, 'PositionTicksUpdate')
              .withArgs(getMinTick(10), getMaxTick(10), 0, 3000);
            // Liquidity will be provided at the specified tick for the next deposit
          });

          it('Non-governor set reverts', async function () {
            await expectRevert(
              this.pcvDeposit.connect(impersonatedSigners[userAddress]).setPositionTicks(0, 3000, {}),
              'CoreRef: Caller is not a governor'
            );
          });

          it('tick order', async function () {
            await expectRevert(
              this.pcvDeposit
                .connect(impersonatedSigners[governorAddress])
                .setPositionTicks(getMaxTick(10), getMinTick(10)),
              'RaiPCVDepositUniV3Lp:reversed order'
            );
          });
          it('over max tick', async function () {
            await expectRevert(
              this.pcvDeposit
                .connect(impersonatedSigners[governorAddress])
                .setPositionTicks(getMinTick(10), getMaxTick(10) + 100),
              'RaiPCVDepositUniV3Lp: max/min tick range'
            );
          });
          it('under min tick', async function () {
            await expectRevert(
              this.pcvDeposit
                .connect(impersonatedSigners[governorAddress])
                .setPositionTicks(getMinTick(10) - 100, getMaxTick(10)),
              'RaiPCVDepositUniV3Lp: max/min tick range'
            );
          });
        });

        describe('withdrawERC20', function () {
          it('PCVController succeeds', async function () {
            this.weth.mint(this.pcvDeposit.address, toBN('1000'));
            await expect(
              await this.pcvDeposit
                .connect(impersonatedSigners[pcvControllerAddress])
                .withdrawERC20(this.weth.address, userAddress, toBN('1000'))
            )
              .to.emit(this.pcvDeposit, 'WithdrawERC20')
              .withArgs(pcvControllerAddress, this.weth.address, userAddress, '1000');

            expect(await this.weth.balanceOf(userAddress)).to.be.equal('1000');
          });

          it('Non-PCVController fails', async function () {
            await expectRevert(
              this.pcvDeposit
                .connect(impersonatedSigners[userAddress])
                .withdrawERC20(this.weth.address, userAddress, toBN('1000'), {}),
              'CoreRef: Caller is not a PCV controller'
            );
          });
        });
      });
    });
  });
});
