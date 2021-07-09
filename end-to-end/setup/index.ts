import mainnetAddressesV1 from '../../contract-addresses/mainnetAddresses.json'
import permissions from '../../contract-addresses/permissions.json'
import { getContracts, getContract } from './loadContracts'
import {
  Config,
  ContractAccessRights,
  MainnetContractAddresses,
  ExistingProtocolContracts,
  TestCoordinator,
  EnvBeforeUpgrade,
  EnvAfterUpgrade,
  ContractsAfterUpgrade,
  ContractsBeforeUpgrade,
  AddressesAfterUpgrade
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
  private mainnetAddresses: MainnetContractAddresses;
  private afterUpgradeContracts: ContractsAfterUpgrade;
  private afterUpgradeAddresses: AddressesAfterUpgrade;

  constructor(
    private config: Config,
  ) {
      this.mainnetAddresses = this.getMainnetContractAddresses()
  }

  /**
   * Setup end-to-end tests against the state of the protocol on Mainnet, before any upgrade.
   * No additional contracts deployed locally.
   */
  async beforeUpgrade(): Promise<EnvBeforeUpgrade> {
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
   public async applyUpgrade(): Promise<EnvAfterUpgrade> {
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

    // Override RatioPCVController with old contract, due to pcvDeposit abi clashes
    const ratioPCVController = await RatioPCVController.new(this.mainnetAddresses['core'])
    deployedUpgradedContracts.ratioPCVController = ratioPCVController

    const contracts: ContractsAfterUpgrade = {
      ...existingContracts,
      ...deployedUpgradedContracts
    }
    this.setLocalTestContracts(contracts)
    this.setLocalTestContractAddresses(contracts, this.mainnetAddresses['multisig'])
    
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
      oldEthReserveStabilizerAddress: this.mainnetAddresses['ethReserveStabilizer'],
      oldRatioControllerAddress: this.mainnetAddresses['ratioPCVController'],
      deployAddress: this.config.deployAddress,
      oldBondingCurveAddress: this.mainnetAddresses['bondingCurve']
    }
    
    await revokeOldContractPerms(this.afterUpgradeContracts.core, oldContractAddresses)

    // Grant minter, burner, pcvController permissions etc to the relevant contracts
    await applyPermissions(requiredApplyPermissionsAddresses, this.config.logging)
    return { contracts: this.afterUpgradeContracts, contractAddresses: this.afterUpgradeAddresses }
  }

  /**
   * Set the web3 contracts used in the test environment
   */
  setLocalTestContracts(contracts: ContractsAfterUpgrade) {
    this.afterUpgradeContracts = contracts;
  }

  /**
   * Set the addresses of the contracts used in the test environment
   */
  setLocalTestContractAddresses(contracts: ContractsAfterUpgrade, multisigAddress: string) {
    this.afterUpgradeAddresses = {
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
      feiEthPair: contracts.feiEthPair.address,
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
    const accessControlRoles = {
      "minter" : [],
      "burner" : [],
      "pcvController" : [],
      "governor" : [],
      "guardian" : []
    }

    // Array of all deployed contracts
   Object.keys(permissions).map(role => {
      const contracts = permissions[role];
      const addresses = contracts.map(contract => {
        return this.afterUpgradeAddresses[contract];
      });
      accessControlRoles[role] = addresses;
    });
    
    return accessControlRoles;
  }
  
  /**
   * Get all Mainnet contracts, instantiated as web3 instances
   */
  async loadMainnetContracts(addresses: MainnetContractAddresses): Promise<ContractsBeforeUpgrade> {
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
    const feiEthPair = await getContract('uniswapV2Pair', this.mainnetAddresses['feiEthPair'])
    return { core, fei, tribe, ethReserveStabilizer, feiRewardsDistributor, timelock, feiEthPair }
  }
}
