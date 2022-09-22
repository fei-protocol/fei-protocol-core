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

const fipNumber = 'vebalotc';

let vebalOtcBuyer: string;
let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  vebalOtcBuyer = addresses.aaveCompaniesMultisig;

  // Deploy veBAL Helper contract
  const VeBalHelperFactory = await ethers.getContractFactory('VeBalHelper');
  const vebalOtcHelper = await VeBalHelperFactory.deploy(
    vebalOtcBuyer, // _owner
    addresses.veBalDelegatorPCVDeposit, // _pcvDeposit
    addresses.balancerGaugeStaker // _boostManager
  );
  await vebalOtcHelper.deployTransaction.wait();
  logging && console.log(`vebalOtcHelper: ${vebalOtcHelper.address}`);

  // Deploy veBoostManager implementation
  const VeBoostManagerFactory = await ethers.getContractFactory('VeBoostManager');
  const veBoostManagerImplementation = await VeBoostManagerFactory.deploy(
    addresses.core,
    addresses.balancerGaugeController,
    addresses.balancerMinter
  );
  await veBoostManagerImplementation.deployTransaction.wait();
  logging && console.log(`veBoostManagerImplementation: ${veBoostManagerImplementation.address}`);

  return {
    veBoostManagerImplementation,
    vebalOtcHelper
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  vebalOtcBuyer = addresses.aaveCompaniesMultisig;
  await forceEth(vebalOtcBuyer);

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
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  const otcBuyerSigner = await getImpersonatedSigner(vebalOtcBuyer);

  // Check the proxy's state variables
  expect(await contracts.veBoostManager.owner()).to.be.equal(addresses.vebalOtcHelper);
  expect(await contracts.veBoostManager.votingEscrowDelegation()).to.be.equal(addresses.balancerVotingEscrowDelegation);
  expect(await contracts.veBoostManager.balancerMinter()).to.be.equal(addresses.balancerMinter);
  expect(await contracts.veBoostManager.gaugeController()).to.be.equal(addresses.balancerGaugeController);
  expect(await contracts.veBoostManager.core()).to.be.equal(addresses.core);

  // Check veBAL OTC helper owner and proxy owner
  expect(await contracts.vebalOtcHelper.owner()).to.be.equal(vebalOtcBuyer);
  expect(await contracts.veBoostManager.owner()).to.be.equal(contracts.vebalOtcHelper.address);
  expect(
    '0x' + (await ethers.provider.getStorageAt(addresses.veBoostManagerProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(vebalOtcBuyer.toLowerCase());

  // Check that OTC Buyer can transfer proxy ownership
  await contracts.veBoostManagerProxy.connect(otcBuyerSigner).changeAdmin(addresses.feiDAOTimelock);
  expect(
    '0x' + (await ethers.provider.getStorageAt(addresses.veBoostManagerProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(addresses.feiDAOTimelock.toLowerCase());

  // Check veBAL OTC Helper contract behavior
  // Can create_boost() to create a boost delegation to someone else
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).create_boost(
    addresses.veBalDelegatorPCVDeposit, // address _delegator
    addresses.eswak, // address _receiver
    '10000', // int256 _percentage
    '1669852800', // uint256 _cancel_time = December 1 2022
    '1672272000', // uint256 _expire_time = December 29 2022
    '0' // uint256 _id
  );
  const expectedMinBoost = '70000000000000000000000'; // should be 77.5k with 18 decimals as of 14/09/2022
  expect(
    await contracts.balancerVotingEscrowDelegation.delegated_boost(contracts.veBalDelegatorPCVDeposit.address)
  ).to.be.at.least(expectedMinBoost);
  expect(await contracts.balancerVotingEscrowDelegation.received_boost(addresses.eswak)).to.be.at.least(
    expectedMinBoost
  );

  // token id is uint256(delegatorAddress << 96 + boostId), and boostId = 0
  const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
  expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least(expectedMinBoost);
  expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal('1672272000');
  expect(await contracts.balancerVotingEscrowDelegation.token_cancel_time(tokenId)).to.equal('1669852800');

  // Can setDelegate() to give Snapshot voting power to someone else
  expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(addresses.eswak);
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).setDelegate(addresses.feiDAOTimelock);
  expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(addresses.feiDAOTimelock);

  // Can clearDelegate() to give Snapshot voting power to nobody
  const snapshotSpaceId = await contracts.veBalDelegatorPCVDeposit.spaceId();
  expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(addresses.feiDAOTimelock);
  expect(
    await contracts.snapshotDelegateRegistry.delegation(addresses.veBalDelegatorPCVDeposit, snapshotSpaceId)
  ).to.be.equal(addresses.feiDAOTimelock);
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).clearDelegate();
  expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(contracts.vebalOtcHelper.address);
  expect(
    await contracts.snapshotDelegateRegistry.delegation(addresses.veBalDelegatorPCVDeposit, snapshotSpaceId)
  ).to.be.equal(ethers.constants.AddressZero);

  // Can setGaugeController() to update gauge controller
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(addresses.feiDAOTimelock);
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(addresses.balancerGaugeController);

  // Can voteForGaugeWeight() to vote for gauge weights while a lock is active
  // remove 100% votes for B-30FEI-70WETH
  expect(
    (
      await contracts.balancerGaugeController.vote_user_slopes(
        addresses.veBalDelegatorPCVDeposit,
        addresses.balancerGaugeBpt30Fei70Weth
      )
    )[1]
  ).to.be.equal('10000');
  await contracts.vebalOtcHelper
    .connect(otcBuyerSigner)
    .voteForGaugeWeight(addresses.bpt30Fei70Weth, addresses.balancerGaugeBpt30Fei70Weth, 0);
  expect(
    (
      await contracts.balancerGaugeController.vote_user_slopes(
        addresses.veBalDelegatorPCVDeposit,
        addresses.balancerGaugeBpt30Fei70Weth
      )
    )[1]
  ).to.be.equal('0');
  // set 100% votes for bb-a-usd
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).voteForGaugeWeight(
    '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2', // bb-a-usd token
    '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb', // bb-a-usd gauge
    10000
  );
  expect(
    (
      await contracts.balancerGaugeController.vote_user_slopes(
        addresses.veBalDelegatorPCVDeposit,
        '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb'
      )
    )[1]
  ).to.be.equal('10000');

  // Can exitLock() to exit veBAL lock at the end of period
  await time.increase(3600 * 24 * 365);
  await contracts.vebalOtcHelper.connect(otcBuyerSigner).exitLock();

  // Can withdrawERC20() to receive B-80BAL-20WETH at end of lock
  const bpt80Bal20WethAmount = await contracts.bpt80Bal20Weth.balanceOf(addresses.veBalDelegatorPCVDeposit);
  await contracts.vebalOtcHelper
    .connect(otcBuyerSigner)
    .withdrawERC20(addresses.bpt80Bal20Weth, vebalOtcBuyer, bpt80Bal20WethAmount);
  expect(await contracts.bpt80Bal20Weth.balanceOf(vebalOtcBuyer)).to.be.equal(bpt80Bal20WethAmount);
  expect(bpt80Bal20WethAmount).to.be.at.least(e18(112_041));

  console.log('all good on veBAL OTC side, no expect failed :)');
};

export { deploy, setup, teardown, validate };
