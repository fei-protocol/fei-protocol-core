import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  PcvStats
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time, expectRevert } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract } from 'ethers';

let pcvStatsBefore: PcvStats;
let ethPrice8Decimals: string;

const fipNumber = 'rocketpool';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy RocketPoolPCVDeposit
  const rocketPoolPCVDepositFactory = await ethers.getContractFactory('RocketPoolPCVDeposit');
  const rocketPoolPCVDeposit = await rocketPoolPCVDepositFactory.deploy(
    addresses.core,
    '0', // max deposit slippage
    '100' // max withdraw slippage
  );
  await rocketPoolPCVDeposit.deployed();
  logging && console.log(`rocketPoolPCVDeposit: ${rocketPoolPCVDeposit.address}`);

  return {
    rocketPoolPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  ethPrice8Decimals = Math.round((await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10).toString();
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, ethPrice8Decimals, '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('----------------------------------------------------');
  console.log('rocketPoolPCVDeposit.balance()', (await contracts.rocketPoolPCVDeposit.balance()) / 1e18);
  console.log(
    'rocketPoolPCVDeposit WETH     ',
    (await contracts.weth.balanceOf(contracts.rocketPoolPCVDeposit.address)) / 1e18
  );
  console.log(
    'rocketPoolPCVDeposit rETH     ',
    (await contracts.reth.balanceOf(contracts.rocketPoolPCVDeposit.address)) / 1e18
  );
  console.log('----------------------------------------------------');
  let i = 0;
  let continueLoops = true;
  while (continueLoops && i <= 100) {
    i++;
    const previewDeposit = await contracts.rocketPoolPCVDeposit.callStatic.previewDeposit(
      ethers.utils.parseEther('100')
    );
    const arbProfit = previewDeposit[2];
    if (arbProfit > 0) {
      console.log('rocketPoolPCVDeposit.deposit(100) #', i, 'Arb available, taking -> ETH profit', arbProfit / 1e18);
      await contracts.rocketPoolPCVDeposit['deposit(uint256)'](ethers.utils.parseEther('100'));
    } else {
      console.log('rocketPoolPCVDeposit.deposit(100) #', i, 'No arb available -> stop.');
      continueLoops = false;
    }
  }
  console.log('----------------------------------------------------');
  console.log('rocketPoolPCVDeposit.balance()', (await contracts.rocketPoolPCVDeposit.balance()) / 1e18);
  console.log(
    'rocketPoolPCVDeposit WETH     ',
    (await contracts.weth.balanceOf(contracts.rocketPoolPCVDeposit.address)) / 1e18
  );
  console.log(
    'rocketPoolPCVDeposit rETH     ',
    (await contracts.reth.balanceOf(contracts.rocketPoolPCVDeposit.address)) / 1e18
  );

  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', Number(pcvStatsBefore.protocolControlledValue) / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', Number(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', Number(pcvStatsBefore.protocolEquity) / 1e24);
  const pcvStatsAfter: PcvStats = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', Number(pcvStatsAfter.protocolControlledValue) / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', Number(pcvStatsAfter.userCirculatingFei) / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', Number(pcvStatsAfter.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff: BigNumber = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff: BigNumber = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff: BigNumber = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');
};

export { deploy, setup, teardown, validate };
