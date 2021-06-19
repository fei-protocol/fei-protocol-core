import mainnetAddressesV1 from './mainnetAddresses.json'
import { getContracts } from './loadContracts'
import { ContractAddresses, TestCoordinator, TestEnv } from './types'

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run in a local or forked mainnet environment
*/
export class EndtoEndCoordinator implements TestCoordinator { 
  private network: string;
  private supportedNetworks = ['mainnet', 'local']

  constructor(network: string, private version: number) {
    if (this.supportedNetworks.includes(network)) {
      this.network = network
    } else {
      throw new Error('Unsupported network')
    }
  }


  /**
   * Setup end-to-end tests for a forked mainnet environment. Specifically:
   * 1) Load all mainnet contracts from their addresses
   * 2) Get accounts ready to execute tests from
   */
  async initialiseMainnetEnv(): Promise<TestEnv> {
    const mainnetAddresses = this.getContractAddressesForNetwork()
    const contracts = await this.loadMainnetContracts(mainnetAddresses)
    const testAddresses = this.getTestAddresses()
    return { contracts, addresses: testAddresses }
  }
  
  /**
   * Load all mainnet contract addresses and instantiate local
   * contract instances
   */
  async loadMainnetContracts(addresses: ContractAddresses): Promise<any> {
    return getContracts(addresses)
  }

  /**
   * Load all contract addresses from a .json, according to the network configured
   */
  private getContractAddressesForNetwork(): ContractAddresses {
    if (this.network == 'mainnet') {
      return mainnetAddressesV1
    } else {
      throw new Error('No addresses for this network')
    } 
  }

  /**
   * Get Ethereum addresses that are needed during the e2e tests
   */
  private getTestAddresses(): string[] {
    return ['']
  }

  /**
   * Setup end to end tests for a local environment. Specifically:
   * 1) Deploy contracts that are only local and not yet on Mainnet
   * 3) Apply the various permissions to these contracts
   * 4) Apply appropriate permissions
   * 
   * Note: This is running on a forked mainnet state to account for 
   * the various dependencies in Uniswap, Chainlink etc.
   */
  public async initialiseLocalEnv() {
    const contracts = await this.deployNewProtocolContracts() 
    return contracts
  }

  /**
   * Deploy the contracts that exist in the protocol locally and 
   * which are not yet on Mainnet
   */
  private async deployNewProtocolContracts() {
    
  }

  /**
   * Deploy all contracts to a local node
   */
  // async deployContracts(): Promise<typeof Contract> {
  //   const contractsToDeploy = [];

  //   for (const contract in contractsToDeploy) {
  //     await this.deployContract(contract);
  //   }
  //   return {}
  // }

  // async deployContract() {
  // TODO
  // async manipulateChainlinkOracleLocally() {
  // }
}
