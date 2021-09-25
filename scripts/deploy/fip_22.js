const AavePCVDeposit = artifacts.require('AavePCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, feiAddress, aaveLendingPoolAddress, aFeiAddress, aaveTribeIncentivesControllerAddress } =
    addresses;

  if (!coreAddress || !feiAddress || !aaveLendingPoolAddress || !aFeiAddress || !aaveTribeIncentivesControllerAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const aaveFeiPCVDeposit = await AavePCVDeposit.new(
    coreAddress,
    aaveLendingPoolAddress,
    feiAddress,
    aFeiAddress,
    aaveTribeIncentivesControllerAddress
  );
  logging && console.log('Aave FEI PCV Deposit deployed to: ', aaveFeiPCVDeposit.address);

  return {
    aaveFeiPCVDeposit
  };
}

module.exports = { deploy };
