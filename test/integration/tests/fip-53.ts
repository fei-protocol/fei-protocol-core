import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, time, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
const toBN = ethers.BigNumber.from;
const BNe18 = (x) => ethers.constants.WeiPerEther.mul(toBN(x));

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-fip-53', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let daoSigner: any;

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
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    await forceEth(contracts.feiDAOTimelock.address);
  });

  it('should be able to mint FEI, get d3pool LP tokens on Curve, and stake on Convex', async function () {
    // Mint FEI for the Curve PCVDeposit
    const mintedFei = BNe18(100_000);
    await contracts.fei.connect(daoSigner).mint(contracts.d3poolCurvePCVDeposit.address, mintedFei);
    // get FRAX on the Curve PCVDeposit
    const FRAX_ADDRESS = '0xd632f22692FaC7611d2AA1C0D552930D43CAEd3B';
    const fraxSigner = await getImpersonatedSigner(FRAX_ADDRESS);
    await forceEth(FRAX_ADDRESS);
    await contracts.frax.connect(fraxSigner).transfer(contracts.d3poolCurvePCVDeposit.address, BNe18(100_000));
    // get alUSD on the Curve PCVDeposit
    const ALUSD_ADDRESS = '0x43b4FdFD4Ff969587185cDB6f0BD875c5Fc83f8c';
    const alUSDSigner = await getImpersonatedSigner(ALUSD_ADDRESS);
    await forceEth(ALUSD_ADDRESS);
    await contracts.alusd.connect(alUSDSigner).transfer(contracts.d3poolCurvePCVDeposit.address, BNe18(100_000));

    // Deposit FEI in the d3pool
    await contracts.d3poolCurvePCVDeposit.deposit();

    // Move all d3pool Curve LP tokens to the Convex d3pool deposit
    await contracts.ratioPCVController.connect(daoSigner).withdrawRatioERC20(
      contracts.d3poolCurvePCVDeposit.address,
      contracts.curveD3pool.address,
      contracts.d3poolConvexPCVDeposit.address,
      '10000' // 100%
    );

    // Deposit d3pool Curve LP tokens on Convex
    const lpTokensStakedBefore = await contracts.convexD3poolRewards.balanceOf(
      contracts.d3poolConvexPCVDeposit.address
    );
    await contracts.d3poolConvexPCVDeposit.deposit();
    const lpTokensStakedAfter = await contracts.convexD3poolRewards.balanceOf(contracts.d3poolConvexPCVDeposit.address);
    const lpTokensStaked = lpTokensStakedAfter.sub(lpTokensStakedBefore);
    expect(lpTokensStaked).to.be.at.least(BNe18(90_000));

    // this call should do nothing (no time passed, so CRV and CVX balance is 0),
    // but it should at least not revert.
    await contracts.d3poolConvexPCVDeposit.claimRewards();

    // Check what would happen if we wanted to exit the pool
    // We should have around ~50M stablecoins (mix of FRAX, FEI, alUSD).
    await contracts.d3poolConvexPCVDeposit.withdraw(contracts.d3poolCurvePCVDeposit.address, lpTokensStaked);
    await contracts.d3poolCurvePCVDeposit.exitPool();
    const fraxBalance = await contracts.frax.balanceOf(contracts.d3poolCurvePCVDeposit.address);
    const feiBalance = await contracts.fei.balanceOf(contracts.d3poolCurvePCVDeposit.address);
    const alUsdBalance = await contracts.alusd.balanceOf(contracts.d3poolCurvePCVDeposit.address);
    const stablecoinSum = fraxBalance.add(feiBalance).add(alUsdBalance);
    expect(stablecoinSum).to.be.at.least(BNe18(299_000));
  });
});
