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
const e18 = ethers.constants.WeiPerEther;

const fipNumber = 'pcv_guardian_v3';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // fetch currently safe addresses on the PCV Guardian v2
  const pcvGuardianV2 = new ethers.Contract(
    addresses.pcvGuardianV2,
    ['function getSafeAddresses() public view returns (address[])'],
    ethers.provider.getSigner(addresses.pcvGuardianV2)
  );
  const safeAddresses = await pcvGuardianV2.getSafeAddresses();

  // Deploy new PCV Guardian v3
  const pcvGuardianFactory = await ethers.getContractFactory('PCVGuardian');
  const pcvGuardian = await pcvGuardianFactory.deploy(addresses.core, safeAddresses);
  await pcvGuardian.deployed();
  logging && console.log(`pcvGuardian: ${pcvGuardian.address}`);

  const fuseWithdrawalGuardFactory = await ethers.getContractFactory('FuseWithdrawalGuard');
  const fuseWithdrawalGuard = await fuseWithdrawalGuardFactory.deploy(
    addresses.core,
    pcvGuardian.address,
    [
      addresses.rariPool8FeiPCVDeposit,
      addresses.rariPool8DaiPCVDeposit,
      addresses.rariPool8LusdPCVDeposit,
      addresses.rariPool79FeiPCVDeposit,
      addresses.rariPool128FeiPCVDeposit,
      addresses.rariPool22FeiPCVDeposit,
      addresses.rariPool24FeiPCVDeposit,
      addresses.rariPool18FeiPCVDeposit,
      addresses.rariPool6FeiPCVDeposit,
      addresses.turboFusePCVDeposit
    ],
    [
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.lusdHoldingPCVDeposit,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM,
      addresses.daiFixedPricePSM
    ],
    [
      addresses.fei,
      addresses.dai,
      addresses.lusd,
      addresses.fei,
      addresses.fei,
      addresses.fei,
      addresses.fei,
      addresses.fei,
      addresses.fei,
      addresses.fei
    ],
    [e18.mul(191_000), e18.mul(64_000), e18.mul(4_000), e18.mul(100_000), 0, 0, 0, 0, 0, 0]
  );
  await fuseWithdrawalGuard.deployed();
  logging && console.log(`fuseWithdrawalGuard: ${fuseWithdrawalGuard.address}`);

  return {
    pcvGuardian,
    fuseWithdrawalGuard
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
