import { artifacts } from 'hardhat'
import { MainnetContractAddresses, MainnetContracts } from './types';

const coreArtifact = artifacts.require('Core')
const tribeArtifact = artifacts.require('Tribe')
const governorAlpha = artifacts.require('GovernorAlpha')
const timelockArtifact = artifacts.require('Timelock')
const feiArtifact = artifacts.require('Fei')
const ethBondingCurveArtifact = artifacts.require('EthBondingCurve')
const uniswapPCVDepositArtifact = artifacts.require('UniswapPCVDeposit')
const uniswapPCVController = artifacts.require('UniswapPCVController')
const compositeOracleArtifact = artifacts.require('CompositeOracle')
const uniswapOracleArtifact = artifacts.require('UniswapOracle')
const feiRewardsDistributorArtifact = artifacts.require('FeiRewardsDistributor')
const feiStakingRewardsArtifact = artifacts.require('FeiStakingRewards')
const ethReserveStabilizerArtifact = artifacts.require('EthReserveStabilizer')
const ratioPCVControllerArtifact = artifacts.require('RatioPCVController')
const pCVDepositAdapterArtifact = artifacts.require('PCVDripController')
const uniswapV2PairArtifact = artifacts.require('IUniswapV2Pair')

export function getContractArtifacts() {
  return {
    'coreAddress': coreArtifact,
    'tribeAddress': tribeArtifact,
    'governorAlphaAddress': governorAlpha,
    'timelockAddress': timelockArtifact,
    'feiAddress': feiArtifact,
    'bondingCurveAddress': ethBondingCurveArtifact,
    'uniswapPCVDepositAddress': uniswapPCVDepositArtifact,
    'uniswapPCVControllerAddress': uniswapPCVController,
    'uniswapOracleAddress': uniswapOracleArtifact,
    'uniswapV2PairAddress': uniswapV2PairArtifact,
    'feiEthPairAddress' : uniswapV2PairArtifact,
    'compositeOracleAddress' : compositeOracleArtifact,
    'feiRewardsDistributorAddress': feiRewardsDistributorArtifact,
    'feiStakingRewardsAddress': feiStakingRewardsArtifact,
    'ethReserveStabilizerAddress': ethReserveStabilizerArtifact,
    'ratioPCVControllerAddress': ratioPCVControllerArtifact,
    'pcvDepositAdapterAddress': pCVDepositAdapterArtifact,
  }
}

/**
 * Gets all contract instances for a set of contract names and their
 * addresses
 */
export async function getContracts(contractAddresses: MainnetContractAddresses): Promise<MainnetContracts> {
  // Array of all deployed contracts
  const deployedContracts = await Promise.all(Object.keys(contractAddresses).map(async contractName => {
    const web3Contract = await getContract(contractName, contractAddresses[contractName])
    return [contractName.replace('Address', ''), web3Contract]
  }))
  

  // Object with mapping between contract name and contract instance
  const deployedContractObjects = deployedContracts.reduce((accumulator, currentDeployedContracts) => {
    const [contractName, contractInstance] = currentDeployedContracts;
    accumulator[contractName] = contractInstance;
    return accumulator
  })
  deployedContractObjects['core'] = await getContract('coreAddress', contractAddresses['coreAddress'])
  return deployedContractObjects as unknown as MainnetContracts
}

/**
 * Gets all contract instances for a set of contract names and their
 * addresses
 */
 export function getContractAddresses(contracts: MainnetContracts): MainnetContractAddresses {
  // Array of all deployed contracts
  const deployedContractAddresses = Object.keys(contracts).map(contractName => {
    return [contractName + 'Address', contracts[contractName].address]
  })
  
  // Object with mapping between contract name and contract instance
  const deployedContractAddressObjects = deployedContractAddresses.reduce((accumulator, currentDeployedContracts) => {
    const [contractName, contractAddress] = currentDeployedContracts;
    accumulator[contractName] = contractAddress;
    return accumulator
  })

  return deployedContractAddressObjects as unknown as MainnetContractAddresses
}

/**
 * Factory function to get the web3 instantiation of a contract
 */
export async function getContract(contractName: string, contractAddress: string) {
  const contractArtifacts = getContractArtifacts()
  return contractArtifacts[contractName].at(contractAddress)
}