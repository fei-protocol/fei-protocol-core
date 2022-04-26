import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

DAO Proposal #99

Description: Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure

Steps:
  1 - Move 80% of PCV RAI to AAVE from Fuse Pool 9 via the ratioPCVControllerV2
  2 - Call depsoit() on the aave rai pcv deposit
  3 - Grant the MINTER role to the rai psm
  4 - Grant the PCV_CONTROLLER role to the rai dripper
  5 - Pause Redeem on the rai psm
  6 - Whitelist the fuse pool 9 rai pcv deposit on the pcv guardian
  7 - Whitelist the aave rai pcv deposit on the pcv guardian
*/

const fipNumber = '99'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const priceBoundPSMFactory = await ethers.getContractFactory('PriceBoundPSM');
  const raiPriceBoundPSM = await priceBoundPSMFactory.deploy(
    30_000,
    ethers.constants.WeiPerEther,
    {
      coreAddress: addresses.core,
      oracleAddress: addresses.chainlinkRaiUsdCompositeOracle,
      backupOracle: ethers.constants.AddressZero,
      decimalsNormalizer: 18,
      doInvert: false
    },
    0, // mint fee = 0 bp
    0, // redeem fee = 0 bp
    2_000_000, // reserves threshold = 2m
    50_000, // fei rate limit = 50k fei/sec
    0, // minting buffer cap = 0 = disables minting fei
    addresses.rai, // rai as the underlying token
    addresses.feiDAOTimelock // surplus target = timelock
  );
  await raiPriceBoundPSM.deployed();

  logging && console.log(`Rai price bound psm deployed`);

  const pcvDripControllerFactory = await ethers.getContractFactory('PCVDripController');
  const raiPCVDripController = await pcvDripControllerFactory.deploy(
    addresses.core,
    addresses.aaveRaiPCVDeposit, // drip source = aave rai pcv deposit
    raiPriceBoundPSM.address, // drip target = rai psm
    1800, // drip interval = 30 minutes
    ethers.constants.WeiPerEther.mul(2_000_000), // drip size = 2 million
    0 // incentive amount = 0
  );

  logging && console.log(`Rai pcv drip controller deployed`);

  logging && console.log('Rai PCV drip controller and rai price-bound psm deployed');

  return {
    raiPriceBoundPSM,
    raiPCVDripController
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Ensure that the global rate limited minter has the MINTER role & the noncustodialpriceboundpsm has the PCV_CONTROLLER role
  await contracts.core.hasRole(ethers.utils.id('MINTER_ROLE'), addresses.raiPriceBoundPSM);
  await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.raiPCVDripController);

  // Ensure that the rai aave pcv deposit has >= 10m RAI
  expect((await contracts.aaveRaiPCVDeposit.balance()).gte(ethers.constants.WeiPerEther.mul(10_000_000)));

  // Ensure that minting is paused on the rai psm
  expect(await contracts.raiPriceBoundPSM.redeemPaused()).to.equal(true);
};

export { deploy, setup, teardown, validate };
