import { ethers } from 'hardhat';
import { getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { DeployUpgradeFunc, NamedContracts } from '@custom-types/types';

const toBN = ethers.BigNumber.from;

// ETH Bonding Curve
const SCALE: string = toBN(1).mul(ethers.constants.WeiPerEther).toString(); // 1 FEI
const BUFFER = '50'; // 0.5%
const DISCOUNT = '0'; // 0%
const BC_DURATION = '86400'; // 1w
const BC_INCENTIVE: string = toBN(500).mul(ethers.constants.WeiPerEther).toString();
const MAX_BASIS_POINTS_FROM_PEG_LP = '100'; // used for dpi uniswap pcv deposit

/*

V2 Phase 1 Upgrade

Part 1 - Deploys the PCV deposits we have to swap out, the new ETH bonding curve, and the ratio PCV controller.
         Grants minter roles to the pcv deposits & the bonding curve, and pcv controller role to the ratio pcv controller.
         Sets bonding curve minting cap maximum for eth bonding curve, and updates the dpi bonding curve allocation. Finally,
         moves pcv from the old eth & dpi uni pcv deposits into the new ones.

----- PART 1 -----

DEPLOY ACTIONS:
1. ETH Uni PCV Deposit
2. DPI Uni PCV Deposit
3. ETH Bonding Curve
4. Ratio PCV Controller

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    feiEthPair,
    sushiswapDpiFei,
    weth,
    chainlinkEthUsdOracleWrapper,
    compositeOracle,
    aaveEthPCVDeposit,
    compoundEthPCVDeposit,
    chainlinkDpiUsdOracleWrapper
  } = addresses;

  const { uniswapRouter: uniswapRouterAddress, sushiswapRouter: sushiswapRouterAddress } = getAllContractAddresses();

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

  logging && console.log(`0/4 Deploying ETH UniswapPCVDeposit...`);
  const uniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');
  const uniswapPCVDeposit = await uniswapPCVDepositFactory.deploy(
    core,
    feiEthPair,
    uniswapRouterAddress,
    chainlinkEthUsdOracleWrapper,
    ethers.constants.AddressZero,
    MAX_BASIS_POINTS_FROM_PEG_LP
  );

  logging && console.log(`1/4 ETH UniswapPCVDeposit deployed to: ${uniswapPCVDeposit.address}`);
  logging && console.log(`Deploying DPI UniswapPCVDeposit...`);

  const dpiUniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');
  const dpiUniswapPCVDeposit = await dpiUniswapPCVDepositFactory.deploy(
    core,
    sushiswapDpiFei,
    sushiswapRouterAddress,
    chainlinkDpiUsdOracleWrapper,
    ethers.constants.AddressZero,
    MAX_BASIS_POINTS_FROM_PEG_LP
  );

  logging && console.log(`2/4 DPI UniswapPCVDeposit deployed to: ${dpiUniswapPCVDeposit.address}`);
  logging && console.log(`Deploying new ETH Bonding curve...`);

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

  logging && console.log(`3/4 Bonding curve deployed to: ${bondingCurve.address}`);
  logging && console.log(`Deploying RatioPCVController...`);

  const ratioPCVControllerFactory = await ethers.getContractFactory('RatioPCVController');
  const ratioPCVController = await ratioPCVControllerFactory.deploy(core);

  logging && console.log(`4/4 Ratio PCV controller deployed to ${ratioPCVController.address}`);

  // debug: deploy pcv passthroughs
  // logging && console.log(`Deploying aavePCVPassthroughFactory`);
  // const aavePCVPassthroughFactory = await ethers.getContractFactory('AavePassthroughETH');
  // const aavePassthroughETH = await aavePCVPassthroughFactory.deploy();

  // logging && console.log(`Deploying compoundPCVPassthroughFactory`);
  // const compoundPCVPassthroughFactory = await ethers.getContractFactory('CompoundPassthroughETH');
  // const compoundPassthroughETH = await compoundPCVPassthroughFactory.deploy();

  return {
    uniswapPCVDeposit,
    dpiUniswapPCVDeposit,
    bondingCurve,
    ratioPCVController
    // aavePassthroughETH,
    // compoundPassthroughETH
  } as NamedContracts;
};
