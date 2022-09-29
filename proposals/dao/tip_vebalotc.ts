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
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { BigNumber } from 'ethers';

const PROXY_ADMIN_STORAGE_SLOT = '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103';
const PROXY_ADMIN_IMPLEMENTATION_SLOT = '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc';

const fipNumber = 'vebalotc';

let vebalOtcBuyer: string;
let aaveEscrowDaiBefore: BigNumber;
let psmDaiBalanceBefore: BigNumber;
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
    addresses.balancerGaugeStakerProxy // _balancerGaugeStaker
  );
  await vebalOtcHelper.deployTransaction.wait();
  logging && console.log(`vebalOtcHelper: ${vebalOtcHelper.address}`);

  // Deploy BalancerGaugeStakerV2 implementation
  const BalancerGaugeStakerV2Factory = await ethers.getContractFactory('BalancerGaugeStakerV2');
  const balancerGaugeStakerV2Impl = await BalancerGaugeStakerV2Factory.deploy(
    addresses.core,
    addresses.balancerGaugeController,
    addresses.balancerMinter
  );
  await balancerGaugeStakerV2Impl.deployTransaction.wait();
  logging && console.log(`balancerGaugeStakerV2Impl: ${balancerGaugeStakerV2Impl.address}`);

  return {
    balancerGaugeStakerV2Impl,
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

  // Check the proxy implementation is balancerGaugeStakerImpl
  expect(
    '0x' +
      (await ethers.provider.getStorageAt(addresses.balancerGaugeStakerProxy, PROXY_ADMIN_IMPLEMENTATION_SLOT)).slice(
        26
      )
  ).to.be.equal(addresses.balancerGaugeStakerImpl.toLowerCase());

  aaveEscrowDaiBefore = await contracts.dai.balanceOf(addresses.aaveCompaniesDaiEscrowMultisig);
  psmDaiBalanceBefore = await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM);
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

  // 1. Check the proxy's state variables
  expect(await contracts.balancerGaugeStaker.owner()).to.be.equal(addresses.vebalOtcHelper);
  expect(await contracts.balancerGaugeStaker.votingEscrowDelegation()).to.be.equal(
    addresses.balancerVotingEscrowDelegation
  );
  expect(await contracts.balancerGaugeStaker.balancerMinter()).to.be.equal(addresses.balancerMinter);
  expect(await contracts.balancerGaugeStaker.gaugeController()).to.be.equal(addresses.balancerGaugeController);
  expect(await contracts.balancerGaugeStaker.core()).to.be.equal(addresses.core);

  // 2. Check veBAL OTC helper owner and proxy owner
  expect(await contracts.vebalOtcHelper.owner()).to.be.equal(vebalOtcBuyer);
  expect(await contracts.balancerGaugeStaker.owner()).to.be.equal(contracts.vebalOtcHelper.address);
  expect(
    '0x' + (await ethers.provider.getStorageAt(addresses.balancerGaugeStakerProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(vebalOtcBuyer.toLowerCase());

  // 3. Check that OTC Buyer can transfer proxy ownership
  await contracts.balancerGaugeStakerProxy.connect(otcBuyerSigner).changeAdmin(addresses.feiDAOTimelock);
  expect(
    '0x' + (await ethers.provider.getStorageAt(addresses.balancerGaugeStakerProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(addresses.feiDAOTimelock.toLowerCase());

  // 4. Check that the implementation was upgraded
  expect(
    '0x' +
      (await ethers.provider.getStorageAt(addresses.balancerGaugeStakerProxy, PROXY_ADMIN_IMPLEMENTATION_SLOT)).slice(
        26
      )
  ).to.be.equal(addresses.balancerGaugeStakerV2Impl.toLowerCase());

  // 5. Check Aave Escrow multisig received DAI
  const aaveEscrowDaiMultisigGain = (await contracts.dai.balanceOf(addresses.aaveCompaniesDaiEscrowMultisig)).sub(
    aaveEscrowDaiBefore
  );
  expect(aaveEscrowDaiMultisigGain).to.equal(ethers.constants.WeiPerEther.mul(1_000_000));

  // Verify DAI PSM DAI balance decreased by expected 1M DAI
  const psmDaiBalanceDecrease = psmDaiBalanceBefore.sub(await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM));
  expect(psmDaiBalanceDecrease).to.equal(ethers.constants.WeiPerEther.mul(1_000_000));
};

export { deploy, setup, teardown, validate };
