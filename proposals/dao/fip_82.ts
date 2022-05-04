import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, validateArraysEqual } from '@test/helpers';
import { tribeCouncilPodConfig, PodCreationConfig } from '@protocol/optimisticGovernance';
import { abi as inviteTokenABI } from '../../artifacts/@orcaprotocol/contracts/contracts/InviteToken.sol/InviteToken.json';
import { abi as timelockABI } from '../../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json';
import { abi as gnosisSafeABI } from '../../artifacts/contracts/pods/interfaces/IGnosisSafe.sol/IGnosisSafe.json';
import { Contract } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// Transfers Orca tokens from deployer address to the factory, so that it can deploy pods
// Requirement of holding Orca tokens to deploy is a slow rollout mechanism used by Orca
const transferOrcaTokens = async (
  orcaERC20Address: string,
  deploySigner: SignerWithAddress,
  receiver: string,
  amount: number
) => {
  // Mint Orca Ship tokens to deploy address, to allow to deploy contracts
  const inviteToken = new ethers.Contract(orcaERC20Address, inviteTokenABI, deploySigner);
  const deployerBalance = await inviteToken.balanceOf(deploySigner.address);
  console.log('Orca balance: ', deployerBalance);

  if (deployerBalance.lt(amount)) {
    // In test environment, mint tokens to deployer
    const priviledgedOrcaMinter = '0x2149A222feD42fefc3A120B3DdA34482190fC666';
    const priviledgedSigner = await getImpersonatedSigner(priviledgedOrcaMinter);
    await inviteToken.connect(priviledgedSigner).mint(deploySigner.address, amount);
  }
  const transferTx = await inviteToken.transfer(receiver, amount);
  await transferTx.wait();
};

const fipNumber = '82';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const deploySigner = (await ethers.getSigners())[0];
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy(addresses.core);
  await podExecutor.deployTransaction.wait();

  logging && console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const podFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.orcaMemberToken, // podMembershipToken
    addresses.orcaPodController, // podController
    podExecutor.address // Public pod executor
  );
  await podFactory.deployTransaction.wait();
  logging && console.log('Pod factory deployed to:', podFactory.address);

  // 3. Deploy PodAdminGateway contract
  const podAdminGatewayFactory = await ethers.getContractFactory('PodAdminGateway');
  const podAdminGateway = await podAdminGatewayFactory.deploy(
    addresses.core,
    addresses.orcaMemberToken,
    podFactory.address
  );
  await podAdminGateway.deployTransaction.wait();
  logging && console.log(`Deployed PodAdminGateway at ${podAdminGateway.address}`);
  await transferOrcaTokens(addresses.orcaShipToken, deploySigner, podFactory.address, 1);

  // 4. Create TribalCouncil and Protocol Tier pods
  const tribalCouncilPod: PodCreationConfig = {
    members: tribeCouncilPodConfig.placeHolderMembers,
    threshold: tribeCouncilPodConfig.threshold,
    label: tribeCouncilPodConfig.label,
    ensString: tribeCouncilPodConfig.ensString,
    imageUrl: tribeCouncilPodConfig.imageUrl,
    minDelay: tribeCouncilPodConfig.minDelay,
    admin: podAdminGateway.address
  };

  const genesisTx = await podFactory.deployCouncilPod(tribalCouncilPod);
  const { args } = (await genesisTx.wait()).events.find((elem) => elem.event === 'CreatePod');
  const tribalCouncilPodId = args.podId;
  logging && console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());

  const councilTimelockAddress = await podFactory.getPodTimelock(tribalCouncilPodId);
  const councilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);

  logging && console.log('Tribal council timelock deployed to: ', councilTimelockAddress);
  logging && console.log('Tribal council Gnosis safe is: ', councilSafeAddress);

  // 5. Create contract artifacts for timelock, so address is available to DAO script
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, deploySigner);
  const tribalCouncilSafe = new ethers.Contract(councilSafeAddress, gnosisSafeABI, deploySigner);

  // 6. Deploy GovernanceMetadataRegistry contract
  const metadataRegistryFactory = await ethers.getContractFactory('GovernanceMetadataRegistry');
  const governanceMetadataRegistry = await metadataRegistryFactory.deploy(addresses.core);
  await governanceMetadataRegistry.deployTransaction.wait();
  logging && console.log('GovernanceMetadataRegistry deployed to:', governanceMetadataRegistry.address);

  // 7. Deploy RoleBastion, to allow TribalCouncil to manage roles
  const roleBastionFactory = await ethers.getContractFactory('RoleBastion');
  const roleBastion = await roleBastionFactory.deploy(addresses.core);
  await roleBastion.deployTransaction.wait();
  logging && console.log('RoleBastion deployed to:', roleBastion.address);

  // 8. Deploy NopeDAO
  const nopeDAOFactory = await ethers.getContractFactory('NopeDAO');
  const nopeDAO = await nopeDAOFactory.deploy(addresses.tribe, addresses.core);
  await nopeDAO.deployTransaction.wait();
  logging && console.log('NopeDAO deployed to:', nopeDAO.address);

  return {
    podExecutor,
    podFactory,
    tribalCouncilTimelock,
    podAdminGateway,
    tribalCouncilSafe,
    governanceMetadataRegistry,
    roleBastion,
    nopeDAO
  };
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const podFactory = contracts.podFactory;
  const tribalCouncilPodId = await podFactory.getPodId(addresses.tribalCouncilTimelock);
  const tribalCouncilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);

  // 1. Validate PodAdminGateway has PROPOSER role on TribalCouncil and Protocol Pod
  ///////////////  POD ADMIN GATEWAY  //////////////////////
  const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), addresses.podAdminGateway)).to.be.false;
  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway)).to.be.true;

  ///////////////   TRIBAL COUNCIL  //////////////////
  const councilPodAdmin = await podFactory.getPodAdmin(tribalCouncilPodId);
  expect(councilPodAdmin).to.equal(addresses.podAdminGateway);

  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), tribalCouncilSafeAddress)).to.be.true;
  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('EXECUTOR_ROLE'), tribalCouncilSafeAddress)).to.be.true;
  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('CANCELLER_ROLE'), tribalCouncilSafeAddress)).to.be.true;

  expect(await tribalCouncilTimelock.hasRole(ethers.utils.id('EXECUTOR_ROLE'), addresses.podExecutor)).to.be.true;

  const councilMembershipLocked = await podFactory.getIsMembershipTransferLocked(tribalCouncilPodId);
  expect(councilMembershipLocked).to.be.true;

  // 3. Validate that Tribal Council members are correctly set
  const councilMembers = await podFactory.getPodMembers(tribalCouncilPodId);
  validateArraysEqual(councilMembers, tribeCouncilPodConfig.members);

  const numCouncilMembers = await podFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(tribeCouncilPodConfig.numMembers);

  const councilThreshold = await podFactory.getPodThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(tribeCouncilPodConfig.threshold);

  ////////////////////// PROTOCOL TIER POD ///////////////////////////////

  ///////////// METADATA REGISTRY ////////////////////////
  const governanceMetadataRegistry = contracts.governanceMetadataRegistry;
  const isProposalRegistered = await governanceMetadataRegistry.isProposalRegistered(0, 0, 'test');
  expect(isProposalRegistered).to.be.false;

  await validateContractRoles(
    contracts.core,
    addresses.feiDAOTimelock,
    addresses.tribalCouncilTimelock,
    tribalCouncilSafeAddress,
    addresses.roleBastion,
    addresses.nopeDAO,
    addresses.podFactory
  );
};

// Validate that the relevant timelocks and Safes have the relevant TribeRoles
const validateContractRoles = async (
  core: Contract,
  feiDAOTimelockAddress: string,
  tribalCouncilTimelockAddress: string,
  tribalCouncilSafeAddress: string,
  roleBastionAddress: string,
  nopeDAOAddress: string,
  podFactoryAddress: string
) => {
  // feiDAOTimelock added roles: ROLE_ADMIN
  const daoIsPodDeployer = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), feiDAOTimelockAddress);
  expect(daoIsPodDeployer).to.be.true;

  // TribalCouncilTimelock roles: ROLE_ADMIN, POD_ADMIN
  const councilIsRoleAdmin = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsRoleAdmin).to.be.true;

  const councilIsPodAdmin = await core.hasRole(ethers.utils.id('POD_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsPodAdmin).to.be.true;

  // TribalCouncil Gnosis Safe roles: POD_METADATA_REGISTER_ROLE
  const councilHasMetadataRegisterRole = await core.hasRole(
    ethers.utils.id('POD_METADATA_REGISTER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(councilHasMetadataRegisterRole).to.be.true;

  // RoleBastion role: GOVERNOR
  const roleBastion = await core.hasRole(ethers.utils.id('GOVERN_ROLE'), roleBastionAddress);
  expect(roleBastion).to.be.true;

  // NopeDAO role: POD_VETO_ADMIN
  const nopeDAOVetoRole = await core.hasRole(ethers.utils.id('POD_VETO_ADMIN'), nopeDAOAddress);
  expect(nopeDAOVetoRole).to.be.true;

  // PodFactory role: POD_ADMIN
  const podFactoryAdminRole = await core.hasRole(ethers.utils.id('POD_ADMIN'), podFactoryAddress);
  expect(podFactoryAdminRole).to.be.true;
};

export { deploy, setup, teardown, validate };
