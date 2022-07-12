import { ERC20PCVDepositWrapper__factory } from '@custom-types/contracts';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import chai, { expect } from 'chai';
import hre from 'hardhat';
import { time } from '@test/helpers';
import { ethers } from 'ethers';
import CBN from 'chai-bn';

chai.use(CBN(ethers.BigNumber));

const fipNumber = 'tip_115';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const factory = (await hre.ethers.getContractFactory('ERC20PCVDepositWrapper')) as ERC20PCVDepositWrapper__factory;
  const rariTimelockFeiOldLens = await factory.deploy(addresses.rariInfraFeiTimelock, addresses.fei, true);
  await rariTimelockFeiOldLens.deployTransaction.wait();

  const tribalCouncilTimelockFeiLens = await factory.deploy(addresses.tribalCouncilTimelock, addresses.fei, true);
  await tribalCouncilTimelockFeiLens.deployTransaction.wait();

  return { rariTimelockFeiOldLens, tribalCouncilTimelockFeiLens };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip ${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.rariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await contracts.rariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await contracts.rariTimelockFeiOldLens.balance()).to.be.equal('3178504756468797564687976');
  expect(await contracts.tribalCouncilTimelockFeiLens.balance()).to.be.equal('42905768215167745773610059');
  expect(await contracts.rariTimelockFeiOldLens.balanceReportedIn()).to.be.equal(addresses.fei);
  expect(await contracts.tribalCouncilTimelockFeiLens.balanceReportedIn()).to.be.equal(addresses.fei);
  expect(await contracts.namedStaticPCVDepositWrapper.numDeposits()).to.be.equal('0');
  expect(await contracts.ethToDaiLBPSwapper.swapEndTime()).to.be.gt(
    ethers.BigNumber.from((await time.latest()).toString())
  );
};

export { deploy, setup, teardown, validate };
