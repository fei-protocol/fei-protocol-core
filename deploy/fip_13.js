const ERC20CompoundPCVDeposit = artifacts.require('ERC20CompoundPCVDeposit');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    rariPool8FeiAddress,
    creamFeiAddress,
    poolPartyFeiAddress,
    indexCoopFusePoolFeiAddress,
  } = addresses;

  if (
    !coreAddress || !feiAddress || !rariPool8FeiAddress || !creamFeiAddress || !poolPartyFeiAddress || !indexCoopFusePoolFeiAddress
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
  
  const creamFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    creamFeiAddress,
    feiAddress,
    { from: deployAddress }
  );
  logging ? console.log('CREAM FEI ERC20CompoundPCVDeposit deployed to: ', creamFeiPCVDeposit.address) : undefined;
  
  const poolPartyFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    poolPartyFeiAddress,
    feiAddress,
    { from: deployAddress }
  );
  logging ? console.log('Pool Party FEI ERC20CompoundPCVDeposit deployed to: ', poolPartyFeiPCVDeposit.address) : undefined;

  const indexCoopFusePoolFeiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    indexCoopFusePoolFeiAddress,
    feiAddress,
    { from: deployAddress }
  );
  logging ? console.log('Index Coop Fuse FEI ERC20CompoundPCVDeposit deployed to: ', indexCoopFusePoolFeiPCVDeposit.address) : undefined;

  return {
    rariPool8FeiPCVDeposit,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit
  };
}

module.exports = { deploy };
