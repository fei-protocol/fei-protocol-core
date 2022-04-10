import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { tribeCouncilPodConfig, PodCreationConfig } from '@protocol/optimisticGovernance';
import { abi as ERC20ABI } from '../../artifacts/@openzeppelin/contracts/token/ERC20/ERC20.sol/ERC20.json';
import { abi as timelockABI } from '../../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json';
import { abi as gnosisSafeABI } from '../../artifacts/contracts/pods/interfaces/IGnosisSafe.sol/IGnosisSafe.json';
import { Contract } from 'ethers';

const validateArraysEqual = (arrayA: string[], arrayB: string[]) => {
  arrayA.every((a) => expect(arrayB.map((b) => b.toLowerCase()).includes(a.toLowerCase())));
};

// Note: The Orca token is a slow rollout mechanism used by Orca. In order to successfully deploy pods
// you need to have first been minted Orca tokens. Here, for testing purposes locally, we mint
// the addresses that will create pods Orca tokens. TODO: Remove once have SHIP tokens on Mainnet
// TODO: Remove now that have Orca tokens on my deployer address
const transferOrcaTokens = async (
  orcaERC20Address: string,
  deployAddressWithOrca: string,
  receiver: string,
  amount: number
) => {
  // Mint Orca Ship tokens to deploy address, to allow to deploy contracts
  const deployAddressSigner = await getImpersonatedSigner(deployAddressWithOrca);
  const inviteToken = new ethers.Contract(orcaERC20Address, ERC20ABI, deployAddressSigner);
  await inviteToken.transfer(receiver, amount);
};

const fipNumber = '82';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  logging && console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy PodAdminGateway contract
  const podAdminGatewayFactory = await ethers.getContractFactory('PodAdminGateway');
  const podAdminGateway = await podAdminGatewayFactory.deploy(
    addresses.core,
    addresses.orcaMemberToken,
    addresses.orcaPodController
  );
  await podAdminGateway.deployTransaction.wait();
  logging && console.log(`Deployed PodAdminGateway at ${podAdminGateway.address}`);

  // 3. Deploy tribalCouncilPodFactory
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const podFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.orcaPodController, // podController
    addresses.orcaMemberToken, // podMembershipToken
    podExecutor.address, // Public pod executor
    podAdminGateway.address // PodAdminGateway
  );
  await podFactory.deployTransaction.wait();
  await transferOrcaTokens(addresses.orcaShipToken, deployAddress, podFactory.address, 2);
  logging && console.log('Pod factory deployed to:', podFactory.address);

  // 4. Create TribalCouncil and Protocol Tier pods
  const tribalCouncilPod: PodCreationConfig = {
    members: tribeCouncilPodConfig.placeHolderMembers,
    threshold: tribeCouncilPodConfig.threshold,
    label: tribeCouncilPodConfig.label,
    ensString: tribeCouncilPodConfig.ensString,
    imageUrl: tribeCouncilPodConfig.imageUrl,
    minDelay: tribeCouncilPodConfig.minDelay
  };

  const genesisTx = await podFactory.deployGenesisPod(tribalCouncilPod);
  const { args } = (await genesisTx.wait()).events.find((elem) => elem.event === 'CreatePod');
  const tribalCouncilPodId = args.podId;
  logging && console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());

  const councilTimelockAddress = await podFactory.getPodTimelock(tribalCouncilPodId);
  const councilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);

  logging && console.log('Tribal council timelock deployed to: ', councilTimelockAddress);
  logging && console.log('Tribal council Gnosis safe is: ', councilSafeAddress);

  // 5. Create contract artifacts for timelock, so address is available to DAO script
  const mockSigner = await getImpersonatedSigner(deployAddress);
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, mockSigner);
  const tribalCouncilSafe = new ethers.Contract(councilSafeAddress, gnosisSafeABI, mockSigner);

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

  await validateContractRoles(
    contracts.core,
    addresses.feiDAOTimelock,
    addresses.tribalCouncilTimelock,
    tribalCouncilSafeAddress,
    addresses.roleBastion,
    addresses.nopeDAO,
    addresses.podFactory
  );
  await validateTransferredRoleAdmins(contracts.core);
  await validateNewCouncilRoles(contracts.core);
  await validateContractAdmins(contracts.core);
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

/// Validate that all non-major TribeRoles have had their admins transferred to the ROLE_ADMIN
const validateTransferredRoleAdmins = async (core: Contract) => {
  const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

  await expect(core.getRoleAdmin(ethers.utils.id('ORACLE_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('METAGOVERNANCE_GAUGE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('VOTIUM_ADMIN_ROLE'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the expected new TribeRoles have been created
const validateNewCouncilRoles = async (core: Contract) => {
  const ROLE_ADMIN = ethers.utils.id('ROLE_ADMIN');

  await expect(core.getRoleAdmin(ethers.utils.id('FUSE_ADMIN'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('FEI_MINT_ADMIN'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('PCV_ADMIN'))).to.be.equal(ROLE_ADMIN);
  await expect(core.getRoleAdmin(ethers.utils.id('PSD_ADMIN'))).to.be.equal(ROLE_ADMIN);
};

/// Validate that the relevant contract admins have been set to their expected values
const validateContractAdmins = async (contracts: NamedContracts) => {

  await expect(contracts.fuseGuardian.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FUSE_ADMIN'));

  await expect(contracts.optimisticMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));
  await expect(contracts.pcvEquityMinter.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('FEI_MINT_ADMIN'));

  await expect(contracts.ethLidoPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.indexDelegator.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.ethTokemakPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.uniswapPCVDeposit.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));

  await expect(contracts.daiPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.lusdPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.ethPSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));

  await expect(contracts.aaveEthPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.daiPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.lusdPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
  await expect(contracts.compoundEthPCVDripController.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_ADMIN'));
}

export { deploy, setup, teardown, validate };
