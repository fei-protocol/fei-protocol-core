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

  describe('Reserve Stabilizer', async () => {
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
  });
});
