import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import { UniswapPCVDeposit } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-bondingcurve', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const tenPow18 = toBN('1000000000000000000');

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe.skip('Reserve Stabilizer', async () => {
    it('should be able to redeem Fei from stabiliser', async function () {
      const fei = contracts.fei;
      const reserveStabilizer = contracts.ethReserveStabilizer;
      const signer = (await ethers.getSigners())[0];
      await signer.sendTransaction({ to: reserveStabilizer.address, value: tenPow18.mul(toBN(200)) });

      const contractEthBalanceBefore = toBN(await ethers.provider.getBalance(reserveStabilizer.address));
      const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress));

      const feiTokensExchange = toBN(40000000000000);
      await reserveStabilizer.updateOracle();
      const expectedAmountOut = await reserveStabilizer.getAmountOut(feiTokensExchange);
      await reserveStabilizer.exchangeFei(feiTokensExchange);

      const contractEthBalanceAfter = toBN(await ethers.provider.getBalance(reserveStabilizer.address));
      const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress));

      expect(contractEthBalanceBefore.sub(toBN(expectedAmountOut))).to.be.equal(contractEthBalanceAfter);
      expect(userFeiBalanceAfter).to.be.equal(userFeiBalanceBefore.sub(feiTokensExchange));
    });
  });
  describe('BondingCurve', async () => {
    describe('ETH', async function () {
      beforeEach(async function () {
        // Seed bonding curve with eth and update oracle
        const bondingCurve = contracts.bondingCurve;
        const ethSeedAmount = tenPow18.mul(toBN(1000));
        await bondingCurve.purchase(deployAddress, ethSeedAmount, { value: ethSeedAmount });
        await bondingCurve.updateOracle();
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.bondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const ethAmount = tenPow18; // 1 ETH
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = ethAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);
        await bondingCurve.purchase(deployAddress, ethAmount, { value: ethAmount });
        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from bonding curve to compound and aave', async function () {
        const { bondingCurve, aaveEthPCVDeposit, compoundEthPCVDeposit } = contracts;

        await compoundEthPCVDeposit.deposit();
        const compoundETHBefore = await compoundEthPCVDeposit.balance();

        if ((await ethers.provider.getBalance(aaveEthPCVDeposit.address)).toString() !== '0') {
          await aaveEthPCVDeposit.deposit();
        }
        const aaveETHBefore = await aaveEthPCVDeposit.balance();

        const curveEthBalanceBefore = toBN(await ethers.provider.getBalance(bondingCurve.address));
        expect(curveEthBalanceBefore.gt(toBN(0))).to.be.true;

        const fei = contracts.fei;
        const callerFeiBalanceBefore = await fei.balanceOf(deployAddress);
        const pcvAllocations = await bondingCurve.getAllocation();

        expect(pcvAllocations[0].length).to.be.equal(2);

        const durationWindow = await bondingCurve.duration();

        // pass the duration window, so Fei incentive will be sent
        await time.increase(durationWindow.toString());

        const allocatedEth = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveEthBalanceAfter = toBN(await ethers.provider.getBalance(bondingCurve.address));

        // Have to use 5 wei because of rounding errors
        // Tho we only have 2 we use 5 in case of future additions
        expect(curveEthBalanceAfter.sub(curveEthBalanceBefore.sub(allocatedEth))).to.be.lt(5);

        const compoundETHAfter = await compoundEthPCVDeposit.balance();
        const aaveETHAfter = await aaveEthPCVDeposit.balance();
        await expectApprox(compoundETHAfter, compoundETHBefore.add(allocatedEth.div(toBN(2))), '100');
        await expectApprox(aaveETHAfter, aaveETHBefore.add(allocatedEth.div(toBN(2))), '100');

        const feiIncentive = await bondingCurve.incentiveAmount();
        const callerFeiBalanceAfter = await fei.balanceOf(deployAddress);
        expect(callerFeiBalanceAfter.eq(callerFeiBalanceBefore.add(feiIncentive))).to.be.true;
      });
    });

    describe('DPI', async function () {
      beforeEach(async function () {
        // Acquire DPI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        const dpiSeedAmount = tenPow18.mul(toBN(10));

        await forceEth(contractAddresses.indexCoopFusePoolDpi);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        const indexCoopFusePoolDpiSigner = await ethers.getSigner(contractAddresses.indexCoopFusePoolDpi);

        await contracts.dpi.connect(indexCoopFusePoolDpiSigner).transfer(deployAddress, dpiSeedAmount.mul(toBN(2)));

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.indexCoopFusePoolDpi]
        });

        // Seed bonding curve with dpi
        const bondingCurve = contracts.dpiBondingCurve;
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));

        await contracts.dpi.approve(bondingCurve.address, dpiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, dpiSeedAmount);
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.dpiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const dpiAmount = tenPow18; // 1 DPI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = dpiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await bondingCurve.purchase(deployAddress, dpiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from dpi bonding curve to the uniswap deposit and Fuse', async function () {
        const bondingCurve = contracts.dpiBondingCurve;
        const uniswapPCVDeposit: UniswapPCVDeposit = contracts.dpiUniswapPCVDeposit as UniswapPCVDeposit;
        const fusePCVDeposit = contracts.indexCoopFusePoolDpiPCVDeposit;

        await uniswapPCVDeposit.setMaxBasisPointsFromPegLP(10_000);

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(2);

        const pcvDepositBefore = await uniswapPCVDeposit.balance();
        const fuseBalanceBefore = await fusePCVDeposit.balance();
        const allocatedDpi = await bondingCurve.balance();

        doLogging && console.log(`DPI to Allocate: ${(Number(allocatedDpi) / 1e18).toFixed(0)}`);
        doLogging &&
          console.log(`DPI Uniswap PCV Deposit Balance Before: ${(Number(pcvDepositBefore) / 1e18).toFixed(0)}`);
        doLogging && console.log(`Fuse Balance Before ${(Number(fuseBalanceBefore) / 1e18).toFixed(0)}`);
        doLogging && console.log(`DPI Bonding curve: ${bondingCurve.address}`);
        await bondingCurve.allocate();

        const curveBalanceAfter = await bondingCurve.balance();
        doLogging && console.log(`DPI Bonding Curve Balance After: ${(Number(curveBalanceAfter) / 1e18).toFixed(0)}`);
        await expectApprox(curveBalanceAfter, toBN(0), '100');

        const pcvDepositAfter = await uniswapPCVDeposit.balance();
        doLogging &&
          console.log(`DPI Uniswap PCV Deposit Balance After: ${(Number(pcvDepositAfter) / 1e18).toFixed(0)}`);
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDpi.mul(toBN(9)).div(toBN(10)), '10000');

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        doLogging && console.log(`Fuse Balance After: ${(Number(fuseBalanceAfter) / 1e18).toFixed(0)}`);
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedDpi.div(toBN(10)), '10000');
      });
    });

    describe('DAI', async function () {
      beforeEach(async function () {
        // Acquire DAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.compoundDai]
        });

        const daiSeedAmount = tenPow18.mul(toBN(1000000)); // 1M DAI

        await forceEth(contractAddresses.compoundDai);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.compoundDai]
        });

        const compoundDaiSigner = await ethers.getSigner(contractAddresses.compoundDai);

        await contracts.dai.connect(compoundDaiSigner).transfer(deployAddress, daiSeedAmount);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.compoundDai]
        });

        const bondingCurve = contracts.daiBondingCurve;
        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const daiAmount = tenPow18.mul(toBN(1000000)); // 1M DAI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = daiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await contracts.dai.approve(bondingCurve.address, daiAmount);
        await bondingCurve.purchase(deployAddress, daiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expectApprox(feiBalanceAfter, expectedFinalBalance);
      });

      it('should transfer allocation from bonding curve to the compound deposit', async function () {
        const bondingCurve = contracts.daiBondingCurve;
        const compoundPCVDeposit = contracts.compoundDaiPCVDeposit;

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(1);

        const pcvDepositBefore = await compoundPCVDeposit.balance();

        const allocatedDai = await bondingCurve.balance();
        await bondingCurve.allocate();

        const curveBalanceAfter = await bondingCurve.balance();
        await expectApprox(curveBalanceAfter, toBN(0), '100');

        const pcvDepositAfter = await compoundPCVDeposit.balance();
        await expectApprox(pcvDepositAfter.sub(pcvDepositBefore), allocatedDai, '100');
      });
    });

    describe('RAI', async function () {
      beforeEach(async function () {
        // Acquire RAI
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [contractAddresses.reflexerStableAssetFusePoolRai]
        });

        const reflexerStableAssetFusePoolRaiSigner = await ethers.getSigner(
          contractAddresses.reflexerStableAssetFusePoolRai
        );

        const raiSeedAmount = tenPow18.mul(toBN(10000));

        await forceEth(contractAddresses.reflexerStableAssetFusePoolRai);
        await contracts.rai
          .connect(reflexerStableAssetFusePoolRaiSigner)
          .transfer(deployAddress, raiSeedAmount.mul(toBN(2)));

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [contractAddresses.reflexerStableAssetFusePoolRai]
        });

        // Seed bonding curve with rai
        const bondingCurve = contracts.raiBondingCurve;

        // increase mint cap
        await bondingCurve.setMintCap(tenPow18.mul(tenPow18));

        await contracts.rai.approve(bondingCurve.address, raiSeedAmount.mul(toBN(2)));
        await bondingCurve.purchase(deployAddress, raiSeedAmount);
      });

      it('should allow purchase of Fei through bonding curve', async function () {
        const bondingCurve = contracts.raiBondingCurve;
        const fei = contracts.fei;
        const feiBalanceBefore = await fei.balanceOf(deployAddress);

        const raiAmount = tenPow18; // 1 RAI
        const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
        const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

        // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
        const expected = raiAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

        await bondingCurve.purchase(deployAddress, raiAmount);

        const feiBalanceAfter = await fei.balanceOf(deployAddress);
        const expectedFinalBalance = feiBalanceBefore.add(expected);
        expect(feiBalanceAfter.eq(expectedFinalBalance)).to.be.true;
      });

      it('should transfer allocation from bonding curve to Fuse', async function () {
        const bondingCurve = contracts.raiBondingCurve;
        const fusePCVDeposit = contracts.reflexerStableAssetFusePoolRaiPCVDeposit;
        const aaveRaiPCVDeposit = contracts.aaveRaiPCVDeposit;

        await fusePCVDeposit.deposit();
        const fuseBalanceBefore = await fusePCVDeposit.balance();

        const aaveBalanceBefore = await aaveRaiPCVDeposit.balance();

        const pcvAllocations = await bondingCurve.getAllocation();
        expect(pcvAllocations[0].length).to.be.equal(2);

        const allocatedRai = await bondingCurve.balance();
        await bondingCurve.allocate();

        // All RAI were allocated
        const curveBalanceAfter = await bondingCurve.balance();
        expect(curveBalanceAfter.eq(toBN(0))).to.be.true;

        const fuseBalanceAfter = await fusePCVDeposit.balance();
        const aaveBalanceAfter = await aaveRaiPCVDeposit.balance();

        // Half allocated to fuse, half to aave
        await expectApprox(fuseBalanceAfter.sub(fuseBalanceBefore), allocatedRai.div(toBN(2)), '100');
        await expectApprox(aaveBalanceAfter.sub(aaveBalanceBefore), allocatedRai.div(toBN(2)), '100');
      });
    });
  });
});
