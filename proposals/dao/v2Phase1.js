const { constants: { MAX_UINT256 } } = require('@openzeppelin/test-helpers');
const { expect } = require('../../test/helpers');

async function setup(addresses, oldContracts, contracts, logging) {}

/*
V2 Phase 1 Upgrade Steps
1. Grant Minter new ETH BondingCurve
2. Grant Minter new ETH Uni PCV Deposit
3. Grant Minter new DPI Uni PCV Deposit
4. Grant Burner new TribeReserveStabilizer
5. Grant PCV Controller new RatioPCVController
6. Grant Minter PCV Equity Minter
7. Grant Minter Collateralization Oracle Keeper
8. Grant Tribe Minter to Tribe Reserve Stabilizer
9. Set ETH Bonding Curve Minting Cap Max
10. Move PCV from old ETH Uni PCV Deposit to new
11. Move PCV from old DPI Uni PCV Deposit to new
12. TODO: Seed TRIBE to LBP Swapper
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    timelockAddress
  } = addresses;

  const { 
    dpiUniswapPCVDeposit,
    uniswapPCVDeposit,
    bondingCurve,
    tribeReserveStabilizer,
    ratioPCVController,
    pcvEquityMinter,
    collateralizationOracleKeeper,
    core,
    tribe
  } = contracts;

  const oldRatioPCVController = oldContracts.ratioPCVController;

  logging && console.log('Granting Minter to new BondingCurve');
  await core.grantMinter(bondingCurve.address);

  logging && console.log('Granting Minter to new DPI UniswapPCVDeposit');
  await core.grantMinter(dpiUniswapPCVDeposit.address);

  logging && console.log('Granting Minter to new UniswapPCVDeposit');
  await core.grantMinter(uniswapPCVDeposit.address);

  logging && console.log('Granting Burner to new TribeReserveStabilizer');
  await core.grantBurner(tribeReserveStabilizer.address);

  logging && console.log('Granting PCVController to new RatioPCVController');
  await core.grantPCVController(ratioPCVController.address);

  logging && console.log('Granting Minter to new PCVEquityMinter');
  await core.grantMinter(pcvEquityMinter.address);

  logging && console.log('Granting Minter to new CollateralizationOracleKeeper');
  await core.grantMinter(collateralizationOracleKeeper.address);

  // special role
  // check via tribe contract
  logging && console.log('Transferring TRIBE Minter role to TribeReserveStabilizer');
  await tribe.setMinter(tribeReserveStabilizer.address, {from: timelockAddress});

  await bondingCurve.setMintCap(MAX_UINT256);
  
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  await ratioPCVController.withdrawRatio(oldContracts.dpiUniswapPCVDeposit.address, dpiUniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new
}

/// /  --------------------- NOT RUN ON CHAIN ----------------------
/* 
 revoke minter from old bonding curve, eth uni pcv deposit, dpi pcv deposit, uni pcv controller
 revoke pcv controller from uni pcv controller, ratioPCVController
 deposit eth and dpi Uni PCV deposits
*/
async function teardown(addresses, oldContracts, contracts) {
  const core = await contracts.core;

  const {
    uniswapPCVDeposit,
    dpiUniswapPCVDeposit,
    uniswapPCVController,
    ratioPCVController,
    bondingCurve,
  } = oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVController.address);
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(dpiUniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);

  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController.address);

  // Deposit Uni and DPI
  await contracts.dpiUniswapPCVDeposit.deposit();
  await contracts.uniswapPCVDeposit.deposit();
}

async function validate(addresses, oldContracts, contracts) {
  const { 
    daiAddress,
    dpiAddress,
    raiAddress,
    feiAddress,
    wethAddress, 
  } = addresses;
  const { 
    collateralizationOracle,
    collateralizationOracleWrapperImpl, 
    collateralizationOracleWrapper,
    core, 
    proxyAdmin,
    feiTribeLBPSwapper 
  } = contracts;
    
  const pcvStatsCurrent = await collateralizationOracleWrapper.pcvStatsCurrent();
  const pcvStats = await collateralizationOracle.pcvStats();

  expect(pcvStatsCurrent[0]).to.be.bignumber.equal(pcvStats[0]);
  expect(pcvStatsCurrent[1]).to.be.bignumber.equal(pcvStats[1]);
  expect(pcvStatsCurrent[2]).to.be.bignumber.equal(pcvStats[2]);
  expect(pcvStatsCurrent[3]).to.be.equal(pcvStats[3]);

  const update = await collateralizationOracleWrapper.update();
  console.log(`update gas: ${update.receipt.gasUsed}`);

  expect((await collateralizationOracle.getTokensInPcv()).length).to.be.equal(4);
  expect((await collateralizationOracle.getDepositsForToken(daiAddress)).length).to.be.equal(2);
  expect((await collateralizationOracle.getDepositsForToken(dpiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(raiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(wethAddress)).length).to.be.equal(6);

  expect(await feiTribeLBPSwapper.CONTRACT_ADMIN_ROLE()).to.be.not.equal(await core.GOVERN_ROLE());
    
  expect(await proxyAdmin.getProxyImplementation(collateralizationOracleWrapper.address)).to.be.equal(collateralizationOracleWrapperImpl.address);
  expect(await proxyAdmin.getProxyAdmin(collateralizationOracleWrapper.address)).to.be.equal(proxyAdmin.address);
}

module.exports = { 
  setup, 
  run, 
  teardown, 
  validate 
};
