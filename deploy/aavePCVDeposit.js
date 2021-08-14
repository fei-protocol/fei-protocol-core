const AavePCVDeposit = artifacts.require('AavePCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    wethAddress,
    aaveLendingPool,
    aETHAddress,
    aaveIncentivesController
  } = addresses;

  if (
    !coreAddress || !wethAddress || !aaveLendingPool || !aETHAddress || !aaveIncentivesController
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const aaveEthPCVDeposit = await AavePCVDeposit.new(
    coreAddress,
    aaveLendingPool,
    wethAddress,
    aETHAddress,
    aaveIncentivesController,
    { from: deployAddress }
  );
  logging ? console.log('Aave ETH PCV Deposit deployed to: ', aaveEthPCVDeposit.address) : undefined;
  
  return {
    aaveEthPCVDeposit
  };
}

module.exports = { deploy };
