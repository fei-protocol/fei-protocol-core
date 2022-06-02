import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, ZERO_ADDRESS } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = 'aura_airdrop';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy implementation
  const vlAuraDelegatorPCVDepositFactory = await ethers.getContractFactory('VlAuraDelegatorPCVDeposit');
  const vlAuraDelegatorPCVDepositImplementation = await vlAuraDelegatorPCVDepositFactory.deploy(addresses.core);
  await vlAuraDelegatorPCVDepositImplementation.deployTransaction.wait();
  logging && console.log('vlAuraDelegatorPCVDepositImplementation: ', vlAuraDelegatorPCVDepositImplementation.address);

  // Deploy proxy
  const ProxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  const vlAuraDelegatorPCVDepositProxy = await ProxyFactory.deploy(
    vlAuraDelegatorPCVDepositImplementation.address,
    addresses.proxyAdmin,
    '0x' // empty calldata
  );
  await vlAuraDelegatorPCVDepositProxy.deployTransaction.wait();
  const vlAuraDelegatorPCVDeposit = await ethers.getContractAt(
    'VlAuraDelegatorPCVDeposit',
    vlAuraDelegatorPCVDepositProxy.address
  );
  logging && console.log('vlAuraDelegatorPCVDeposit: ', vlAuraDelegatorPCVDeposit.address);

  return {
    vlAuraDelegatorPCVDepositImplementation,
    vlAuraDelegatorPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No setup for${fipNumber}.`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // TC multisig can initialize the proxy's state
  const tcSigner = await getImpersonatedSigner(addresses.tribalCouncilSafe);
  await forceEth(tcSigner.address);

  expect(await contracts.vlAuraDelegatorPCVDeposit.aura()).to.be.equal(ZERO_ADDRESS);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraLocker()).to.be.equal(ZERO_ADDRESS);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraMerkleDrop()).to.be.equal(ZERO_ADDRESS);
  expect(await contracts.vlAuraDelegatorPCVDeposit.token()).to.be.equal(ZERO_ADDRESS);
  expect(await contracts.vlAuraDelegatorPCVDeposit.delegate()).to.be.equal(ZERO_ADDRESS);

  const aura = '0x0000000000000000000000000000000000000001';
  const auraLocker = '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B';
  const auraMerkleDrop = '0x0000000000000000000000000000000000000003';
  const delegate = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';
  await contracts.vlAuraDelegatorPCVDeposit.connect(tcSigner).initialize(
    // dummy addresses
    aura,
    auraLocker,
    auraMerkleDrop,
    delegate
  );

  expect(await contracts.vlAuraDelegatorPCVDeposit.aura()).to.be.equal(aura);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraLocker()).to.be.equal(auraLocker);
  expect(await contracts.vlAuraDelegatorPCVDeposit.auraMerkleDrop()).to.be.equal(auraMerkleDrop);
  expect(await contracts.vlAuraDelegatorPCVDeposit.token()).to.be.equal(auraLocker);
  expect(await contracts.vlAuraDelegatorPCVDeposit.delegate()).to.be.equal(delegate);
};

export { deploy, setup, teardown, validate };
