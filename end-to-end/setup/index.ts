import mainnetAddressesV1 from '../../contract-addresses/mainnetAddresses.json'
import { getContracts, getContract } from './loadContracts'
import { Config, ContractAccessRights, ContractAddresses, TestCoordinator, TestEnv, TestEnvContracts } from './types'
import { sudo } from '../../scripts/utils/sudo'
import { upgrade as upgradeProtocol } from '../../deploy/upgrade'
import { upgrade as applyPermissions } from '../../scripts/dao/upgrade'

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run with additional local contracts deployed or
 * in a purely 100% mainnet forked mode
*/
export class TestEndtoEndCoordinator implements TestCoordinator { 
  private supportedNetworks = ['mainnet', 'local']
  private addresses: ContractAddresses;

  constructor(
    private config: Config,
  ) {
    if (this.supportedNetworks.includes(this.config.network)) {
      this.addresses = this.getContractAddressesForNetwork(config.network)
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
    const contractAddresses = this.getAddresses()
    return { contracts, contractAddresses }
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
   * 
   * TODO: add in an override where you can choose which contracts to deploy
   * and upgrade
   */
   public async initialiseLocalEnv(): Promise<TestEnv> {
    //  upgradedContracts = {'core': '0x124'}
    // applies overrride 
    const contracts = await this.getProtocolContracts()

    const requiredSudoAddresses = {
      coreAddress: this.addresses['core'],
      feiAddress: this.addresses['fei'],
      timelockAddress: this.addresses['timelock']
    }
    await sudo(requiredSudoAddresses, this.config.logging)
    
    // if contract not upgraded, use mainnet version. this.addresses['core']
    // if contract is upgraded, take in override and deploy new contract +
    // get address contracts.core.address
    const requiredApplyPermissionsAddresses = {
      coreAddress: this.addresses['core'],
      ethUniswapPCVDepositAddress: contracts.uniswapPCVController.address,
      ethUniswapPCVControllerAddress: contracts.uniswapPCVController.address,
      ethBondingCurveAddress: contracts.bondingCurve.address,
      ethReserveStabilizerAddress: contracts.ethReserveStabilizer.address,
      ratioPCVControllerAddress: contracts.ratioPCVController.address,
      pcvDripControllerAddress: contracts.pcvDripController.address,
      ethPairAddress: this.addresses['feiEthPair'],
      timelockAddress: this.addresses['timelock'],
      tribeReserveStabilizerAddress: contracts.tribeReserveStabilizer.address
    };

    await applyPermissions(requiredApplyPermissionsAddresses, this.config.logging)
    const contractAddresses = this.getAddresses()

    return { contracts, contractAddresses }
  }

  /**
   * Get all contract addresses used in the test environment
   */
  getAddresses(): ContractAddresses {
    return this.addresses
  }


  /**
   * Get the access control mapping for the contracts. The access control is managed by the 
   * permissions contract
   */
  getAccessControlMapping(): ContractAccessRights {
    const accessControlMapping = [
      {
        contractName: 'core',
        accessRights: {
          isGovernor: true,
          isPCVController: true,
          isMinter: true,
          isBurner: true,
          isGuardian: false,
        }
      }
    ]

    return accessControlMapping
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
   * Deploy the contracts that exist in the protocol locally and 
   * which are not yet on Mainnet
   */
  private async getProtocolContracts(): Promise<TestEnvContracts> {
    const core = await getContract('core', this.addresses['core'])
    const fei = await getContract('fei', this.addresses['fei'])
    const tribe = await getContract('tribe', this.addresses['tribe'])
    const ethReserveStabilizer = await getContract('ethReserveStabilizer', this.addresses['ethReserveStabilizer'])

    const configAddresses = {
      coreAddress: this.addresses['core'],
      feiEthPairAddress: this.addresses['feiEthPair'],
      wethAddress: this.addresses['weth'],
      uniswapRouterAddress: this.addresses['uniswapRouter'],
      uniswapOracleAddress: this.addresses['uniswapOracle']
    }
    const upgradeContracts = await upgradeProtocol(this.config.deployAddress, configAddresses, this.config.logging)
    return { core, fei, tribe, ethReserveStabilizer, ...upgradeContracts}
  }
}
