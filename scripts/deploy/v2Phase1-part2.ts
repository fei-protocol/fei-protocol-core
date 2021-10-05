import { TransactionResponse } from '@ethersproject/abstract-provider';
import { ethers } from 'hardhat';
import { getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { DeployUpgradeFunc, NamedContracts } from '@custom-types/types';

const toBN = ethers.BigNumber.from;

// Constants
const e16 = '0000000000000000';
const e14 = '00000000000000';

// CR oracle wrapper
const CR_WRAPPER_DURATION = '60'; // 1 minute
const CR_WRAPPER_DEVIATION_BPS = '500'; // 5%
const CR_KEEPER_INCENTIVE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 FEI

// Tribe reserve stabilizer
const USD_PER_FEI_BPS = '10000'; // $1 FEI
const CR_THRESHOLD_BPS = '10000'; // 100% CR
const MAX_RESERVE_STABILIZER_MINT_RATE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 TRIBE/s
const RESERVE_STABILIZER_MINT_RATE: string = toBN(100).mul(ethers.constants.WeiPerEther).toString(); // 100 TRIBE/s
const TRIBE_BUFFER_CAP: string = toBN(5000000).mul(ethers.constants.WeiPerEther).toString(); // 5M TRIBE

// LBP swapper
const LBP_FREQUENCY = '604800'; // weekly
const MIN_LBP_SIZE: string = toBN(100000).mul(ethers.constants.WeiPerEther).toString(); // 100k FEI

// PCV Equity Minter
const PCV_EQUITY_MINTER_INCENTIVE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 FEI
const PCV_EQUITY_MINTER_FREQUENCY = '604800'; // weekly
const PCV_EQUITY_MINTER_APR_BPS = '1000'; // 10%

// ERC20Splitter
const SPLIT_DAO_BPS = '2000'; // 20%
const SPLIT_LM_BPS = '2000'; // 20%
const SPLIT_BURN_BPS = '6000'; // 60%

// ETH Bonding Curve
const SCALE: string = toBN(1).mul(ethers.constants.WeiPerEther).toString(); // 1 FEI
const BUFFER = '50'; // 0.5%
const DISCOUNT = '0'; // 0%
const BC_DURATION = '86400'; // 1w
const BC_INCENTIVE: string = toBN(500).mul(ethers.constants.WeiPerEther).toString();

const USD_ADDRESS = '0x1111111111111111111111111111111111111111';

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
6. Eth Lido PCV Deposit Wrapper
7. Cream Fei PCV Deposit Wrapper
8. Compound dai PCV Deposit Wrapper
9. Compound Eth PCV Deposit Wrapper
10. Aave Rai PCV Deposit Wrapper
11. Aave Eth PCV Deposit Wrapper
12. Rari Pool 9 Rai PCV Deposit Wrapper
13. Rari Pool 19 Dpi PCV Deposit Wrapper
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
24. Zero Constant Oracle
25. One Constant Oracle
26. Collateralization Ratio Oracle
27. Collateralization Ratio Oracle Wrapper Implementation
28. Collateralization Ratio Oracle Wrapper Proxy


DAO ACTIONS:
(no actions by the dao)

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiEthPair,
    sushiswapDpiFei,
    weth,
    chainlinkEthUsdOracleWrapper,
    chainlinkRaiUsdCompositOracle,
    chainlinkDaiUsdOracleWrapper,
    compositeOracle,
    aaveEthPCVDeposit,
    compoundEthPCVDeposit,
    chainlinkDpiUsdOracleWrapper,
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
    rariPool9RaiPCVDeposit,
    creamFeiPCVDeposit,
    compoundDaiPCVDeposit,
    aaveRaiPCVDeposit,
    ethLidoPCVDeposit,
    dai,
    dpi,
    rai,
    proxyAdmin,
    erc20Dripper,
    balancerLBPoolFactory
  } = addresses;

  const {
    uniswapRouter: uniswapRouterAddress,
    sushiswapRouter: sushiswapRouterAddress,
    chainlinkTribeEthOracle: chainlinkTribeEthOracleAddress
  } = getAllContractAddresses();

  if (!core || !feiEthPair || !weth || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapper || !compositeOracle) {
    console.log(`core: ${core}`);
    console.log(`feiEtiPair: ${feiEthPair}`);
    console.log(`weth: ${weth}`);
    console.log(`uniswapRouter: ${uniswapRouterAddress}`);
    console.log(`chainlinkEthUsdOracleWrapper: ${chainlinkEthUsdOracleWrapper}`);
    console.log(`compositeOracle: ${compositeOracle}`);

    throw new Error('An environment variable contract address is not set');
  }

  // ----------- PCV Deposit Wrapper Contracts ---------------

  const daiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const daiBondingCurveWrapper = await daiBondingCurveWrapperFactory.deploy(daiBondingCurve, dai, false);

  logging && console.log('daiBondingCurveWrapper: ', daiBondingCurveWrapper.address);

  const compoundDaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');

  const compoundDaiPCVDepositWrapper = await compoundDaiPCVDepositWrapperFactory.deploy(
    compoundDaiPCVDeposit,
    dai,
    false
  );

  logging && console.log('compoundDaiPCVDepositWrapper: ', compoundDaiPCVDepositWrapper.address);

  const raiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const raiBondingCurveWrapper = await raiBondingCurveWrapperFactory.deploy(raiBondingCurve, rai, false);

  logging && console.log('raiBondingCurveWrapper: ', raiBondingCurveWrapper.address);

  const aaveRaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveRaiPCVDepositWrapper = await aaveRaiPCVDepositWrapperFactory.deploy(aaveRaiPCVDeposit, rai, false);

  logging && console.log('aaveRaiPCVDeposit: ', aaveRaiPCVDepositWrapper.address);

  const rariPool9RaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9RaiPCVDepositWrapper = await rariPool9RaiPCVDepositWrapperFactory.deploy(
    rariPool9RaiPCVDeposit,
    rai,
    false
  );

  logging && console.log('rariPool9RaiPCVDepositWrapper: ', rariPool9RaiPCVDepositWrapper.address);

  const dpiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const dpiBondingCurveWrapper = await dpiBondingCurveWrapperFactory.deploy(dpiBondingCurve, dpi, false);

  logging && console.log('dpiBondingCurveWrapper: ', dpiBondingCurveWrapper.address);

  const rariPool19DpiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19DpiPCVDepositWrapper = await rariPool19DpiPCVDepositWrapperFactory.deploy(
    rariPool19DpiPCVDeposit,
    dpi,
    false
  );

  logging && console.log('rariPool19DpiPCVDepositWrapper: ', rariPool19DpiPCVDepositWrapper.address);

  const ethReserveStabilizerWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethReserveStabilizerWrapper = await ethReserveStabilizerWrapperFactory.deploy(
    ethReserveStabilizer,
    weth,
    false
  );

  logging && console.log('ethReserveStabilizerWrapper: ', ethReserveStabilizerWrapper.address);

  const ethLidoPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethLidoPCVDepositWrapper = await ethLidoPCVDepositWrapperFactory.deploy(ethLidoPCVDeposit, weth, false);

  logging && console.log('ethLidoPCVDepositWrapper: ', ethLidoPCVDepositWrapper.address);

  const aaveEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveEthPCVDepositWrapper = await aaveEthPCVDepositWrapperFactory.deploy(aaveEthPCVDeposit, weth, false);

  logging && console.log('aaveEthPCVDepositWrapper: ', aaveEthPCVDepositWrapper.address);

  const compoundEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const compoundEthPCVDepositWrapper = await compoundEthPCVDepositWrapperFactory.deploy(
    compoundEthPCVDeposit,
    weth,
    false
  );

  logging && console.log('compoundEthPCVDepositWrapper: ', compoundEthPCVDepositWrapper.address);

  // ----------- FEI PCV Deposit Wrapper Contracts ---------------

  const rariPool8FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool8FeiPCVDepositWrapper = await rariPool8FeiPCVDepositWrapperFactory.deploy(
    rariPool8FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool8FeiPCVDepositWrapper: ', rariPool8FeiPCVDepositWrapper.address);

  const rariPool9FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9FeiPCVDepositWrapper = await rariPool9FeiPCVDepositWrapperFactory.deploy(
    rariPool9FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool9FeiPCVDepositWrapper: ', rariPool9FeiPCVDepositWrapper.address);

  const rariPool7FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool7FeiPCVDepositWrapper = await rariPool7FeiPCVDepositWrapperFactory.deploy(
    rariPool7FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool7FeiPCVDepositWrapper: ', rariPool7FeiPCVDepositWrapper.address);

  const rariPool6FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool6FeiPCVDepositWrapper = await rariPool6FeiPCVDepositWrapperFactory.deploy(
    rariPool6FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool6FeiPCVDepositWrapper: ', rariPool6FeiPCVDepositWrapper.address);

  const rariPool19FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19FeiPCVDepositWrapper = await rariPool19FeiPCVDepositWrapperFactory.deploy(
    rariPool19FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool19FeiPCVDepositWrapper: ', rariPool19FeiPCVDepositWrapper.address);

  const rariPool24FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool24FeiPCVDepositWrapper = await rariPool24FeiPCVDepositWrapperFactory.deploy(
    rariPool24FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool24FeiPCVDepositWrapper: ', rariPool24FeiPCVDepositWrapper.address);

  const rariPool25FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool25FeiPCVDepositWrapper = await rariPool25FeiPCVDepositWrapperFactory.deploy(
    rariPool25FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool25FeiPCVDepositWrapper: ', rariPool25FeiPCVDepositWrapper.address);

  const rariPool26FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool26FeiPCVDepositWrapper = await rariPool26FeiPCVDepositWrapperFactory.deploy(
    rariPool26FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool26FeiPCVDepositWrapper: ', rariPool26FeiPCVDepositWrapper.address);

  const rariPool27FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool27FeiPCVDepositWrapper = await rariPool27FeiPCVDepositWrapperFactory.deploy(
    rariPool27FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool27FeiPCVDepositWrapper: ', rariPool27FeiPCVDepositWrapper.address);

  const rariPool18FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool18FeiPCVDepositWrapper = await rariPool18FeiPCVDepositWrapperFactory.deploy(
    rariPool18FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool18FeiPCVDepositWrapper: ', rariPool18FeiPCVDepositWrapper.address);

  const creamFeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const creamFeiPCVDepositWrapper = await creamFeiPCVDepositWrapperFactory.deploy(creamFeiPCVDeposit, fei, true);

  logging && console.log('creamFeiPCVDepositWrapper: ', creamFeiPCVDepositWrapper.address);

  const staticPcvDepositWrapperFactory = await ethers.getContractFactory('StaticPCVDepositWrapper');
  const staticPcvDepositWrapper = await staticPcvDepositWrapperFactory.deploy(
    core,
    toBN(4000000).mul(ethers.constants.WeiPerEther).toString(), // 4M PCV for 100k INDEX @ ~$40
    toBN(8500000).mul(ethers.constants.WeiPerEther).toString() // 8.5M FEI in Kashi
  );

  logging && console.log('staticPcvDepositWrapper: ', staticPcvDepositWrapper.address);

  return {
    daiBondingCurveWrapper,
    compoundDaiPCVDepositWrapper,
    raiBondingCurveWrapper,
    aaveRaiPCVDepositWrapper,
    rariPool9RaiPCVDepositWrapper,
    dpiBondingCurveWrapper,
    rariPool19DpiPCVDepositWrapper,
    ethReserveStabilizerWrapper,
    staticPcvDepositWrapper
  } as NamedContracts;
};
