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
  private contractNames = [
    'Core', 'Tribe', 'FeiDAO', 'FeiDAOTimelock', 'Fei', 'UniswapIncentive', 
    'EthBondingCurve', 'EthUniswapPCVDeposit', 'EthUniswapPCVController',
    'UniswapOracle', 'BondingCurveOracle', 'FeiRewardsDistributor', 'FeiStakingRewards',
    'GenesisGroup', 'FeiRouter', 'EthReserveStabiliser', 'EthPCVDripper', 
    'RatioPCVController', 'EthPCVDepositAdapter', 'FEIETHUniV2Pair', 'FEITRIBEUniV2Pair'
  ]

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
    return getContracts(this.contractNames, addresses)
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
   * 1) Deploy all contracts
   * 2) Get accounts ready to execute tests from
   */
  public async initialiseLocalEnv() {
    return await Promise.all[0]
    // TODO
    // const contracts = await this.deployContracts() 
    // return contracts
  }

  /**
   * Deploy all contracts to a local node
   */
  // TODO
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
