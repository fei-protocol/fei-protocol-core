const ERC20CompoundPCVDeposit = artifacts.require('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, feiAddress, rariPool22FeiAddress } = addresses;

  if (!coreAddress || !feiAddress || !rariPool22FeiAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const rariPool22FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool22FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging && console.log('Rari Pool 22 FEI ERC20CompoundPCVDeposit deployed to: ', rariPool22FeiPCVDeposit.address);

  return {
    rariPool22FeiPCVDeposit
  };
}

module.exports = { deploy };
