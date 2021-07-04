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
import { upgrade as applyPermissions, revokeOldContractPerms } from '../../scripts/dao/upgrade'

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
   * Setup end-to-end tests for the state of the protocol on Mainnet, before any upgrade.
   * No additional contracts deployed locally. This test is used to e2e the real system.
   * Specifically:
   * 1) Load all mainnet contracts from their addresses
   * 2) Get accounts ready to execute tests from
   */
  async beforeUpgrade(): Promise<TestEnv> {
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
   public async applyUpgrade(): Promise<TestEnv> {
    const existingContracts = await this.getExistingProtocolContracts()

    // Extract mainnet addresses to supply when deploying upgrade contracts
    const configAddresses = {
      coreAddress: this.mainnetAddresses['core'],
      feiEthPairAddress: this.mainnetAddresses['feiEthPair'],
      wethAddress: this.mainnetAddresses['weth'],
      uniswapRouterAddress: this.mainnetAddresses['uniswapRouter'],
      uniswapOracleAddress: this.mainnetAddresses['uniswapOracle'],
      chainlinkEthUsdOracleAddress: this.mainnetAddresses['chainlinkEthUsdOracle'],
      chainlinkFeiEthOracleAddress: this.mainnetAddresses['chainlinkFeiEthOracle'],
    }

    const deployedUpgradedContracts = await deployUpgradeContracts(this.config.deployAddress, configAddresses, this.config.logging)

    const contracts: TestEnvContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }
    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts, this.mainnetAddresses['feiEthPair'], this.mainnetAddresses['multisig'])
    
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
      oldUniswapPCVDepositAddress: this.mainnetAddresses['uniswapPCVDeposit'],
      ethUniswapPCVDepositAddress: deployedUpgradedContracts.uniswapPCVDeposit.address,
      ethUniswapPCVControllerAddress: deployedUpgradedContracts.uniswapPCVController.address,
      ethBondingCurveAddress: deployedUpgradedContracts.bondingCurve.address,
      ethReserveStabilizerAddress: deployedUpgradedContracts.ethReserveStabilizer.address,
      ratioPCVControllerAddress: deployedUpgradedContracts.ratioPCVController.address,
      pcvDripControllerAddress: deployedUpgradedContracts.pcvDripController.address,
      ethPairAddress: this.mainnetAddresses['feiEthPair'],
      timelockAddress: this.mainnetAddresses['timelock'],
      tribeReserveStabilizerAddress: deployedUpgradedContracts.tribeReserveStabilizer.address
    };

    const oldContractAddresses = {
      oldUniswapPCVDepositAddress: this.mainnetAddresses['uniswapPCVDeposit'],
      oldUniswapPCVControllerAddress: this.mainnetAddresses['uniswapPCVController'],
      oldTribeReserveStabilizerAddress: this.mainnetAddresses['tribeReserveStabilizer'],
      oldEthReserveStabilizerAddress: this.mainnetAddresses['ethReserveStabilizer'],
      oldRatioControllerAddress: this.mainnetAddresses['ratioPCVController'],
      oldPCVDripControllerAddress: this.mainnetAddresses['pcvDripController'],
      deployAddress: this.config.deployAddress,
      oldBondingCurveAddress: this.mainnetAddresses['bondingCurve']
    }
    
    await revokeOldContractPerms(this.localTestContracts.core, oldContractAddresses)

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
  setLocalTestContractAddresses(contracts: TestEnvContracts, feiEthPairAddress: string, multisigAddress: string) {
    this.localTestContractAddresses = {
      core: contracts.core.address,
      tribe: contracts.tribe.address,
      fei: contracts.fei.address,
      uniswapPCVDeposit: contracts.uniswapPCVDeposit.address,
      uniswapPCVController: contracts.uniswapPCVController.address,
      bondingCurve: contracts.bondingCurve.address,
      chainlinkEthUsdOracle: contracts.chainlinkEthUsdOracle.address,
      chainlinkFeiEthOracle: contracts.chainlinkFeiEthOracle.address,
      compositeOracle: contracts.compositeOracle.address,
      ethReserveStabilizer: contracts.ethReserveStabilizer.address,
      pcvDripController: contracts.pcvDripController.address,
      ratioPCVController: contracts.ratioPCVController.address,
      tribeReserveStabilizer: contracts.tribeReserveStabilizer.address,
      feiRewardsDistributor: contracts.feiRewardsDistributor.address,
      timelock: contracts.timelock.address,
      feiEthPair: feiEthPairAddress,
      multisig: multisigAddress
    }
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
    await this.localTestContracts.core.revokeMinter(this.config.deployAddress);
    await this.localTestContracts.core.revokeBurner(this.config.deployAddress);
    await this.localTestContracts.core.revokePCVController(this.config.deployAddress);
    await this.localTestContracts.core.revokeGovernor(this.config.deployAddress);
  }

  /**
   * Get the access control mapping for the contracts. The access control is managed by the 
   * permissions contract
   */
  getAccessControlMapping(): ContractAccessRights {
    const accessControlRoles = {
      minter: [
        this.localTestContractAddresses.bondingCurve,
        this.localTestContractAddresses.uniswapPCVDeposit,
        this.localTestContractAddresses.uniswapPCVController,
        this.localTestContractAddresses.feiRewardsDistributor,
        this.localTestContractAddresses.timelock,
      ],
      burner: [
        this.localTestContractAddresses.ethReserveStabilizer,
        this.localTestContractAddresses.uniswapPCVController,
        this.localTestContractAddresses.tribeReserveStabilizer
      ],
      governor: [
        this.localTestContractAddresses.core,
        this.localTestContractAddresses.timelock
      ],
      pcvController: [
        this.localTestContractAddresses.timelock,
        this.localTestContractAddresses.ratioPCVController,
        this.localTestContractAddresses.pcvDripController
      ],
      guardian: [
        this.localTestContractAddresses.multisig
      ],
    }
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
    const feiRewardsDistributor = await getContract('feiRewardsDistributor', this.mainnetAddresses['feiRewardsDistributor'])
    const timelock = await getContract('timelock', this.mainnetAddresses['timelock'])
    return { core, fei, tribe, ethReserveStabilizer, feiRewardsDistributor, timelock }
  }
}
