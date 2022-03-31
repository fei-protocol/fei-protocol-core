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
import { tribeCouncilPodConfig, protocolPodConfig, PodCreationConfig } from '@protocol/optimisticGovernance';
import { abi as timelockABI } from '../../artifacts/contracts/dao/timelock/OptimisticTimelock.sol/OptimisticTimelock.json';
import { abi as gnosisSafeABI } from '../../artifacts/contracts/pods/orcaInterfaces/IGnosisSafe.sol/IGnosisSafe.json';
import { Contract } from 'ethers';
const toBN = ethers.BigNumber.from;

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
  logging && console.log('DAO pod factory deployed to:', podFactory.address);

  // 3. Deploy PodAdminGateway contract
  const podAdminGatewayFactory = await ethers.getContractFactory('PodAdminGateway');
  const podAdminGateway = await podAdminGatewayFactory.deploy(
    addresses.core,
    addresses.memberToken,
    podFactory.address
  );
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

  const protocolTierPod: PodCreationConfig = {
    members: protocolPodConfig.placeHolderMembers,
    threshold: protocolPodConfig.threshold,
    label: protocolPodConfig.label,
    ensString: protocolPodConfig.ensString,
    imageUrl: protocolPodConfig.imageUrl,
    admin: podAdminGateway.address,
    minDelay: protocolPodConfig.minDelay
  };

  const pods = [tribalCouncilPod, protocolTierPod];
  await podFactory.burnerCreateChildOptimisticPods(pods);

  const protocolPodId = await podFactory.latestPodId();
  const tribalCouncilPodId = protocolPodId.sub(toBN(1));

  logging && console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());
  logging && console.log('Protocol tier pod Id: ', protocolPodId.toString());

  const councilTimelockAddress = await podFactory.getPodTimelock(tribalCouncilPodId);
  const protocolPodTimelockAddress = await podFactory.getPodTimelock(protocolPodId);
  const councilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);
  const protocolPodSafeAddress = await podFactory.getPodSafe(protocolPodId);

  logging && console.log('Tribal council timelock deployed to: ', councilTimelockAddress);
  logging && console.log('Protocol pod timelock deployed to: ', protocolPodTimelockAddress);
  logging && console.log('Tribal council Gnosis safe is: ', councilSafeAddress);
  logging && console.log('Protocol pod safe is: ', protocolPodSafeAddress);

  // 5. Create contract artifacts for timelocks, so address is available to DAO script
  const mockSigner = await getImpersonatedSigner(deployAddress);
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, mockSigner);
  const protocolPodTimelock = new ethers.Contract(protocolPodTimelockAddress, timelockABI, mockSigner);
  const tribalCouncilSafe = new ethers.Contract(councilSafeAddress, gnosisSafeABI, mockSigner);
  const protocolPodSafe = new ethers.Contract(protocolPodSafeAddress, gnosisSafeABI, mockSigner);

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
    protocolPodTimelock,
    podAdminGateway,
    tribalCouncilSafe,
    protocolPodSafe,
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
  // Validate TribalCouncil does not have a VetoController role
  const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
  const protocolTierTimelock = contracts.protocolPodTimelock;
  const gatewayIsProtocolPodProposer = await protocolTierTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    addresses.podAdminGateway
  );
  expect(gatewayIsProtocolPodProposer).to.be.true;

  const gatewayIsCouncilProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    addresses.podAdminGateway
  );
  expect(gatewayIsCouncilProposer).to.be.true;

  // 2. Validate that Tribal Council Safe, timelock and podAdmin are configured
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

  // 3. Validate that Tribal Council members are correctly set
  const councilMembers = await podFactory.getPodMembers(tribalCouncilPodId);
  validateArraysEqual(councilMembers, tribeCouncilPodConfig.members);

  const numCouncilMembers = await podFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(tribeCouncilPodConfig.numMembers);

  const councilThreshold = await podFactory.getPodThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(tribeCouncilPodConfig.threshold);

  ////////////////////// PROTOCOL TIER POD ///////////////////////////////
  // 1. Validate that the protocolTierPod Safe, timelock and podAdmin are configured
  const protocolPodId = await podFactory.getPodId(addresses.protocolPodTimelock);
  const protocolSafeAddress = await podFactory.getPodSafe(protocolPodId);

  const protocolPodAdmin = await podFactory.getPodAdmin(protocolPodId);
  expect(protocolPodAdmin).to.equal(addresses.podAdminGateway);

  const protocolTimelock = contracts.protocolPodTimelock;
  const protocolSafeIsProposer = await protocolTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), protocolSafeAddress);
  expect(protocolSafeIsProposer).to.be.true;

  const publicExecutorIsPodExecutor = await protocolTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(publicExecutorIsPodExecutor).to.be.true;

  // 3. Validate that protocol tier pod members Council members are correctly set
  const numPodMembers = await podFactory.getNumMembers(protocolPodId);
  expect(numPodMembers).to.equal(protocolPodConfig.numMembers);

  const podThreshold = await podFactory.getPodThreshold(protocolPodId);
  expect(podThreshold).to.equal(protocolPodConfig.threshold);

  const podMembers = await podFactory.getPodMembers(protocolPodId);
  validateArraysEqual(podMembers, protocolPodConfig.members);

  ///////////// METADATA REGISTRY ////////////////////////
  const governanceMetadataRegistry = contracts.governanceMetadataRegistry;
  const isProposalRegistered = await governanceMetadataRegistry.isProposalRegistered(0, 0, 'test');
  expect(isProposalRegistered).to.be.false;

  await validateTribeRoles(
    contracts.core,
    addresses.feiDAOTimelock,
    addresses.tribalCouncilTimelock,
    addresses.protocolPodTimelock,
    tribalCouncilSafeAddress,
    protocolSafeAddress,
    addresses.roleBastion,
    addresses.nopeDAO
  );
};

// Validate that the relevant timelocks and Safes have the relevant TribeRoles
const validateTribeRoles = async (
  core: Contract,
  feiDAOTimelockAddress: string,
  tribalCouncilTimelockAddress: string,
  protocolPodTimelockAddress: string,
  tribalCouncilSafeAddress: string,
  protocolPodSafeAddress: string,
  roleBastionAddress: string,
  nopeDAOAddress: string
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

  // Protocol pod timelock roles: Specific first pod duties role
  const protocolPodIsVotiumRole = await core.hasRole(ethers.utils.id('VOTIUM_ADMIN_ROLE'), protocolPodTimelockAddress);
  expect(protocolPodIsVotiumRole).to.be.true;

  // TribalCouncil Gnosis Safe roles: POD_METADATA_REGISTER_ROLE
  const councilHasMetadataRegisterRole = await core.hasRole(
    ethers.utils.id('POD_METADATA_REGISTER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(councilHasMetadataRegisterRole).to.be.true;

  // Protocol pod Gnosis Safe roles: POD_METADATA_REGISTER_ROLE
  const protocolPodHasMetadataRegisterRole = await core.hasRole(
    ethers.utils.id('POD_METADATA_REGISTER_ROLE'),
    protocolPodSafeAddress
  );
  expect(protocolPodHasMetadataRegisterRole).to.be.true;

  // RoleBastion role: GOVERNOR
  const roleBastion = await core.hasRole(ethers.utils.id('GOVERN_ROLE'), roleBastionAddress);
  expect(roleBastion).to.be.true;

  // NopeDAO role: POD_VETO_ADMIN
  const nopeDAOVetoRole = await core.hasRole(ethers.utils.id('POD_VETO_ADMIN'), nopeDAOAddress);
  expect(nopeDAOVetoRole).to.be.true;
};

export { deploy, setup, teardown, validate };
