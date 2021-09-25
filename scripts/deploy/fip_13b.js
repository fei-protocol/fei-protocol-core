const ERC20CompoundPCVDeposit = artifacts.readArtifactSync('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    rariPool9FeiAddress,
    rariPool25FeiAddress,
    rariPool26FeiAddress,
    rariPool27FeiAddress
  } = addresses;

  if (
    !coreAddress ||
    !feiAddress ||
    !rariPool9FeiAddress ||
    !rariPool25FeiAddress ||
    !rariPool26FeiAddress ||
    !rariPool27FeiAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const rariPool9FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool9FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging
    ? console.log('FEI Fuse Pool 9 ERC20CompoundPCVDeposit deployed to: ', rariPool9FeiPCVDeposit.address)
    : undefined;

  const rariPool25FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool25FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging
    ? console.log('FEI Fuse Pool 25 ERC20CompoundPCVDeposit deployed to: ', rariPool25FeiPCVDeposit.address)
    : undefined;

  const rariPool26FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool26FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging
    ? console.log('FEI Fuse Pool 26 ERC20CompoundPCVDeposit deployed to: ', rariPool26FeiPCVDeposit.address)
    : undefined;

  const rariPool27FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool27FeiAddress, feiAddress, {
    from: deployAddress
  });
  logging
    ? console.log('FEI Fuse Pool 27 ERC20CompoundPCVDeposit deployed to: ', rariPool27FeiPCVDeposit.address)
    : undefined;

  return {
    rariPool9FeiPCVDeposit,
    rariPool25FeiPCVDeposit,
    rariPool26FeiPCVDeposit,
    rariPool27FeiPCVDeposit
  };
}

module.exports = { deploy };
