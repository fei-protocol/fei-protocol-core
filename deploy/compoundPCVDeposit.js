const EthCompoundPCVDeposit = artifacts.require('EthCompoundPCVDeposit');
const ERC20CompoundPCVDeposit = artifacts.require('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    rariPool8FeiAddress,
    compoundEthAddress,
  } = addresses;

  if (
    !coreAddress || !feiAddress || !rariPool8FeiAddress || !compoundEthAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const rariPool8FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    rariPool8FeiAddress,
    feiAddress,
    { from: deployAddress }
  );
  logging ? console.log('FEI Rari ERC20CompoundPCVDeposit deployed to: ', rariPool8FeiPCVDeposit.address) : undefined;
  
  const compoundEthPCVDeposit = await EthCompoundPCVDeposit.new(
    coreAddress,
    compoundEthAddress,
    { from: deployAddress }
  );
  logging ? console.log('EthCompoundPCVDeposit deployed to: ', compoundEthPCVDeposit.address) : undefined;
  
  return {
    rariPool8FeiPCVDeposit,
    compoundEthPCVDeposit
  };
}

module.exports = { deploy };
