import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox, getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { BigNumber } from 'ethers';

const toBN = ethers.BigNumber.from;

const CHAINLINK_OHM_ETH_ORACLE = '0x90c2098473852E2F07678Fe1B6d595b1bd9b16Ed';

/*

Tribal Council proposal FIP #107

0. Deploy Chainlink oracle for OHM/ETH
1. Deploy Balancer LBP and initialise auction of ETH for OHM
2. Set Balancer LBP contract as a safe address on the guardian
3. Withdraw $10M ETH from Aave PCVDeposit to the Balancer LBP contract
5. Withdraw ~$530k OHM from x to the Balancer LBP contract
7. Initiate auction by calling forceSwap()
*/

// LBP Swapper config
const LBP_FREQUENCY = 86400 * 14; // 2 weeks in seconds
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(100); // 100 eth, $200k
let poolId; // auction pool id

const fipNumber = '107';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  //////////// 1. Deploy Chainlink Oracle Wrapper for OHM/ETH
  const chainlinkFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkOhmOracleWrapper = await chainlinkFactory.deploy(addresses.core, CHAINLINK_OHM_ETH_ORACLE);
  await chainlinkOhmOracleWrapper.deployed();

  logging && console.log('Chainlink OHM oracle deployed to: ', chainlinkOhmOracleWrapper.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // ETH: 5071000000000000000000 (95%), 5071k ETH, ~$10,000,000 at 1 ETH = $1972
  // OHM:  23935000000000 (5%), 23,935 OHM, ~$500,000 at 1 OHM = $20.89 overfunding by 10% and transferring $550k
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  const ethToOhmSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: chainlinkOhmOracleWrapper.address,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true, // TODO
      _decimalsNormalizer: 0 // TODO: Probably not zero
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.ohm,
    addresses.eth, // TODO: Should this be ETH or WETH? Probably WETH
    addresses.tribalCouncilTimelock, // Send OHM to the TribalCouncil Timelock once LBP has completed
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );
