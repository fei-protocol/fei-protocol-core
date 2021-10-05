import {
    BondingCurve,
    CollateralizationOracleKeeper,
    Core,
    ERC20CompoundPCVDeposit,
    EthBondingCurve,
    PCVEquityMinter,
    RatioPCVController,
    TribeReserveStabilizer,
    UniswapPCVDeposit
} from '@custom-types/contracts';
import {
    RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc
} from '@custom-types/types';
import '@nomiclabs/hardhat-ethers';
import chai from 'chai';
import CBN from 'chai-bn';
import hre, { ethers } from 'hardhat';

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

/*

V2 Phase 1 Upgrade

Part 1 - Deploys the PCV deposits we have to swap out, the new ETH bonding curve, and the ratio PCV controller.
         Grants minter roles to the pcv deposits & the bonding curve, and pcv controller role to the ratio pcv controller.
         Sets bonding curve minting cap maximum for eth bonding curve, and updates the dpi bonding curve allocation. Finally,
         moves pcv from the old eth & dpi uni pcv deposits into the new ones.

----- PART 1 -----

DEPLOY ACTIONS:
1. ETH Uni PCV Deposit
2. DPI Uni PCV Deposit
3. ETH Bonding Curve
4. Ratio PCV Controller

DAO ACTIONS:
1. Grant Minter role to new ETH BondingCurve
2. Grant Minter role to new ETH Uni PCV Deposit
3. Grant Minter role to new DPI Uni PCV Deposit
4. Grant PCV Controller role to new RatioPCVController
5. Set ETH Bonding Curve Minting Cap Max
6. Update DPI Bonding Curve allocation
7. Move PCV from old ETH Uni PCV Deposit to new
8. Move PCV from old DPI Uni PCV Deposit to new
*/

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { timelock } = addresses;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock]
  });
};

export const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const rariPool19DpiPCVDeposit = contracts.rariPool19DpiPCVDeposit as ERC20CompoundPCVDeposit;
  const oldRatioPCVController = contracts.ratioPCVController as RatioPCVController;
  const dpiUniswapPCVDeposit = contracts.dpiUniswapPCVDeposit as UniswapPCVDeposit;
  const uniswapPCVDeposit = contracts.uniswapPCVDeposit as UniswapPCVDeposit;
  const bondingCurve = contracts.bondingCurve as EthBondingCurve;
  const tribeReserveStabilizer = contracts.tribeReserveStabilizer as TribeReserveStabilizer;
  const ratioPCVController = contracts.ratioPCVController as RatioPCVController;
  const pcvEquityMinter = contracts.pcvEquityMinter as PCVEquityMinter;
  const collateralizationOracleKeeper = contracts.collateralizationOracleKeeper as CollateralizationOracleKeeper;
  const dpiBondingCurve = contracts.dpiBondingCurve as BondingCurve;
  const core = contracts.core as Core;

  logging && console.log('Granting Minter role to new BondingCurve');
  await core.grantMinter(bondingCurve.address);

  logging && console.log('Granting Minter role to new DPI UniswapPCVDeposit');
  await core.grantMinter(dpiUniswapPCVDeposit.address);

  logging && console.log('Granting Minter role to new UniswapPCVDeposit');
  await core.grantMinter(uniswapPCVDeposit.address);

  logging && console.log('Granting Burner role to new TribeReserveStabilizer');
  await core.grantBurner(tribeReserveStabilizer.address);

  logging && console.log('Granting PCVController role to new RatioPCVController');
  await core.grantPCVController(ratioPCVController.address);

  logging && console.log('Granting Minter role to new PCVEquityMinter');
  await core.grantMinter(pcvEquityMinter.address);

  logging && console.log('Granting Minter role to new CollateralizationOracleKeeper');
  await core.grantMinter(collateralizationOracleKeeper.address);

  logging && console.log(`Withdrawing 100% ratio from old uniswap pcv deposit to new.`);
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  logging && console.log(`Withdrawing 100% ratio from old dpi uniswap pcv deposit to new.`);
  await ratioPCVController.withdrawRatio(
    oldContracts.dpiUniswapPCVDeposit.address,
    dpiUniswapPCVDeposit.address,
    '10000'
  ); // move 100% of PCV from old -> new

  logging && console.log(`Setting allocation...`);
  await dpiBondingCurve.setAllocation(
    [dpiUniswapPCVDeposit.address, rariPool19DpiPCVDeposit.address],
    ['9000', '1000']
  );

  logging && console.log('Setting mint cap.');
  await bondingCurve.setMintCap(ethers.constants.MaxUint256);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const core = contracts.core;
  const { uniswapPCVDeposit, dpiUniswapPCVDeposit, bondingCurve, ratioPCVController, uniswapPCVController } =
    oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(dpiUniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);

  // Deposit Uni and DPI
  await contracts.dpiUniswapPCVDeposit.deposit();
  await contracts.uniswapPCVDeposit.deposit();

  // Revoke roles on old pcv controllers
  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController);
  await core.revokeMinter(uniswapPCVController);
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {};
