import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber, BigNumberish } from 'ethers';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { TransactionResponse } from '@ethersproject/providers';
import { forceEth } from '@test/integration/setup/utils';

const e18 = (x: BigNumberish) => ethers.constants.WeiPerEther.mul(x);

const PROXY_ADMIN_STORAGE_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';

const fipNumber = 'indexotc';

let indexOtcBuyer: string;
let pcvStatsBefore: PcvStats;
let daiBalanceBefore: BigNumberish;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  indexOtcBuyer = addresses.wintermute;

  // Deploy INDEX otc escrow
  const indexOtcEscrow = await (
    await ethers.getContractFactory('OtcEscrow')
  ).deploy(
    addresses.feiDAOTimelock, // beneficiary = Tribe DAO
    indexOtcBuyer, // recipient = buyer
    addresses.index, // receivedToken = INDEX
    addresses.dai, // sentToken = DAI
    '100000000000000000000000', // receivedAmount = 100k INDEX
    '200000000000000000000000' // sentAmount = 200k DAI
  );

  logging && console.log('indexOtcEscrow:', indexOtcEscrow.address);

  return {
    indexOtcEscrow
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  indexOtcBuyer = addresses.wintermute;

  // INDEX OTC buyer transfer() 200,000 DAI to the OtcEscrow contract
  const daiWhaleSigner = await getImpersonatedSigner('0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168');
  await forceEth(daiWhaleSigner.address);
  await contracts.dai
    .connect(daiWhaleSigner)
    .transfer(contracts.indexOtcEscrow.address, await contracts.indexOtcEscrow.sentAmount());

  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
  daiBalanceBefore = await contracts.daiHoldingPCVDeposit.balance();
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
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  // check the PCV received 200,000 DAI
  const daiBalanceAfter = await contracts.daiHoldingPCVDeposit.balance();
  expect(daiBalanceAfter.sub(daiBalanceBefore)).to.be.equal(ethers.constants.WeiPerEther.mul(200_000));
  // check the OTC buyer received 100,000 INDEX
  expect(await contracts.index.balanceOf(indexOtcBuyer)).to.be.equal(ethers.constants.WeiPerEther.mul(100_000));
};

export { deploy, setup, teardown, validate };
