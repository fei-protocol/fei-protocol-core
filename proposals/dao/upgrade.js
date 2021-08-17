async function setup(addresses, oldContracts, contracts, logging) {}

async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    timelockAddress
  } = addresses;

  const { 
    uniswapPCVDeposit,
    uniswapPCVController,
    bondingCurve,
    tribeReserveStabilizer,
    ratioPCVController,
    pcvDripController,
    ethReserveStabilizer,
    core,
    tribe
  } = contracts;

  const oldRatioPCVController = oldContracts.ratioPCVController;

  logging ? console.log('Granting Burner to new UniswapPCVController') : undefined;
  await core.grantBurner(uniswapPCVController.address);

  logging ? console.log('Granting Minter to new UniswapPCVController') : undefined;
  await core.grantMinter(uniswapPCVController.address);

  logging ? console.log('Granting Minter to new BondingCurve') : undefined;
  await core.grantMinter(bondingCurve.address);

  logging ? console.log('Granting Minter to new UniswapPCVDeposit') : undefined;
  await core.grantMinter(uniswapPCVDeposit.address);

  logging ? console.log('Granting Burner to new TribeReserveStabilizer') : undefined;
  await core.grantBurner(tribeReserveStabilizer.address);

  // special role
  // check via tribe contract
  logging ? console.log('Transferring TRIBE Minter role to TribeReserveStabilizer') : undefined;
  await tribe.setMinter(tribeReserveStabilizer.address, {from: timelockAddress});

  logging ? console.log('Granting Burner to new EthReserveStabilizer') : undefined;
  await core.grantBurner(ethReserveStabilizer.address);

  logging ? console.log('Granting PCVController to new RatioPCVController') : undefined;
  await core.grantPCVController(ratioPCVController.address);

  logging ? console.log('Granting PCVController to new PCVDripController') : undefined;
  await core.grantPCVController(pcvDripController.address);

  logging ? console.log('Granting Minter to new PCVDripController') : undefined;
  await core.grantMinter(pcvDripController.address);

  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new
}

/// /  --------------------- NOT RUN ON CHAIN ----------------------
async function teardown(addresses, oldContracts, contracts) {
  const core = await contracts.core;

  const {
    uniswapPCVDeposit,
    uniswapPCVController,
    ethReserveStabilizer,
    ratioPCVController,
    bondingCurve,
  } = oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVController.address);
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);

  await core.revokeBurner(uniswapPCVController.address);
  await core.revokeBurner(ethReserveStabilizer.address);  

  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController.address);
}

module.exports = { setup, run, teardown };
