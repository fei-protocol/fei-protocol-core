import permissions from '../../../contract-addresses/permissions.json'
import { getAllContractAddresses, getAllContracts } from './loadContracts'
import {
  Config,
  ContractAccessRights,
  MainnetContractAddresses,
  MainnetContracts,
  TestCoordinator,
  Env,
  ProposalConfig,
  namedContractsToNamedAddresses,
  NamedAddresses
} from './types'
import { sudo } from '../../../scripts/utils/sudo'
import constructProposal from '../../../scripts/utils/constructProposal';
import '@nomiclabs/hardhat-ethers'
import { artifacts } from 'hardhat'
import { ethers } from 'ethers'

import { NamedContracts, DeployFunc, SetupUpgradeFunc, RunUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from './types';

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run against the protocol deployed on Mainnet or 
 * with additional contracts deployed in an upgrade locally
*/
export class TestEndtoEndCoordinator implements TestCoordinator {
   
  private mainnetContracts: NamedContracts
  private afterUpgradeContracts: NamedContracts
  private afterUpgradeAddresses: NamedAddresses

  constructor(
    private config: Config,
    private proposals: any,
  ) {
      this.proposals = proposals
  }

  public async initMainnetContracts(): Promise<void> {
    this.mainnetContracts = await getAllContracts() as unknown as NamedContracts
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
    await this.initMainnetContracts()
    let existingContracts = this.mainnetContracts

    // Grant privileges to deploy address
    await sudo(existingContracts, this.config.logging)

    const proposalNames = Object.keys(this.proposals);
    for (let i = 0; i < proposalNames.length; i++) {
      existingContracts = await this.applyUpgrade(existingContracts, proposalNames[i], this.proposals[proposalNames[i]]);
    }

    this.afterUpgradeAddresses = {
      ...getAllContractAddresses(),
      ...namedContractsToNamedAddresses(existingContracts),
    }

    return { contracts: this.afterUpgradeContracts, contractAddresses: this.afterUpgradeAddresses }
  }

  /**
   * Apply an upgrade to the locally instantiated protocol
   */
  async applyUpgrade(existingContracts: NamedContracts, proposalName: string, config: ProposalConfig): Promise<NamedContracts> {
    let deployedUpgradedContracts = {}

    if (config["deploy"]) {
      console.log(`Applying upgrade for proposal: ${proposalName}`)
      const { deploy } = await import('../../../scripts/deploy/' + proposalName);
      const deployTyped = deploy as DeployFunc;
      deployedUpgradedContracts = await deployTyped(this.config.deployAddress, this.mainnetContracts, this.config.logging)
    }

    const contracts: NamedContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }

    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts)
    
    const contractAddresses: {[key: string]: string} = {
      ...namedContractsToNamedAddresses(this.mainnetContracts),
      ...namedContractsToNamedAddresses(contracts),
      ...getAllContractAddresses()
    }
    
    // Get the upgrade setup, run and teardown scripts
    const { setup, run, teardown, validate } = await import('../../../proposals/dao/' + proposalName);

    // setup the DAO proposal
    await setup(contractAddresses, existingContracts, contracts, this.config.logging);

    // Simulate the DAO proposal
    if (config.exec) {
      const proposal = await constructProposal(proposalName, this.config.logging);
      console.log(`Simulating proposal...`)
      await proposal.simulate();
    } else {
      console.log(`Running proposal...`)
      await run(contractAddresses, existingContracts, contracts, this.config.logging)
    }

    // teardown the DAO proposal
    console.log(`Running proposal teardown...`)
    await teardown(contractAddresses, existingContracts, contracts);

    if (validate) {
      console.log(`Running proposal validation...`)
      await validate(contractAddresses, existingContracts, contracts);
    }

    return contracts;
  }

  /**
   * Set the web3 contracts used in the test environment
   */
  setLocalTestContracts(contracts: NamedContracts) {
    this.afterUpgradeContracts = contracts;
  }

  /**
   * Set the addresses of the contracts used in the test environment
   */
  async setLocalTestContractAddresses(contracts: NamedContracts) {
    // @ts-ignore
    this.afterUpgradeAddresses =  { ...this.mainnetAddresses };
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
      const addresses = contracts.map(contractName => {
        return this.afterUpgradeAddresses[contractName];
      });
      
      accessControlRoles[role] = addresses;
    });

    // @ts-ignore
    return accessControlRoles;
  }
}
