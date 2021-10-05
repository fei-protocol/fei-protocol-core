import { TransactionResponse } from '@ethersproject/abstract-provider';
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
