import mainnetAddressesV1 from '../../contract-addresses/mainnetAddresses.json'
import permissions from '../../contract-addresses/permissions.json'
import { getContracts, getContractAddresses } from './loadContracts'
import {
  Config,
  ContractAccessRights,
  MainnetContractAddresses,
  MainnetContracts,
  TestCoordinator,
  Env
} from './types'
import { sudo } from '../../scripts/utils/sudo'
import { upgrade as deployUpgradeContracts } from '../../deploy/upgrade'
import { upgrade as applyPermissions, revokeOldContractPerms } from '../../scripts/dao/upgrade'
import { artifacts } from 'hardhat'

const RatioPCVController = artifacts.require('TestOldRatioPCVController');

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run against the protocol deployed on Mainnet or 
 * with additional contracts deployed in an upgrade locally
*/
export class TestEndtoEndCoordinator implements TestCoordinator {
   
  private mainnetAddresses; //: MainnetContractAddresses;
  private afterUpgradeContracts: MainnetContracts;
  private afterUpgradeAddresses: MainnetContractAddresses;

  constructor(
    private config: Config,
  ) {
      this.mainnetAddresses = this.getMainnetContractAddresses()
  }

  /**
   * Setup end-to-end tests against the state of the protocol on Mainnet, before any upgrade.
   * No additional contracts deployed locally.
   */
  async beforeUpgrade(): Promise<Env> {
    const contracts = await this.loadMainnetContracts(this.mainnetAddresses)
    return { contracts, contractAddresses: this.mainnetAddresses }
  }

  /**
   * Setup end to end tests for a local environment. This involves e2e testing
   * contracts not yet deployed.
   * 
   * Specifically:
   * 1) Get all contracts not being upgraded that are already deployed to Mainnet
   * 2) Deploy new contracts being upgraded
   * 3) Apply appropriate permissions to the contracts e.g. minter, burner priviledges
   *
   */
   public async applyUpgrade(): Promise<Env> {
    const existingContracts = await this.loadMainnetContracts(this.mainnetAddresses)

    const deployedUpgradedContracts = await deployUpgradeContracts(this.config.deployAddress, this.mainnetAddresses, this.config.logging)

    // Override RatioPCVController with old contract, due to pcvDeposit abi clashes
    const ratioPCVController = await RatioPCVController.new(this.mainnetAddresses['coreAddress'])
    deployedUpgradedContracts.ratioPCVController = ratioPCVController

    const contracts: MainnetContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }
    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts)
    
    // Grant priviledges to deploy address
    await sudo(this.mainnetAddresses, this.config.logging)
    
    // If contract not upgraded, use mainnet address - e.g. this.addresses['core']
    // If contract has been upgraded and a new one deployed"
    //  - use local deploy address e.g. contracts.core.address
    const requiredApplyPermissionsAddresses = getContractAddresses(contracts);
    
    await revokeOldContractPerms(this.afterUpgradeContracts.core, this.mainnetAddresses)

    // Grant minter, burner, pcvController permissions etc to the relevant contracts
    console.log(this.mainnetAddresses);
    await applyPermissions(requiredApplyPermissionsAddresses, this.mainnetAddresses, this.config.logging)
    return { contracts: this.afterUpgradeContracts, contractAddresses: this.afterUpgradeAddresses }
  }

  /**
   * Set the web3 contracts used in the test environment
   */
  setLocalTestContracts(contracts: MainnetContracts) {
    this.afterUpgradeContracts = contracts;
  }

  /**
   * Set the addresses of the contracts used in the test environment
   */
  async setLocalTestContractAddresses(contracts: MainnetContracts) {
    // @ts-ignore
    this.afterUpgradeAddresses =  { ...getContractAddresses(contracts), ...mainnetAddressesV1.external };
  }

  /**
   * Get all contract addresses used in the test environment
   */
  getLocalProtocolAddresses(): MainnetContractAddresses {
    return this.mainnetAddresses
  }

  /**
   * Revoke permissions granted to deploy address
   */
  async revokeDeployAddressPermission() {
    await this.afterUpgradeContracts.core.revokeMinter(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokeBurner(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokePCVController(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokeGovernor(this.config.deployAddress);
  }

  /**
   * Get the access control mapping for the contracts. The access control is managed by the 
   * permissions contract
   */
  getAccessControlMapping(): ContractAccessRights {
    const accessControlRoles = {}

    // Array of all deployed contracts
   Object.keys(permissions).map(role => {
      const contracts = permissions[role];
      const addresses = contracts.map(contract => {
        return this.afterUpgradeAddresses[contract];
      });
      accessControlRoles[role] = addresses;
    });

    // @ts-ignore
    return accessControlRoles;
  }
  
  /**
   * Get all Mainnet contracts, instantiated as web3 instances
   */
  async loadMainnetContracts(addresses: MainnetContractAddresses): Promise<MainnetContracts> {
    // @ts-ignore
    return getContracts(mainnetAddressesV1.contracts)
  }

  /**
   * Load all contract addresses from a .json, according to the network configured
   */
  private getMainnetContractAddresses() {
    // @ts-ignore
    return { ...mainnetAddressesV1.contracts, ...mainnetAddressesV1.external }
  }
}
