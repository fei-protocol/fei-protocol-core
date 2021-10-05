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

  // ----------- Replacement Contracts ---------------
  const uniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');
  const uniswapPCVDeposit = await uniswapPCVDepositFactory.deploy(
    core,
    feiEthPair,
    uniswapRouterAddress,
    chainlinkEthUsdOracleWrapper,
    ethers.constants.AddressZero,
    '100'
  );

  logging && console.log('ETH UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address);

  const dpiUniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');

  const dpiUniswapPCVDeposit = await dpiUniswapPCVDepositFactory.deploy(
    core,
    sushiswapDpiFei,
    sushiswapRouterAddress,
    chainlinkDpiUsdOracleWrapper,
    ethers.constants.AddressZero,
    '100'
  );

  logging && console.log('DPI UniswapPCVDeposit deployed to: ', dpiUniswapPCVDeposit.address);

  const bondingCurveFactory = await ethers.getContractFactory('EthBondingCurve');
  const bondingCurve = await bondingCurveFactory.deploy(
    core,
    chainlinkEthUsdOracleWrapper,
    ethers.constants.AddressZero,
    {
      scale: SCALE,
      buffer: BUFFER,
      discount: DISCOUNT,
      pcvDeposits: [aaveEthPCVDeposit, compoundEthPCVDeposit],
      ratios: [5000, 5000],
      duration: BC_DURATION,
      incentive: BC_INCENTIVE
    }
  );

  logging && console.log('Bonding curve deployed to: ', bondingCurve.address);

  const ratioPCVControllerFactory = await ethers.getContractFactory('RatioPCVController');
  const ratioPCVController = await ratioPCVControllerFactory.deploy(core);

  logging && console.log('Ratio PCV controller', ratioPCVController.address);

  return {
    uniswapPCVDeposit,
    dpiUniswapPCVDeposit,
    bondingCurve,
    ratioPCVController
  } as NamedContracts;
};
