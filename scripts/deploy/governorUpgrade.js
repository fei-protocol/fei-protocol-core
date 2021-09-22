const FeiDAO = artifacts.require('FeiDAO');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    tribeAddress,
    timelockAddress
  } = addresses;

  if (
    !tribeAddress || !timelockAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const feiDAO = await FeiDAO.new(tribeAddress, timelockAddress);

  logging && console.log('FeiDAO deployed to: ', feiDAO.address);

  return {
    feiDAO
  };
}

module.exports = { deploy };
