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
import { getImpersonatedSigner, overwriteChainlinkAggregator, ZERO_ADDRESS, balance, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

let pcvStatsBefore: PcvStats;
let daiBalanceBefore: BigNumber;

const fipNumber = '110';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy Lido stETH/USD oracle
  const angleEuroRedeemerFactory = await ethers.getContractFactory('AngleEuroRedeemer');
  const angleEuroRedeemer = await angleEuroRedeemerFactory.deploy();
  await angleEuroRedeemer.deployed();
  logging && console.log(`angleEuroRedeemer: ${angleEuroRedeemer.address}`);

  return {
    angleEuroRedeemer
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice).toString(), '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // angle multisig action : make enough USDC collateral available for redemptions
  const angleMultisigSigner = await getImpersonatedSigner('0x0C2553e4B9dFA9f83b1A6D3EAB96c4bAaB42d430');
  await forceEth(angleMultisigSigner.address);
  await contracts.anglePoolManagerUsdc.connect(angleMultisigSigner).updateStrategyDebtRatio(
    addresses.angleStrategyUsdc1, // USDC strategy has 57M deployed
    '0'
  );
  await contracts.angleStrategyUsdc1.harvest();

  // read DAI PSM balance before proposal execution
  daiBalanceBefore = await contracts.dai.balanceOf(addresses.daiFixedPricePSM);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // check ANGLE token movement
  expect(await contracts.angle.balanceOf(addresses.angleDelegatorPCVDeposit)).to.be.equal('0');
  expect(await contracts.angle.balanceOf(addresses.tribalCouncilSafe)).to.be.at.least(
    ethers.utils.parseEther('200000')
  );
  // check deposit is empty
  expect(await contracts.agEurUniswapPCVDeposit.balance()).to.be.equal('0');
  expect(await contracts.fei.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');
  expect(await contracts.agEUR.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');

  // check redemptions of agEUR > DAI
  const daiRedeemed = (await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).sub(daiBalanceBefore);
  console.log('daiRedeemed', daiRedeemed.toString() / 1e18);
  expect(daiRedeemed).to.be.at.least(ethers.utils.parseEther('9500000')); // >9.5M DAI

  // check redeemer is empty
  expect(await contracts.fei.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.usdc.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');

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
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');
};

export { deploy, setup, teardown, validate };
