import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = '83';
const eswak = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const linearTimelockFactory = await ethers.getContractFactory('LinearTokenTimelock');
  const laTribuFeiTimelock = await linearTimelockFactory.deploy(
    eswak,
    '126144000', // 4 years
    addresses.fei,
    '0', // no cliff
    addresses.feiDAOTimelock,
    '0'
  );
  await laTribuFeiTimelock.deployed();
  logging && console.log('laTribuFeiTimelock: ', laTribuFeiTimelock.address);

  const quadraticTimelockFactory = await ethers.getContractFactory('QuadraticTokenTimelock');
  const laTribuTribeTimelock = await quadraticTimelockFactory.deploy(
    eswak,
    '126144000', // 4 years
    addresses.tribe,
    '31536000', // 1 year cliff
    addresses.feiDAOTimelock,
    '0'
  );
  await laTribuTribeTimelock.deployed();
  logging && console.log('laTribuTribeTimelock: ', laTribuTribeTimelock.address);

  return {
    laTribuFeiTimelock,
    laTribuTribeTimelock
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
  await forceEth(contracts.feiDAOTimelock.address);
  const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
  const eswakSigner = await getImpersonatedSigner(eswak);
  // check timelock balances
  expect(await contracts.fei.balanceOf(contracts.laTribuFeiTimelock.address)).to.be.equal(
    ethers.constants.WeiPerEther.mul('1120000')
  );
  expect(await contracts.tribe.balanceOf(contracts.laTribuTribeTimelock.address)).to.be.equal(
    ethers.constants.WeiPerEther.mul('1000000')
  );
  // fast-forward 1 month
  await time.increase('2592000');
  // can claim FEI
  const balanceBefore = await contracts.fei.balanceOf(eswak);
  await contracts.laTribuFeiTimelock.connect(eswakSigner).releaseMax(eswak);
  const balanceAfter = await contracts.fei.balanceOf(eswak);
  expect(balanceAfter.sub(balanceBefore)).to.be.at.least(ethers.constants.WeiPerEther.mul('20000'));
  // DAO can clawback FEI and TRIBE
  await contracts.laTribuFeiTimelock.connect(daoSigner).clawback();
  await contracts.laTribuTribeTimelock.connect(daoSigner).clawback();
  expect(await contracts.fei.balanceOf(contracts.laTribuFeiTimelock.address)).to.be.equal('0');
  expect(await contracts.tribe.balanceOf(contracts.laTribuTribeTimelock.address)).to.be.equal('0');
};

export { deploy, setup, teardown, validate };
