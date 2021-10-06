import {
  BondingCurve,
  Core,
  ERC20CompoundPCVDeposit,
  EthBondingCurve,
  PCVEquityMinter,
  RatioPCVController,
  Timelock,
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

// Genesis functionality (among other stuff) was removed in commit 195415, but obviously not removed from the on-chain core
// Thus we need the original ABI
const OriginalCoreABI = [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_fei","type":"address"}],"name":"FeiUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_genesisGroup","type":"address"}],"name":"GenesisGroupUpdate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_timestamp","type":"uint256"}],"name":"GenesisPeriodComplete","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_to","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"TribeAllocation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_tribe","type":"address"}],"name":"TribeUpdate","type":"event"},{"inputs":[],"name":"BURNER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GOVERN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"GUARDIAN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"MINTER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"PCV_CONTROLLER_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"allocateTribe","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"completeGenesisGroup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"bytes32","name":"adminRole","type":"bytes32"}],"name":"createRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"fei","outputs":[{"internalType":"contract IFei","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genesisGroup","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"uint256","name":"index","type":"uint256"}],"name":"getRoleMember","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleMemberCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"burner","type":"address"}],"name":"grantBurner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"governor","type":"address"}],"name":"grantGovernor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"guardian","type":"address"}],"name":"grantGuardian","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"}],"name":"grantMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"pcvController","type":"address"}],"name":"grantPCVController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"hasGenesisGroupCompleted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"init","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isBurner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isGovernor","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isGuardian","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isMinter","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"isPCVController","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"burner","type":"address"}],"name":"revokeBurner","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"governor","type":"address"}],"name":"revokeGovernor","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"guardian","type":"address"}],"name":"revokeGuardian","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"minter","type":"address"}],"name":"revokeMinter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeOverride","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"pcvController","type":"address"}],"name":"revokePCVController","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"setFei","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_genesisGroup","type":"address"}],"name":"setGenesisGroup","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"}],"name":"setTribe","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"tribe","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"}];

/*

V2 Phase 1 Upgrade

Part 1 - Deploys the PCV deposits we have to swap out, the new ETH bonding curve, and the ratio PCV controller.
         Grants minter roles to the pcv deposits & the bonding curve, and pcv controller role to the ratio pcv controller.
         Sets bonding curve minting cap maximum for eth bonding curve, and updates the dpi bonding curve allocation. Finally,
         moves pcv from the old eth & dpi uni pcv deposits into the new ones.

----- PART 1 -----

DAO ACTIONS:

-- actions 1-4 fix the old-eth-bonding-curve allocation bug -- 
1. Call setGenesisGroup(timelockAddress) on core so that we can allocate from the timelock
2. Call setAllocation on the old eth bonding curve, with parameters [aavePassthroughETH, compoundPassthroughETH] and [5000, 5000]
3. Call allocate() on the old eth bonding curve
4. Reset the genesis group back to the actual genesis contract.

-- actions 5-8 grant roles to new contracts -- 
5. Grant Minter role to new ETH BondingCurve
6. Grant Minter role to new ETH Uni PCV Deposit
7. Grant Minter role to new DPI Uni PCV Deposit
8. Grant Minter role to new Ratio PCV Controller
9. Grant PCV Controller role to new RatioPCVController

-- actions 10-13 do misc stuff -- 
10. Set ETH Bonding Curve Minting Cap Max
11. Set DPI Bonding Curve allocation
12. Move PCV from old ETH Uni PCV Deposit to new
13. Move PCV from old DPI Uni PCV Deposit to new

-- actions 14-19 revoke roles on old contracts --
14. Revokes the minter role from the old uniswap pcv deposit.
15. Revokes the minter role from the old dpi uniswap pcv deposit
16. Revokes the minter role from the old eth bonding curve.
17. Revokes the pcv controller role from the old ratio pcv controller.
18. Revokes the pcv controller role from the old uniswap pcv controller.
19. Revokes the minter role from the old uniswap pcv controller.

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
  const newEthBondingCurve = contracts.bondingCurve as EthBondingCurve;
  const oldEthBondingCurve = oldContracts.bondingCurve as EthBondingCurve;
  const ratioPCVController = contracts.ratioPCVController as RatioPCVController;
  const pcvEquityMinter = contracts.pcvEquityMinter as PCVEquityMinter;
  const dpiBondingCurve = contracts.dpiBondingCurve as BondingCurve;
  const timelock = contracts.timelock as Timelock;

  // Need to use the original ABI otherwise it'll throw at runtime
  const core = await ethers.getContractAt(OriginalCoreABI, addresses.core);

  logging && console.log(`1/19 Setting genesis group to the timelock address.`)
  await core.setGenesisGroup(timelock.address);

  logging && console.log(`2/19 Setting allocation on old eth bonding curve.`)
  await oldEthBondingCurve.setAllocation(
    [addresses.aavePassthroughETH, addresses.compoundPassthroughETH],
    [5000, 5000]
  )

  logging && console.log(`3/19 Calling allocate() on old eth bonding curve.`)
  await oldEthBondingCurve.allocate();

  logging && console.log(`4/19 Resetting geneisis group to actual genesis group contract.`)
  await core.setGenesisGroup(addresses.genesisGroup);

  logging && console.log('5/19 Granting Minter role to new BondingCurve');
  await core.grantMinter(newEthBondingCurve.address);

  logging && console.log('6/19 Granting Minter role to new DPI UniswapPCVDeposit');
  await core.grantMinter(dpiUniswapPCVDeposit.address);

  logging && console.log('7/19 Granting Minter role to new UniswapPCVDeposit');
  await core.grantMinter(uniswapPCVDeposit.address);

  logging && console.log('8/19 Granting Minter role to new PCVEquityMinter');
  await core.grantMinter(pcvEquityMinter.address);

  logging && console.log('9/19 Granting PCVController role to new RatioPCVController');
  await core.grantPCVController(ratioPCVController.address);

  logging && console.log('10/19 Setting mint cap on new eth bonding curve.');
  await newEthBondingCurve.setMintCap(ethers.constants.MaxUint256);

  logging && console.log(`11/19 Setting allocation for dpi bonding curve......`);
  await dpiBondingCurve.setAllocation(
    [dpiUniswapPCVDeposit.address, rariPool19DpiPCVDeposit.address],
    ['9000', '1000']
  );

  logging && console.log(`12/19 Withdrawing 100% ratio from old uniswap pcv deposit to new.`);
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  logging && console.log(`13/19 Withdrawing 100% ratio from old dpi uniswap pcv deposit to new.`);
  await ratioPCVController.withdrawRatio(
    oldContracts.dpiUniswapPCVDeposit.address,
    dpiUniswapPCVDeposit.address,
    '10000'
  ); // move 100% of PCV from old -> new

  // Revoke controller permissions

  logging && console.log(`14/19 Revoking minter role from old uniswap PCV deposit.`)
  await core.revokeMinter(oldContracts.uniswapPCVDeposit.address);

  logging && console.log(`15/19 Revoking minter role from old dpi uniswap pcv deposit.`)
  await core.revokeMinter(oldContracts.dpiUniswapPCVDeposit.address);

  logging && console.log(`16/19 Revoking minter role from old eth bonding curve.`)
  await core.revokeMinter(oldContracts.bondingCurve.address);

  // Revoke roles on old pcv controllers
  logging && console.log(`17/19 Revoking pcv controller role from old ratio pcv controller.`)
  await core.revokePCVController(oldContracts.ratioPCVController.address);

  logging && console.log(`18/19 Revoking pcv controller role from old uniswap pcv controller.`)
  await core.revokePCVController(oldContracts.uniswapPCVController.address);

  logging && console.log(`19/19 Revoking minter role from old uniswap pcv controller.`)
  await core.revokeMinter(oldContracts.uniswapPCVController.address);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  logging && console.log(`Nothing to do in teardown function of v2Phase1-part1.`);
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  // todo
};
