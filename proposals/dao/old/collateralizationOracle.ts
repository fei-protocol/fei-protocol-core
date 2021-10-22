import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedContracts,
  RunUpgradeFunc,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import {
  CollateralizationOracle,
  CollateralizationOracleWrapper,
  StaticPCVDepositWrapper
} from '@custom-types/contracts';

// The address representing USD, abstractly (not an ERC-20 of course) used in contracts/Constants.sol
const USD_ADDRESS = '0x1111111111111111111111111111111111111111';

const CR_WRAPPER_DURATION = 60 * 60 * 24; // 1 day
const CR_WRAPPER_DEVIATION_BPS = '500'; // 5%

/*

V2 Phase 1 Upgrade

Part 2 - Deploys all of the PCV deposit wrappers needed for the collateralization oracle, deploys the constant oracles used
         for FEI & USD, and deploys the collateralization oracle (along proxy-impl, and proxy-base) contracts.


----- PART 2 -----

DEPLOY ACTIONS:
1. Static Pcv Deposit Wrapper
2. Eth Reserve Stabilizer Wrapper
3. Dai bonding curve wrapper
4. Rai bonding curve wrapper
5. Dpi bonding curve wrapper
6. Rari Pool 19 Dpi PCV Deposit Wrapper
7. Eth Lido PCV Deposit Wrapper
8. Compound dai PCV Deposit Wrapper
9. Compound Eth PCV Deposit Wrapper
10. Aave Rai PCV Deposit Wrapper
11. Aave Eth PCV Deposit Wrapper
12. Rari Pool 9 Rai PCV Deposit Wrapper
13. Cream Fei PCV Deposit Wrapper
14. Rari Pool 8 Fei PCV Deposit Wrapper
15. Rari Pool 9 Fei PCV Deposit Wrapper
16. Rari Pool 7 Fei PCV Deposit Wrapper
17. Rari Pool 6 Fei PCV Deposit Wrapper
18. Rari Pool 19 Fei PCV Deposit Wrapper
19. Rari Pool 24 Fei PCV Deposit Wrapper
20. Rari Pool 25 Fei PCV Deposit Wrapper
21. Rari Pool 26 Fei PCV Deposit Wrapper
22. Rari Pool 27 Fei PCV Deposit Wrapper
23. Rari Pool 18 Fei PCV Deposit Wrapper
24. Rari Pool 28 Fei PCV Deposit Wrapper
25. Rari Pool 31 Fei PCV Deposit Wrapper
26. FEI ERC20 PCV Deposit Wrapper
27. One Constant Oracle
28. Zero Constant Oracle
29. Collateralization Ratio Oracle
30. Collateralization Ratio Oracle Wrapper Implementation
31. Collateralization Ratio Oracle Wrapper Proxy


DAO ACTIONS:
(no actions by the dao)

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    feiEthPair,
    weth,
    chainlinkEthUsdOracleWrapper,
    compositeOracle,
    aaveEthPCVDeposit,
    compoundEthPCVDeposit,
    daiBondingCurve,
    dpiBondingCurve,
    raiBondingCurve,
    ethReserveStabilizer,
    rariPool8FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    rariPool9FeiPCVDeposit,
    rariPool19DpiPCVDeposit,
    rariPool19FeiPCVDeposit,
    rariPool18FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    rariPool25FeiPCVDeposit,
    rariPool26FeiPCVDeposit,
    rariPool27FeiPCVDeposit,
    rariPool28FeiPCVDeposit,
    rariPool31FeiPCVDeposit,
    rariPool9RaiPCVDeposit,
    creamFeiPCVDeposit,
    compoundDaiPCVDeposit,
    aaveRaiPCVDeposit,
    ethLidoPCVDeposit,
    dai,
    dpi,
    rai,
    chainlinkDaiUsdOracleWrapper,
    bondingCurve,
    dpiUniswapPCVDeposit,
    uniswapPCVDeposit,
    chainlinkDpiUsdOracleWrapper,
    chainlinkRaiUsdCompositOracle,
    proxyAdmin,
    optimisticTimelock
  } = addresses;

  //   const { staticPcvDepositWrapper, ethReserveStabilizerWrapper} = addresses;

  if (!core || !feiEthPair || !weth || !chainlinkEthUsdOracleWrapper || !compositeOracle) {
    console.log(`core: ${core}`);
    console.log(`feiEtiPair: ${feiEthPair}`);
    console.log(`weth: ${weth}`);
    console.log(`chainlinkEthUsdOracleWrapper: ${chainlinkEthUsdOracleWrapper}`);
    console.log(`compositeOracle: ${compositeOracle}`);

    throw new Error('An environment variable contract address is not set');
  }

  // ----------- PCV Deposit Wrapper Contracts ---------------

  // 1. Static Pcv Deposit Wrapper
  const staticPcvDepositWrapperFactory = await ethers.getContractFactory('StaticPCVDepositWrapper');
  const staticPcvDepositWrapper = await staticPcvDepositWrapperFactory.deploy(
    core,
    ethers.constants.WeiPerEther.mul(4_000_000), // 4M PCV for 100k INDEX @ ~$40
    ethers.constants.WeiPerEther.mul(11_500_000) // 8.5M FEI in Kashi + 2.5M in Idle + .5M in BarnBridge
  );
  await staticPcvDepositWrapper.deployTransaction.wait();

  logging && console.log('staticPcvDepositWrapper: ', staticPcvDepositWrapper.address);

  // 2. Eth Reserve Stabilizer Wrapper
  const ethReserveStabilizerWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethReserveStabilizerWrapper = await ethReserveStabilizerWrapperFactory.deploy(
    ethReserveStabilizer,
    weth,
    false
  );
  await ethReserveStabilizerWrapper.deployTransaction.wait();

  logging && console.log('ethReserveStabilizerWrapper: ', ethReserveStabilizerWrapper.address);

  // 3. Dai bonding curve wrapper
  const daiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const daiBondingCurveWrapper = await daiBondingCurveWrapperFactory.deploy(daiBondingCurve, dai, false);
  await daiBondingCurveWrapper.deployTransaction.wait();

  logging && console.log('daiBondingCurveWrapper: ', daiBondingCurveWrapper.address);

  // 4. Rai bonding curve wrapper
  const raiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const raiBondingCurveWrapper = await raiBondingCurveWrapperFactory.deploy(raiBondingCurve, rai, false);
  await raiBondingCurveWrapper.deployTransaction.wait();

  logging && console.log('raiBondingCurveWrapper: ', raiBondingCurveWrapper.address);

  // 5. Dpi bonding curve wrapper
  const dpiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const dpiBondingCurveWrapper = await dpiBondingCurveWrapperFactory.deploy(dpiBondingCurve, dpi, false);
  await dpiBondingCurveWrapper.deployTransaction.wait();

  logging && console.log('dpiBondingCurveWrapper: ', dpiBondingCurveWrapper.address);

  // 6. Rari Pool 19 Dpi PCV Deposit Wrapper
  const rariPool19DpiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19DpiPCVDepositWrapper = await rariPool19DpiPCVDepositWrapperFactory.deploy(
    rariPool19DpiPCVDeposit,
    dpi,
    false
  );
  await rariPool19DpiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool19DpiPCVDepositWrapper: ', rariPool19DpiPCVDepositWrapper.address);

  // 7. Eth Lido PCV Deposit Wrapper
  const ethLidoPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethLidoPCVDepositWrapper = await ethLidoPCVDepositWrapperFactory.deploy(ethLidoPCVDeposit, weth, false);
  await ethLidoPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('ethLidoPCVDepositWrapper: ', ethLidoPCVDepositWrapper.address);

  // 8. Compound dai PCV Deposit Wrapper
  const compoundDaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const compoundDaiPCVDepositWrapper = await compoundDaiPCVDepositWrapperFactory.deploy(
    compoundDaiPCVDeposit,
    dai,
    false
  );
  await compoundDaiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('compoundDaiPCVDepositWrapper: ', compoundDaiPCVDepositWrapper.address);

  // 9. Compound Eth PCV Deposit Wrapper
  const compoundEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const compoundEthPCVDepositWrapper = await compoundEthPCVDepositWrapperFactory.deploy(
    compoundEthPCVDeposit,
    weth,
    false
  );
  await compoundEthPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('compoundEthPCVDepositWrapper: ', compoundEthPCVDepositWrapper.address);

  // 10. Aave Rai PCV Deposit Wrapper
  const aaveRaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveRaiPCVDepositWrapper = await aaveRaiPCVDepositWrapperFactory.deploy(aaveRaiPCVDeposit, rai, false);
  await aaveRaiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('aaveRaiPCVDeposit: ', aaveRaiPCVDepositWrapper.address);

  // 11. Aave Eth PCV Deposit Wrapper
  const aaveEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveEthPCVDepositWrapper = await aaveEthPCVDepositWrapperFactory.deploy(aaveEthPCVDeposit, weth, false);
  await aaveEthPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('aaveEthPCVDepositWrapper: ', aaveEthPCVDepositWrapper.address);

  // 12. Rari Pool 9 Rai PCV Deposit Wrapper
  const rariPool9RaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9RaiPCVDepositWrapper = await rariPool9RaiPCVDepositWrapperFactory.deploy(
    rariPool9RaiPCVDeposit,
    rai,
    false
  );
  await rariPool9RaiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool9RaiPCVDepositWrapper: ', rariPool9RaiPCVDepositWrapper.address);

  // ----------- FEI PCV Deposit Wrapper Contracts ---------------

  // 13. Cream Fei PCV Deposit Wrapper
  const creamFeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const creamFeiPCVDepositWrapper = await creamFeiPCVDepositWrapperFactory.deploy(creamFeiPCVDeposit, fei, true);

  logging && console.log('creamFeiPCVDepositWrapper: ', creamFeiPCVDepositWrapper.address);

  // 14. Rari Pool 8 Fei PCV Deposit Wrapper
  const rariPool8FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool8FeiPCVDepositWrapper = await rariPool8FeiPCVDepositWrapperFactory.deploy(
    rariPool8FeiPCVDeposit,
    fei,
    true
  );
  await rariPool8FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool8FeiPCVDepositWrapper: ', rariPool8FeiPCVDepositWrapper.address);

  // 15. Rari Pool 9 Fei PCV Deposit Wrapper
  const rariPool9FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9FeiPCVDepositWrapper = await rariPool9FeiPCVDepositWrapperFactory.deploy(
    rariPool9FeiPCVDeposit,
    fei,
    true
  );
  await rariPool9FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool9FeiPCVDepositWrapper: ', rariPool9FeiPCVDepositWrapper.address);

  // 16. Rari Pool 7 Fei PCV Deposit Wrapper
  const rariPool7FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool7FeiPCVDepositWrapper = await rariPool7FeiPCVDepositWrapperFactory.deploy(
    rariPool7FeiPCVDeposit,
    fei,
    true
  );
  await rariPool7FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool7FeiPCVDepositWrapper: ', rariPool7FeiPCVDepositWrapper.address);

  // 17. Rari Pool 6 Fei PCV Deposit Wrapper
  const rariPool6FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool6FeiPCVDepositWrapper = await rariPool6FeiPCVDepositWrapperFactory.deploy(
    rariPool6FeiPCVDeposit,
    fei,
    true
  );
  await rariPool6FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool6FeiPCVDepositWrapper: ', rariPool6FeiPCVDepositWrapper.address);

  // 18. Rari Pool 19 Fei PCV Deposit Wrapper
  const rariPool19FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19FeiPCVDepositWrapper = await rariPool19FeiPCVDepositWrapperFactory.deploy(
    rariPool19FeiPCVDeposit,
    fei,
    true
  );
  await rariPool19FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool19FeiPCVDepositWrapper: ', rariPool19FeiPCVDepositWrapper.address);

  // 19. Rari Pool 24 Fei PCV Deposit Wrapper
  const rariPool24FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool24FeiPCVDepositWrapper = await rariPool24FeiPCVDepositWrapperFactory.deploy(
    rariPool24FeiPCVDeposit,
    fei,
    true
  );
  await rariPool24FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool24FeiPCVDepositWrapper: ', rariPool24FeiPCVDepositWrapper.address);

  // 20. Rari Pool 25 Fei PCV Deposit Wrapper
  const rariPool25FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool25FeiPCVDepositWrapper = await rariPool25FeiPCVDepositWrapperFactory.deploy(
    rariPool25FeiPCVDeposit,
    fei,
    true
  );
  await rariPool25FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool25FeiPCVDepositWrapper: ', rariPool25FeiPCVDepositWrapper.address);

  // 21. Rari Pool 26 Fei PCV Deposit Wrapper
  const rariPool26FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool26FeiPCVDepositWrapper = await rariPool26FeiPCVDepositWrapperFactory.deploy(
    rariPool26FeiPCVDeposit,
    fei,
    true
  );
  await rariPool26FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool26FeiPCVDepositWrapper: ', rariPool26FeiPCVDepositWrapper.address);

  // 22. Rari Pool 27 Fei PCV Deposit Wrapper
  const rariPool27FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool27FeiPCVDepositWrapper = await rariPool27FeiPCVDepositWrapperFactory.deploy(
    rariPool27FeiPCVDeposit,
    fei,
    true
  );
  await rariPool27FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool27FeiPCVDepositWrapper: ', rariPool27FeiPCVDepositWrapper.address);

  // 23. Rari Pool 18 Fei PCV Deposit Wrapper
  const rariPool18FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool18FeiPCVDepositWrapper = await rariPool18FeiPCVDepositWrapperFactory.deploy(
    rariPool18FeiPCVDeposit,
    fei,
    true
  );
  await rariPool18FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool18FeiPCVDepositWrapper: ', rariPool18FeiPCVDepositWrapper.address);

  // 24. Rari Pool 28 Fei PCV Deposit Wrapper
  const rariPool28FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool28FeiPCVDepositWrapper = await rariPool28FeiPCVDepositWrapperFactory.deploy(
    rariPool28FeiPCVDeposit,
    fei,
    true
  );
  await rariPool28FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool28FeiPCVDepositWrapper: ', rariPool28FeiPCVDepositWrapper.address);

  // 25. Rari Pool 31 Fei PCV Deposit Wrapper
  const rariPool31FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool31FeiPCVDepositWrapper = await rariPool31FeiPCVDepositWrapperFactory.deploy(
    rariPool31FeiPCVDeposit,
    fei,
    true
  );
  await rariPool31FeiPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('rariPool31FeiPCVDepositWrapper: ', rariPool31FeiPCVDepositWrapper.address);

  // 26. ERC20 PCV Deposit Wrapper
  const erc20PCVDepositWrapperFactory = await ethers.getContractFactory('ERC20PCVDepositWrapper');
  const feiOATimelockWrapper = await erc20PCVDepositWrapperFactory.deploy(optimisticTimelock, fei, true);
  await feiOATimelockWrapper.deployTransaction.wait();

  logging && console.log('feiOATimelockWrapper: ', feiOATimelockWrapper.address);

  // ----------- Collateralization Contracts ---------------

  // 27. One Constant Oracle
  const constantOracleFactory = await ethers.getContractFactory('ConstantOracle');
  const oneConstantOracle = await constantOracleFactory.deploy(core, 10000);
  await oneConstantOracle.deployTransaction.wait();
  logging && console.log('oneConstantOracle: ', oneConstantOracle.address);

  // 28. Zero Constant Oracle
  const zeroConstantOracle = await constantOracleFactory.deploy(core, 0);
  await zeroConstantOracle.deployTransaction.wait();
  logging && console.log('zeroConstantOracle: ', zeroConstantOracle.address);

  // 29. Collateralization Ratio Oracle
  const collateralizationOracleFactory = await ethers.getContractFactory('CollateralizationOracle');
  const collateralizationOracle = await collateralizationOracleFactory.deploy(
    core,
    [
      staticPcvDepositWrapper.address, // 1
      ethReserveStabilizerWrapper.address, // 2
      daiBondingCurveWrapper.address, // 3
      raiBondingCurveWrapper.address, // 4
      dpiBondingCurveWrapper.address, // 5
      rariPool19DpiPCVDepositWrapper.address, // 6
      ethLidoPCVDepositWrapper.address, // 7
      compoundDaiPCVDepositWrapper.address, // 8
      compoundEthPCVDepositWrapper.address, // 9
      aaveRaiPCVDepositWrapper.address, // 10
      aaveEthPCVDepositWrapper.address, // 11
      rariPool9RaiPCVDepositWrapper.address, // 12
      creamFeiPCVDepositWrapper.address, // 13
      rariPool8FeiPCVDepositWrapper.address, // 14
      rariPool9FeiPCVDepositWrapper.address, // 15
      rariPool7FeiPCVDepositWrapper.address, // 16
      rariPool6FeiPCVDepositWrapper.address, // 17
      rariPool19FeiPCVDepositWrapper.address, // 18
      rariPool24FeiPCVDepositWrapper.address, // 19
      rariPool25FeiPCVDepositWrapper.address, // 20
      rariPool26FeiPCVDepositWrapper.address, // 21
      rariPool27FeiPCVDepositWrapper.address, // 22
      rariPool18FeiPCVDepositWrapper.address, //23
      rariPool28FeiPCVDepositWrapper.address, // 24
      rariPool31FeiPCVDepositWrapper.address, // 25
      feiOATimelockWrapper.address, // 26
      bondingCurve,
      dpiUniswapPCVDeposit,
      uniswapPCVDeposit
    ],
    [dai, dpi, weth, rai, fei, USD_ADDRESS],
    [
      chainlinkDaiUsdOracleWrapper,
      chainlinkDpiUsdOracleWrapper,
      chainlinkEthUsdOracleWrapper,
      chainlinkRaiUsdCompositOracle,
      zeroConstantOracle.address,
      oneConstantOracle.address
    ]
  );
  await collateralizationOracle.deployTransaction.wait();

  logging && console.log('Collateralization Oracle: ', collateralizationOracle.address);

  // 30. Collateralization Ratio Oracle Wrapper Implementation
  const collateralizationOracleWrapperImplFactory = await ethers.getContractFactory('CollateralizationOracleWrapper');
  const collateralizationOracleWrapperImpl = await collateralizationOracleWrapperImplFactory.deploy(
    core,
    1 // not used
  );
  await collateralizationOracleWrapperImpl.deployTransaction.wait();

  logging && console.log('Collateralization Oracle Wrapper Impl: ', collateralizationOracleWrapperImpl.address);

  // 31. Collateralization Ratio Oracle Wrapper Proxy
  // This initialize calldata gets atomically executed against the impl logic
  // upon construction of the proxy
  const collateralizationOracleWrapperInterface = collateralizationOracleWrapperImpl.interface;
  const calldata = collateralizationOracleWrapperInterface.encodeFunctionData('initialize', [
    core,
    collateralizationOracle.address,
    CR_WRAPPER_DURATION,
    CR_WRAPPER_DEVIATION_BPS
  ]);
  const ProxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  const proxy = await ProxyFactory.deploy(collateralizationOracleWrapperImpl.address, proxyAdmin, calldata);
  await proxy.deployTransaction.wait();

  const collateralizationOracleWrapper = await ethers.getContractAt('CollateralizationOracleWrapper', proxy.address);

  logging && console.log('Collateralization Oracle Wrapper Proxy: ', collateralizationOracleWrapper.address);

  return {
    staticPcvDepositWrapper,
    collateralizationOracle,
    collateralizationOracleWrapper
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const staticPcvDepositWrapper: StaticPCVDepositWrapper = contracts.staticPcvDepositWrapper as StaticPCVDepositWrapper;
  const collateralizationOracle: CollateralizationOracle = contracts.collateralizationOracle as CollateralizationOracle;
  const collateralizationOracleWrapper: CollateralizationOracleWrapper =
    contracts.collateralizationOracleWrapper as CollateralizationOracleWrapper;

  const guardianAddress = addresses.multisig;

  const { dai, weth, dpi, rai, fei } = addresses;

  const staticBalances = await staticPcvDepositWrapper.resistantBalanceAndFei();
  expect(staticBalances[0]).to.be.equal(ethers.constants.WeiPerEther.mul(4_000_000));
  expect(staticBalances[1]).to.be.equal(ethers.constants.WeiPerEther.mul(11_500_000));

  const tokens = await collateralizationOracle.getTokensInPcv();
  expect(tokens.length).to.be.equal(6);

  expect(tokens[0]).to.be.equal(USD_ADDRESS);
  expect((await collateralizationOracle.getDepositsForToken(tokens[0])).length).to.be.equal(1);

  expect(tokens[1]).to.be.equal(weth);
  expect((await collateralizationOracle.getDepositsForToken(tokens[1])).length).to.be.equal(6);

  expect(tokens[2]).to.be.equal(dai);
  expect((await collateralizationOracle.getDepositsForToken(tokens[2])).length).to.be.equal(2);

  expect(tokens[3]).to.be.equal(rai);
  expect((await collateralizationOracle.getDepositsForToken(tokens[3])).length).to.be.equal(3);

  expect(tokens[4]).to.be.equal(dpi);
  expect((await collateralizationOracle.getDepositsForToken(tokens[4])).length).to.be.equal(3);

  expect(tokens[5]).to.be.equal(fei);
  expect((await collateralizationOracle.getDepositsForToken(tokens[5])).length).to.be.equal(14);

  expect(await collateralizationOracle.isContractAdmin(guardianAddress)).to.be.true;

  expect(await collateralizationOracleWrapper.collateralizationOracle()).to.be.equal(collateralizationOracle.address);
  expect(await collateralizationOracleWrapper.deviationThresholdBasisPoints()).to.be.equal(500);
  expect(await collateralizationOracleWrapper.isContractAdmin(guardianAddress)).to.be.true;
};
