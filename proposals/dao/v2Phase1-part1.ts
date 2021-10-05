import '@nomiclabs/hardhat-ethers';
import hre, { ethers } from 'hardhat';
import {
  SetupUpgradeFunc,
  ValidateUpgradeFunc,
  RunUpgradeFunc,
  TeardownUpgradeFunc,
  NamedContracts
} from '@custom-types/types';

import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { CollateralizationOracleKeeper, Core, EthBondingCurve, PCVEquityMinter, RatioPCVController, TribeReserveStabilizer, UniswapPCVDeposit } from '@custom-types/contracts';
import { getImpersonatedSigner } from "@test/helpers";

const toBN = ethers.BigNumber.from;

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
    const timelockSigner = await getImpersonatedSigner(addresses.timelock)

    const dpiUniswapPCVDeposit = contracts.dpiUniswapPCVDeposit as UniswapPCVDeposit;
    const uniswapPCVDeposit = contracts.uniswapPCVDeposit as UniswapPCVDeposit;
    const bondingCurve = contracts.bondingCurve as EthBondingCurve;
    const tribeReserveStabilizer = contracts.tribeReserveStabilizer as TribeReserveStabilizer;
    const ratioPCVController = contracts.ratioPCVController as RatioPCVController;
    const pcvEquityMinter = contracts.pcvEquityMinter as PCVEquityMinter;
    const collateralizationOracleKeeper = contracts.collateralizationOracleKeeper as CollateralizationOracleKeeper;
    const core = contracts.core.connect(timelockSigner) as Core;
  
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
}

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
    const core = contracts.core;
    const { uniswapPCVDeposit, dpiUniswapPCVDeposit, bondingCurve } = oldContracts;
  
    // Revoke controller permissions
    await core.revokeMinter(uniswapPCVDeposit.address);
    await core.revokeMinter(dpiUniswapPCVDeposit.address);
    await core.revokeMinter(bondingCurve.address);
}

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {

}