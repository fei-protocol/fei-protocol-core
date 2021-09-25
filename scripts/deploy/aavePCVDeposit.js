const AavePCVDeposit = artifacts.readArtifactSync('AavePCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, wethAddress, aaveLendingPool, aWETHAddress, aaveIncentivesController } = addresses;

  if (!coreAddress || !wethAddress || !aaveLendingPool || !aWETHAddress || !aaveIncentivesController) {
    throw new Error('An environment variable contract address is not set');
  }

  const aaveEthPCVDeposit = await AavePCVDeposit.new(
    coreAddress,
    aaveLendingPool,
    wethAddress,
    aWETHAddress,
    aaveIncentivesController,
    { from: deployAddress }
  );
  logging && console.log('Aave ETH PCV Deposit deployed to: ', aaveEthPCVDeposit.address);

  return {
    aaveEthPCVDeposit
  };
}

module.exports = { deploy };
