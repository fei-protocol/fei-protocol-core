const { constants: { MAX_UINT256 } } = require('@openzeppelin/test-helpers');
import '@nomiclabs/hardhat-ethers'
import hre, { ethers } from 'hardhat'
import { DeployUpgradeFunc, SetupUpgradeFunc, ValidateUpgradeFunc, RunUpgradeFunc, TeardownUpgradeFunc } from "../../test/integration/setup/types"

import chai from "chai";
import { expect } from "chai";
import CBN from "chai-bn";

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

const e18 = '000000000000000000';

const setup: SetupUpgradeFunc = async(addresses, oldContracts, contracts, logging) => {

  const {
    timelock
  } = addresses;
  
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock],
  });
}

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
12. Seed TRIBE to LBP Swapper
13. Update DPI Bonding Curve allocation
*/
const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const {
    timelock: timelockAddress,
    rariPool19DpiPCVDeposit: rariPool19DpiPCVDepositAddress
  } = addresses;

  const { 
    dpiUniswapPCVDeposit,
    uniswapPCVDeposit,
    bondingCurve,
    dpiBondingCurve,
    tribeReserveStabilizer,
    ratioPCVController,
    pcvEquityMinter,
    collateralizationOracleKeeper,
    feiTribeLBPSwapper,
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

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  const timelockSigner = await ethers.getSigner(timelockAddress)

  await tribe.connect(timelockSigner).setMinter(tribeReserveStabilizer.address);

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [timelockAddress],
  });

  logging && console.log('Setting mint cap.');
  await bondingCurve.setMintCap(ethers.constants.MaxUint256);
  
  logging && console.log(`Withdrawing ratio from old uniswap pcv deposit to new.`)
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  await ratioPCVController.withdrawRatio(oldContracts.dpiUniswapPCVDeposit.address, dpiUniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  logging && console.log(`Allocating Tribe...`)
  await core.allocateTribe(feiTribeLBPSwapper.address, `1000000${e18}`);

  logging && console.log(`Setting allocation...`)
  await dpiBondingCurve.setAllocation([dpiUniswapPCVDeposit.address, rariPool19DpiPCVDepositAddress], ['9000', '1000']);
}

/// /  --------------------- NOT RUN ON CHAIN ----------------------
/* 
 revoke minter from old bonding curve, eth uni pcv deposit, dpi pcv deposit, uni pcv controller
 revoke pcv controller from uni pcv controller, ratioPCVController
 deposit eth and dpi Uni PCV deposits
*/
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts) => {
  console.log(`Beginning teardown phase...`)

  const core = contracts.core;

  const  { uniswapPCVController } = addresses;
  const {
    uniswapPCVDeposit,
    dpiUniswapPCVDeposit,
    ratioPCVController,
    bondingCurve,
  } = oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVController);
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(dpiUniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);

  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController);

  // Deposit Uni and DPI
  await contracts.dpiUniswapPCVDeposit.deposit();
  await contracts.uniswapPCVDeposit.deposit();

  console.log(`Teardown phase complete.`)
}

const validate: ValidateUpgradeFunc = async(addresses, oldContracts, contracts) => {
  console.log(`Beginning validation phase...`)

  const { 
    dai: daiAddress,
    dpi: dpiAddress,
    rai: raiAddress,
    fei: feiAddress,
    weth: wethAddress, 
  } = addresses;
  const { 
    collateralizationOracle,
    collateralizationOracleWrapperImpl, 
    collateralizationOracleWrapper,
    core, 
    proxyAdmin,
    feiTribeLBPSwapper 
  } = contracts;
    
  console.log(`Getting pcv stats...`)
  const pcvStatsCurrent = await collateralizationOracleWrapper.pcvStatsCurrent();
  const pcvStats = await collateralizationOracle.pcvStats();

  expect(pcvStatsCurrent[0].toString()).to.be.equal(pcvStats[0].toString());
  expect(pcvStatsCurrent[1].toString()).to.be.equal(pcvStats[1].toString());
  expect(pcvStatsCurrent[2].toString()).to.be.equal(pcvStats[2].toString());
  expect(pcvStatsCurrent[3].toString()).to.be.equal(pcvStats[3].toString());

  console.log(`Updating collateralization oracle...`)
  const updateTx = await collateralizationOracleWrapper.update();

  //console.log(`Update gas: ${update.receipt.gasUsed}`);

  expect((await collateralizationOracle.getTokensInPcv()).length).to.be.equal(6);
  expect((await collateralizationOracle.getDepositsForToken(daiAddress)).length).to.be.equal(2);
  expect((await collateralizationOracle.getDepositsForToken(dpiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(raiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(wethAddress)).length).to.be.equal(6);
  expect((await collateralizationOracle.getDepositsForToken(feiAddress)).length).to.be.equal(11);

  expect(await feiTribeLBPSwapper.CONTRACT_ADMIN_ROLE()).to.be.not.equal(await core.GOVERN_ROLE());
    
  expect(await proxyAdmin.getProxyImplementation(collateralizationOracleWrapper.address)).to.be.equal(collateralizationOracleWrapperImpl.address);
  expect(await proxyAdmin.getProxyAdmin(collateralizationOracleWrapper.address)).to.be.equal(proxyAdmin.address);

  console.log(`Validation phase complete.`)
}

module.exports = { 
  setup, 
  run, 
  teardown, 
  validate 
};
