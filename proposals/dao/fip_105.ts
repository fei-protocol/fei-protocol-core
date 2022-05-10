import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

DAO Proposal #105

Description: Deploy a Fei skimmer for the DAI PSM
*/

const fipNumber = '105';
const skimThreshold = ethers.constants.WeiPerEther.mul(20_000_000);

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy a Fei Skimmer for the DAI PSM
  const daiPSMFeiSkimmerFactory = await ethers.getContractFactory('FeiSkimmer');
  const daiFixedPricePSMFeiSkimmer = await daiPSMFeiSkimmerFactory.deploy(
    addresses.core,
    addresses.daiFixedPricePSM,
    skimThreshold
  );
  await daiFixedPricePSMFeiSkimmer.deployed();
  logging && console.log('DAI PSM Fei Skimmer deployed at', daiFixedPricePSMFeiSkimmer.address);
  return {
    daiFixedPricePSMFeiSkimmer
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
  const daiFixedPricePSMFeiSkimmer = contracts.daiFixedPricePSMFeiSkimmer;
  const core = contracts.core;

  expect(await daiFixedPricePSMFeiSkimmer.threshold()).to.be.equal(skimThreshold);
  expect(await daiFixedPricePSMFeiSkimmer.source()).to.be.equal(addresses.daiFixedPricePSM);
  expect(await core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), daiFixedPricePSMFeiSkimmer.address)).to.be.true;
};

export { deploy, setup, teardown, validate };
