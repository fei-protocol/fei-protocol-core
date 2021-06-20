import mainnetAddressesV1 from '../../../contract-addresses/mainnetAddresses.json'
import { getContracts, getContract } from './loadContracts'
import { ContractAddresses, TestCoordinator, TestEnv, TestEnvContracts } from './types'
import { sudo } from '../../../scripts/utils/sudo'
import { upgrade as upgradeProtocol } from '../../../deploy/upgrade'
import { upgrade as applyPermissions } from '../../../scripts/dao/upgrade'

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run with additional local contracts deployed or
 * in a purely 100% mainnet forked mode
*/
export class EndtoEndCoordinator implements TestCoordinator { 
  private supportedNetworks = ['mainnet']
  private addresses: ContractAddresses;

  constructor(network: string, private version: number) {
    if (this.supportedNetworks.includes(network)) {
      this.addresses = this.getContractAddressesForNetwork(network)
    } else {
      throw new Error('Unsupported network')
    }
  }

  /**
   * Setup end-to-end tests for a 100% forked mainnet environment.
   * No additional contracts deployed locally. This test is used to e2e the real system.
   * Specifically:
   * 1) Load all mainnet contracts from their addresses
   * 2) Get accounts ready to execute tests from
   */
  async initialiseMainnetEnv(): Promise<TestEnv> {
    const contracts = await this.loadMainnetContracts(this.addresses)
    const testAddresses = this.getTestAddresses()
    return { contracts, addresses: testAddresses }
  }

  /**
   * Setup end to end tests for a local environment. This involves e2e testing
   * contracts not yet deployed.
   * Specifically:
   * 1) Deploy contracts that are only in the codebase and not yet on Mainnet
   * 2) Grant governor access
   * 3) Apply appropriate permissions to the contracts
   * 
   * Note: This is running on a forked mainnet state to account for 
   * the various dependencies in Uniswap, Chainlink etc.
   */
   public async initialiseLocalEnv(): Promise<TestEnv> {
    const contracts = await this.getProtocolContracts()

    // do these act on the same contract instances as I want?
    await sudo()
    await applyPermissions()

    const addresses = this.getTestAddresses()
    return { contracts, addresses}
  }
  
  /**
   * Get all Mainnet contracts, instantiated as web3 instances
   */
  async loadMainnetContracts(addresses: ContractAddresses): Promise<TestEnvContracts> {
    return getContracts(addresses)
  }

  /**
   * Load all contract addresses from a .json, according to the network configured
   */
  private getContractAddressesForNetwork(network: string): ContractAddresses {
    if (this.supportedNetworks.includes(network)) {
      return mainnetAddressesV1
    } else {
      throw new Error('No addresses for this network')
    } 
  }

  /**
   * Get Ethereum addresses that are needed during the e2e tests
   */
  private getTestAddresses(): string[] {
    // TODO
    return ['']
  }

  /**
   * Deploy the contracts that exist in the protocol locally and 
   * which are not yet on Mainnet
   */
  private async getProtocolContracts(): Promise<TestEnvContracts> {
    const core = await getContract('Core', this.addresses['Core'])
    const fei = await getContract('Fei', this.addresses['Fei'])
    const tribe = await getContract('Tribe', this.addresses['Tribe'])
    const ethReserveStabiliser = await getContract('EthReserveStabiliser', this.addresses['EthReserveStabiliser'])
    const upgradeContracts = await upgradeProtocol()
    return { core, fei, tribe, ethReserveStabiliser, ...upgradeContracts}
  }
}
