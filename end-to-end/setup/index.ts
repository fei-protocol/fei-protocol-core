import mainnetAddressesV1 from '../../contract-addresses/mainnetAddresses.json'
import permissions from '../../contract-addresses/permissions.json'

import { getContracts, getContractAddresses } from './loadContracts'
import {
  Config,
  ContractAccessRights,
  MainnetContractAddresses,
  MainnetContracts,
  TestCoordinator,
  Env,
  ProposalConfig
} from './types'
import { sudo } from '../../scripts/utils/sudo'
import { exec } from '../../proposals/dao/exec'

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
    private proposals: any,
  ) {
      this.mainnetAddresses = this.getMainnetContractAddresses()
      this.proposals = proposals
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
   public async loadEnvironment(): Promise<Env> {
    // @ts-ignore
    let existingContracts = await getContracts(mainnetAddressesV1.contracts)

    // Grant priviledges to deploy address
    await sudo(this.mainnetAddresses, this.config.logging)

    const proposalNames = Object.keys(this.proposals);
    for (let i = 0; i < proposalNames.length; i++) {
      existingContracts = await this.applyUpgrade(existingContracts, proposalNames[i], this.proposals[proposalNames[i]]);
    }

    return { contracts: this.afterUpgradeContracts, contractAddresses: this.afterUpgradeAddresses }
  }

  /**
   * Apply an upgrade to the locally instantiated protocol
   */
  async applyUpgrade(existingContracts: MainnetContracts, proposalName: string, config: ProposalConfig) {
    let deployedUpgradedContracts = {}

    if (config["deploy"]) {
      const { deploy } = await import('../../deploy/' + proposalName);
      deployedUpgradedContracts = await deploy(this.config.deployAddress, this.mainnetAddresses, this.config.logging)
    }

    const contracts: MainnetContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }
    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts)
    
    const contractAddresses = {
      ...getContractAddresses(contracts),
      // @ts-ignore
      ...mainnetAddressesV1.external
    }
    
    // Get the upgrade setup, run and teardown scripts
    const { setup, run, teardown } = await import('../../proposals/dao/' + proposalName);

    // TODO add in contracts as a param to skip the contractAddress adding in DAO mocks
    // setup the DAO proposal
    await setup(contractAddresses, this.mainnetAddresses, this.config.logging);

    // Run the DAO proposal
    // If the `exec` flag is activated, then run the upgrade directly from tx calldata
    if (config.exec) {
      const addresses = { 
        proposerAddress: config.proposerAddress,
        voterAddress: config.voterAddress,
        governorAlphaAddress: mainnetAddressesV1['governorAlphaAddress']
      }
      await exec(config.proposal_calldata, addresses);
    } else {
      await run(contractAddresses, this.mainnetAddresses, this.config.logging)
    }

    // teardown the DAO proposal
    await teardown(contractAddresses, this.mainnetAddresses)

    return contracts;
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
   * Load all contract addresses from a .json, according to the network configured
   */
  private getMainnetContractAddresses() {
    // @ts-ignore
    return { ...mainnetAddressesV1.contracts, ...mainnetAddressesV1.external }
  }
}
