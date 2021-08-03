const EthCompoundPCVDeposit = artifacts.require('EthCompoundPCVDeposit');
const ERC20CompoundPCVDeposit = artifacts.require('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    rariPool8FeiAddress,
    rariPool8EthAddress
  } = addresses;

  if (
    !coreAddress || !feiAddress || !rariPool8FeiAddress || !rariPool8EthAddress
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
  
  const rariPool8EthPCVDeposit = await EthCompoundPCVDeposit.new(
    coreAddress,
    rariPool8EthAddress,
    { from: deployAddress }
  );
  logging ? console.log('FEI Rari EthCompoundPCVDeposit deployed to: ', rariPool8EthAddress.address) : undefined;
  
  return {
    rariPool8FeiPCVDeposit,
    rariPool8EthPCVDeposit
  };
}

module.exports = { deploy };
