const AavePCVDeposit = artifacts.require('AavePCVDeposit');
const PCVDripController = artifacts.require('PCVDripController');
const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');

const e18 = '000000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    wethAddress,
    aaveLendingPool,
    aWETHAddress,
    aaveIncentivesController,
    chainlinkEthUsdOracleWrapperAddress,
    compoundEthPCVDepositAddress
  } = addresses;

  if (
    !coreAddress ||
    !wethAddress ||
    !aaveLendingPool ||
    !aWETHAddress ||
    !aaveIncentivesController ||
    !chainlinkEthUsdOracleWrapperAddress ||
    !compoundEthPCVDepositAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const ethReserveStabilizer = await EthReserveStabilizer.new(
    coreAddress,
    chainlinkEthUsdOracleWrapperAddress,
    chainlinkEthUsdOracleWrapperAddress,
    9900, // $0.99 per FEI
    wethAddress
  );
  const ethReserveStabilizerAddress = ethReserveStabilizer.address;
  logging && console.log('ETH Reserve Stabilizer deployed to: ', ethReserveStabilizer.address);

  const aaveEthPCVDeposit = await AavePCVDeposit.new(
    coreAddress,
    aaveLendingPool,
    wethAddress,
    aWETHAddress,
    aaveIncentivesController,
    { from: deployAddress }
  );
  logging && console.log('Aave ETH PCV Deposit deployed to: ', aaveEthPCVDeposit.address);

  const aaveEthPCVDripController = await PCVDripController.new(
    coreAddress,
    aaveEthPCVDeposit.address,
    ethReserveStabilizerAddress,
    7200, // drip every 2 hours
    `5000${e18}`, // 5000 ETH
    `100${e18}` // 100 FEI incentive
  );

  const compoundEthPCVDripController = await PCVDripController.new(
    coreAddress,
    compoundEthPCVDepositAddress,
    ethReserveStabilizerAddress,
    7200, // drip every 2 hours
    `5000${e18}`, // 5000 ETH
    `100${e18}` // 100 FEI incentive
  );

  return {
    ethReserveStabilizer,
    aaveEthPCVDeposit,
    aaveEthPCVDripController,
    compoundEthPCVDripController
  };
}

module.exports = { deploy };
