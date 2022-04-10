import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { tribeCouncilPodConfig, PodCreationConfig } from '@protocol/optimisticGovernance';
import { abi as timelockABI } from '../../artifacts/contracts/dao/timelock/TimelockController.sol/TimelockController.json';
import { abi as gnosisSafeABI } from '../../artifacts/contracts/pods/interfaces/IGnosisSafe.sol/IGnosisSafe.json';
import { Contract } from 'ethers';

const validateArraysEqual = (arrayA: string[], arrayB: string[]) => {
  arrayA.every((a) => expect(arrayB.map((b) => b.toLowerCase()).includes(a.toLowerCase())));
};

// Note: The Orca token is a slow rollout mechanism used by Orca. In order to successfully deploy pods
// you need to have first been minted Orca tokens. Here, for testing purposes locally, we mint
// the addresses that will create pods Orca tokens. TODO: Remove once have SHIP tokens on Mainnet
const mintOrcaToken = async (address: string) => {
  const inviteTokenAddress = '0x872EdeaD0c56930777A82978d4D7deAE3A2d1539';
  const priviledgedAddress = '0x2149A222feD42fefc3A120B3DdA34482190fC666';

  const inviteTokenABI = [
    'function mint(address account, uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)'
  ];
  // Mint Orca Ship tokens to deploy address, to allow to deploy contracts
  const priviledgedAddressSigner = await getImpersonatedSigner(priviledgedAddress);
  const inviteToken = new ethers.Contract(inviteTokenAddress, inviteTokenABI, priviledgedAddressSigner);
  await inviteToken.mint(address, 10);
};

const fipNumber = '82';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  logging && console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const podFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await podFactory.deployTransaction.wait();
  await mintOrcaToken(podFactory.address);
  logging && console.log('Pod factory deployed to:', podFactory.address);

  // 3. Deploy PodAdminGateway contract
  const podAdminGatewayFactory = await ethers.getContractFactory('PodAdminGateway');
  const podAdminGateway = await podAdminGatewayFactory.deploy(addresses.core, podFactory.address);
  await podAdminGateway.deployTransaction.wait();
  logging && console.log(`Deployed PodAdminGateway at ${podAdminGateway.address}`);

  // 4. Create TribalCouncil and Protocol Tier pods
  const tribalCouncilPod: PodCreationConfig = {
    members: tribeCouncilPodConfig.placeHolderMembers,
    threshold: tribeCouncilPodConfig.threshold,
    label: tribeCouncilPodConfig.label,
    ensString: tribeCouncilPodConfig.ensString,
    imageUrl: tribeCouncilPodConfig.imageUrl,
    admin: podAdminGateway.address,
    minDelay: tribeCouncilPodConfig.minDelay
  };

  await podFactory.deployGenesisPod(tribalCouncilPod);

  const tribalCouncilPodId = await podFactory.latestPodId();

  logging && console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());

  const councilTimelockAddress = await podFactory.getPodTimelock(tribalCouncilPodId);
  const councilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);

  logging && console.log('Tribal council timelock deployed to: ', councilTimelockAddress);
  logging && console.log('Tribal council Gnosis safe is: ', councilSafeAddress);

  // 5. Create contract artifacts for timelocks, so address is available to DAO script
  const mockSigner = await getImpersonatedSigner(deployAddress);
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, mockSigner);
  const tribalCouncilSafe = new ethers.Contract(councilSafeAddress, gnosisSafeABI, mockSigner);

  // 6. Deploy GovernanceMetadataRegistry contract
  const metadataRegistryFactory = await ethers.getContractFactory('GovernanceMetadataRegistry');
  const governanceMetadataRegistry = await metadataRegistryFactory.deploy(addresses.core);
  await governanceMetadataRegistry.deployTransaction.wait();
  logging && console.log('GovernanceMetadataRegistry deployed to:', governanceMetadataRegistry.address);

  // 7. Deploy RoleBastion and RoleBastion, to allow TribalCouncil to manage roles
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
  const gatewayIsCouncilProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    addresses.podAdminGateway
  );
  expect(gatewayIsCouncilProposer).to.be.true;

  ///////////////   TRIBAL COUNCIL  //////////////////
  const councilPodAdmin = await podFactory.getPodAdmin(tribalCouncilPodId);
  expect(councilPodAdmin).to.equal(addresses.podAdminGateway);

  const councilSafeIsProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(councilSafeIsProposer).to.be.true;

  const podExecutorIsExecutor = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(podExecutorIsExecutor).to.be.true;

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

  await validateTribeRoles(
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
const validateTribeRoles = async (
  core: Contract,
  feiDAOTimelockAddress: string,
  tribalCouncilTimelockAddress: string,
  tribalCouncilSafeAddress: string,
  roleBastionAddress: string,
  nopeDAOAddress: string,
  podFactoryAddress: string
) => {
  // feiDAOTimelock added roles: POD_DEPLOYER_ROLE
  const daoIsPodDeployer = await core.hasRole(ethers.utils.id('POD_DEPLOYER_ROLE'), feiDAOTimelockAddress);
  expect(daoIsPodDeployer).to.be.true;

  // TribalCouncilTimelock roles: ROLE_ADMIN, POD_DEPLOYER_ROLE, POD_ADMIN, POD_VETO_ADMIN
  const councilIsRoleAdmin = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsRoleAdmin).to.be.true;

  const councilIsPodDeployer = await core.hasRole(ethers.utils.id('POD_DEPLOYER_ROLE'), tribalCouncilTimelockAddress);
  expect(councilIsPodDeployer).to.be.true;

  const councilIsPodVetoAdmin = await core.hasRole(ethers.utils.id('POD_VETO_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsPodVetoAdmin).to.be.true;

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
