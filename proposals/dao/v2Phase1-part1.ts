import {
  BondingCurve,
  Core,
  ERC20CompoundPCVDeposit,
  EthBondingCurve,
  PCVEquityMinter,
  RatioPCVController,
  UniswapPCVDeposit
} from '@custom-types/contracts';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
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
9. Sets allocation on the DPI bonding curve
11. Revokes the minter role from the old uniswap pcv deposit.
12. Revokes the minter role from the old dpi uniswap pcv dpeosit.
13. Revokes the minter role from the old eth bonding curve.
16. Revokes the pcv controller role from the old ratio pcv controller.
17. Revokes the pcv controller role from the old uniswap pcv controller.
18. Revokes the minter role from the old uniswap pcv controller.

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
  const ratioPCVController = contracts.ratioPCVController as RatioPCVController;
  const pcvEquityMinter = contracts.pcvEquityMinter as PCVEquityMinter;
  const dpiBondingCurve = contracts.dpiBondingCurve as BondingCurve;
  const core = contracts.core as Core;

  logging && console.log('Granting Minter role to new BondingCurve');
  await core.grantMinter(bondingCurve.address);

  logging && console.log('Granting Minter role to new DPI UniswapPCVDeposit');
  await core.grantMinter(dpiUniswapPCVDeposit.address);

  logging && console.log('Granting Minter role to new UniswapPCVDeposit');
  await core.grantMinter(uniswapPCVDeposit.address);

  logging && console.log('Granting PCVController role to new RatioPCVController');
  await core.grantPCVController(ratioPCVController.address);

  logging && console.log('Granting Minter role to new PCVEquityMinter');
  await core.grantMinter(pcvEquityMinter.address);

  logging && console.log(`Withdrawing 100% ratio from old uniswap pcv deposit to new.`);
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  logging && console.log(`Withdrawing 100% ratio from old dpi uniswap pcv deposit to new.`);
  await ratioPCVController.withdrawRatio(
    oldContracts.dpiUniswapPCVDeposit.address,
    dpiUniswapPCVDeposit.address,
    '10000'
  ); // move 100% of PCV from old -> new

  logging && console.log(`Setting allocation for dpi bonding curve......`);
  await dpiBondingCurve.setAllocation(
    [dpiUniswapPCVDeposit.address, rariPool19DpiPCVDeposit.address],
    ['9000', '1000']
  );

  logging && console.log('Setting mint cap on new eth bonding curve.');
  await bondingCurve.setMintCap(ethers.constants.MaxUint256);

  // Revoke controller permissions
  await core.revokeMinter(oldContracts.uniswapPCVDeposit.address);
  await core.revokeMinter(oldContracts.dpiUniswapPCVDeposit.address);
  await core.revokeMinter(oldContracts.bondingCurve.address);

  // Revoke roles on old pcv controllers
  await core.revokePCVController(oldContracts.ratioPCVController.address);
  await core.revokePCVController(oldContracts.uniswapPCVController.address);
  await core.revokeMinter(oldContracts.uniswapPCVController.address);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  logging && console.log(`Nothing to do in teardown function of v2Phase1-part1.`);
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  // todo
};
