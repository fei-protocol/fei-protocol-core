const ERC20CompoundPCVDeposit = artifacts.readArtifactSync('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    rariPool6FeiAddress,
    rariPool7FeiAddress,
    rariPool8FeiAddress,
    rariPool24FeiAddress,
    creamFeiAddress,
    poolPartyFeiAddress,
    indexCoopFusePoolFeiAddress
  } = addresses;

  if (
    !coreAddress ||
    !feiAddress ||
    !rariPool8FeiAddress ||
    !creamFeiAddress ||
    !poolPartyFeiAddress ||
    !indexCoopFusePoolFeiAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const rariPool6FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool6FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging
    ? console.log('FEI Fuse Pool 6 ERC20CompoundPCVDeposit deployed to: ', rariPool6FeiPCVDeposit.address)
    : undefined;

  const rariPool7FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool7FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging
    ? console.log('FEI Fuse Pool 7 ERC20CompoundPCVDeposit deployed to: ', rariPool7FeiPCVDeposit.address)
    : undefined;

  const rariPool8FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool8FeiAddress, feiAddress, {
    from: deployAddress
  });

  logging ? console.log('FEI Rari ERC20CompoundPCVDeposit deployed to: ', rariPool8FeiPCVDeposit.address) : undefined;

  const rariPool24FeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, rariPool24FeiAddress, feiAddress, {
    from: deployAddress
  });
  logging
    ? console.log('FEI Fuse Pool 24 ERC20CompoundPCVDeposit deployed to: ', rariPool24FeiPCVDeposit.address)
    : undefined;

  const creamFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, creamFeiAddress, feiAddress, {
    from: deployAddress
  });
  logging ? console.log('CREAM FEI ERC20CompoundPCVDeposit deployed to: ', creamFeiPCVDeposit.address) : undefined;

  const poolPartyFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, poolPartyFeiAddress, feiAddress, {
    from: deployAddress
  });
  logging
    ? console.log('Pool Party FEI ERC20CompoundPCVDeposit deployed to: ', poolPartyFeiPCVDeposit.address)
    : undefined;

  const indexCoopFusePoolFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    indexCoopFusePoolFeiAddress,
    feiAddress,
    { from: deployAddress }
  );
  logging
    ? console.log('Index Coop Fuse FEI ERC20CompoundPCVDeposit deployed to: ', indexCoopFusePoolFeiPCVDeposit.address)
    : undefined;

  return {
    rariPool6FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool8FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit
  };
}

module.exports = { deploy };
