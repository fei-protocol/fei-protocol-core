import mainnetAddressesV1 from '../../contract-addresses/mainnetAddresses.json'
import { getContracts, getContract } from './loadContracts'
import {
  Config,
  ContractAccessRights,
  MainnetContractAddresses,
  ExistingProtocolContracts,
  TestCoordinator,
  TestEnv,
  TestEnvContracts,
  TestEnvContractAddresses
} from './types'
import { sudo } from '../../scripts/utils/sudo'
import { upgrade as deployUpgradeContracts } from '../../deploy/upgrade'
import { upgrade as applyPermissions } from '../../scripts/dao/upgrade'

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run with additional local contracts deployed or
 * in a purely 100% mainnet forked mode
*/
export class TestEndtoEndCoordinator implements TestCoordinator { 
  private mainnetAddresses: MainnetContractAddresses;
  private localTestContracts: TestEnvContracts;
  private localTestContractAddresses: TestEnvContractAddresses;

  constructor(
    private config: Config,
  ) {
      this.mainnetAddresses = this.getMainnetContractAddresses()
  }

  /**
   * Setup end-to-end tests for a 100% forked mainnet environment.
   * No additional contracts deployed locally. This test is used to e2e the real system.
   * Specifically:
   * 1) Load all mainnet contracts from their addresses
   * 2) Get accounts ready to execute tests from
   */
  async initialiseMainnetEnv(): Promise<TestEnv> {
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
   public async initialiseLocalEnv(): Promise<TestEnv> {
    const existingContracts = await this.getExistingProtocolContracts()

    // Extract mainnet addresses to supply when deploying upgrade contracts
    const configAddresses = {
      coreAddress: this.mainnetAddresses['core'],
      feiEthPairAddress: this.mainnetAddresses['feiEthPair'],
      wethAddress: this.mainnetAddresses['weth'],
      uniswapRouterAddress: this.mainnetAddresses['uniswapRouter'],
      uniswapOracleAddress: this.mainnetAddresses['uniswapOracle']
    }
    const deployedUpgradedContracts = await deployUpgradeContracts(this.config.deployAddress, configAddresses, this.config.logging)

    const contracts: TestEnvContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }
    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts)
    
    const requiredSudoAddresses = {
      coreAddress: this.mainnetAddresses['core'],
      feiAddress: this.mainnetAddresses['fei'],
      timelockAddress: this.mainnetAddresses['timelock']
    }
    
    // Grant priviledges to deploy address
    await sudo(requiredSudoAddresses, this.config.logging)
    
    // If contract not upgraded, use mainnet address - e.g. this.addresses['core']
    // If contract has been upgraded and a new one deployed"
    //  - use local deploy address e.g. contracts.core.address
    const requiredApplyPermissionsAddresses = {
      coreAddress: this.mainnetAddresses['core'],
      ethUniswapPCVDepositAddress: deployedUpgradedContracts.uniswapPCVController.address,
      ethUniswapPCVControllerAddress: deployedUpgradedContracts.uniswapPCVController.address,
      ethBondingCurveAddress: deployedUpgradedContracts.bondingCurve.address,
      ethReserveStabilizerAddress: deployedUpgradedContracts.ethReserveStabilizer.address,
      ratioPCVControllerAddress: deployedUpgradedContracts.ratioPCVController.address,
      pcvDripControllerAddress: deployedUpgradedContracts.pcvDripController.address,
      ethPairAddress: this.mainnetAddresses['feiEthPair'],
      timelockAddress: this.mainnetAddresses['timelock'],
      tribeReserveStabilizerAddress: deployedUpgradedContracts.tribeReserveStabilizer.address
    };

    // Grant minter, burner, pcvController permissions etc to the relevant contracts
    await applyPermissions(requiredApplyPermissionsAddresses, this.config.logging)
    return { contracts: this.localTestContracts, contractAddresses: this.localTestContractAddresses }
  }

  /**
   * Set the web3 contracts used in the test environment
   */
  setLocalTestContracts(contracts: TestEnvContracts) {
    this.localTestContracts = contracts;
  }

  /**
   * Set the addresses of the contracts used in the test environment
   */
  setLocalTestContractAddresses(contracts: TestEnvContracts) {
    this.localTestContractAddresses = {
      core: contracts.core.address,
      tribe: contracts.tribe.address,
      fei: contracts.fei.address,
      uniswapPCVDeposit: contracts.uniswapPCVDeposit.address,
      uniswapPCVController: contracts.uniswapPCVController.address,
      bondingCurve: contracts.bondingCurve.address,
      chainlinkEthUsdOracleWrapper: contracts.chainlinkEthUsdOracleWrapper.address,
      chainlinkFeiEthOracleWrapper: contracts.chainlinkFeiEthOracleWrapper.address,
      compositeOracle: contracts.compositeOracle.address,
      ethReserveStabilizer: contracts.ethReserveStabilizer.address,
      pcvDripController: contracts.pcvDripController.address,
      ratioPCVController: contracts.ratioPCVController.address,
      tribeReserveStabilizer: contracts.tribeReserveStabilizer.address,
    }
  }

  /**
   * Get all contract addresses used in the test environment
   */
  getLocalProtocolAddresses(): MainnetContractAddresses {
    return this.mainnetAddresses
  }


  /**
   * Get the access control mapping for the contracts. The access control is managed by the 
   * permissions contract
   */
  getAccessControlMapping(): ContractAccessRights {
    // contracts = getProtocolContracts();
    // TODO: add access control mapping for other contracts
    // how to get all the contract addresses that I need?

    const accessControlRoles = {
      minter: [],
      burner: [],
      governor: [],
      pcvController: [],
      guardian: [],
    }
        // minter: [pcvDeposit, pcvController, ...], // 5

        // check core.getCount(minter) = minter.length
        // for i in minter:
        // assert isMinter(i)
    return accessControlRoles
  }
  
  /**
   * Get all Mainnet contracts, instantiated as web3 instances
   */
  async loadMainnetContracts(addresses: MainnetContractAddresses): Promise<TestEnvContracts> {
    return getContracts(addresses)
  }

  /**
   * Load all contract addresses from a .json, according to the network configured
   */
  private getMainnetContractAddresses(): MainnetContractAddresses {
      return mainnetAddressesV1
  }

  /**
   * Get the protocol contracts that are already deployed on Mainnet
   */
  private async getExistingProtocolContracts(): Promise<ExistingProtocolContracts> {
    const core = await getContract('core', this.mainnetAddresses['core'])
    const fei = await getContract('fei', this.mainnetAddresses['fei'])
    const tribe = await getContract('tribe', this.mainnetAddresses['tribe'])
    const ethReserveStabilizer = await getContract('ethReserveStabilizer', this.mainnetAddresses['ethReserveStabilizer'])
    return { core, fei, tribe, ethReserveStabilizer }
  }
}
