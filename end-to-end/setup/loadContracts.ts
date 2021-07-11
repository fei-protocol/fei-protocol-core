import { artifacts } from 'hardhat'
import { MainnetContractAddresses, ContractsAfterUpgrade } from './types';

const coreArtifact = artifacts.require('Core')
const tribeArtifact = artifacts.require('Tribe')
const governorAlpha = artifacts.require('GovernorAlpha')
const timelockArtifact = artifacts.require('Timelock')
const feiArtifact = artifacts.require('Fei')
const ethBondingCurveArtifact = artifacts.require('EthBondingCurve')
const uniswapPCVDepositArtifact = artifacts.require('UniswapPCVDeposit')
const uniswapPCVController = artifacts.require('UniswapPCVController')
const uniswapOracleArtifact = artifacts.require('UniswapOracle')
const feiRewardsDistributorArtifact = artifacts.require('FeiRewardsDistributor')
const feiStakingRewardsArtifact = artifacts.require('FeiStakingRewards')
const ethReserveStabilizerArtifact = artifacts.require('EthReserveStabilizer')
const ratioPCVControllerArtifact = artifacts.require('RatioPCVController')
const pCVDepositAdapterArtifact = artifacts.require('PCVDripController')
const uniswapV2PairArtifact = artifacts.require('IUniswapV2Pair')

export function getContractArtifacts() {
  return {
    'core': coreArtifact,
    'tribe': tribeArtifact,
    'governorAlpha': governorAlpha,
    'timelock': timelockArtifact,
    'fei': feiArtifact,
    'bondingCurve': ethBondingCurveArtifact,
    'uniswapPCVDeposit': uniswapPCVDepositArtifact,
    'uniswapPCVController': uniswapPCVController,
    'uniswapOracle': uniswapOracleArtifact,
    'uniswapV2Pair': uniswapV2PairArtifact,
    'feiRewardsDistributor': feiRewardsDistributorArtifact,
    'feiStakingRewards': feiStakingRewardsArtifact,
    'ethReserveStabilizer': ethReserveStabilizerArtifact,
    'ratioPCVController': ratioPCVControllerArtifact,
    'pcvDepositAdapter': pCVDepositAdapterArtifact,
  }
}

/**
 * Gets all contract instances for a set of contract names and their
 * addresses
 */
export async function getContracts(contractAddresses: MainnetContractAddresses): Promise<ContractsAfterUpgrade> {
  // Array of all deployed contracts
  const deployedContracts = await Promise.all(Object.keys(contractAddresses).map(async contractName => {
    const web3Contract = await getContract(contractName, contractAddresses[contractName])
    return [contractName, web3Contract]
  }))
  
  // Object with mapping between contract name and contract instance
  const deployedContractObjects = deployedContracts.reduce((accumulator, currentDeployedContracts) => {
    const [contractName, contractInstance] = currentDeployedContracts;
    accumulator[contractName] = contractInstance;
    return accumulator
  })

  return deployedContractObjects as unknown as ContractsAfterUpgrade
}

/**
 * Factory function to get the web3 instantiation of a contract
 */
export async function getContract(contractName: string, contractAddress: string) {
  const contractArtifacts = getContractArtifacts()
  return contractArtifacts[contractName].at(contractAddress)
}