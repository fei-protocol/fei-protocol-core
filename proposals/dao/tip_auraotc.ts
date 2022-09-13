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

const fipNumber = 'auraotc';

let auraOtcBuyer: string;
let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  auraOtcBuyer = addresses.fishy;

  // Deploy veBAL Helper contract
  const ProxyOTCEscrowFactory = await ethers.getContractFactory('ProxyOTCEscrow');
  const vlauraOtcHelper = await ProxyOTCEscrowFactory.deploy(
    addresses.feiDAOTimelock, // _owner
    addresses.dai, // _otcToken
    ethers.constants.WeiPerEther.mul(94_000), // _otcAmount
    auraOtcBuyer, // _otcPurchaser
    addresses.daiHoldingPCVDeposit, // _otcDestination
    addresses.vlAuraDelegatorPCVDepositProxy // _proxy
  );

  await vlauraOtcHelper.deployTransaction.wait();
  logging && console.log(`vlauraOtcHelper: ${vlauraOtcHelper.address}`);

  return {
    vlauraOtcHelper
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  auraOtcBuyer = addresses.fishy;

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

  // Check vlAURA OTC helper owner and proxy owner
  expect(await contracts.vlauraOtcHelper.owner()).to.be.equal(addresses.feiDAOTimelock);
  expect(
    '0x' +
      (await ethers.provider.getStorageAt(addresses.vlAuraDelegatorPCVDepositProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(contracts.vlauraOtcHelper.address.toLowerCase());

  // OTC buyer performs the OTC
  const otcBuyerSigner = await getImpersonatedSigner(auraOtcBuyer);
  await forceEth(otcBuyerSigner.address);
  // seed with DAI
  const otcAmount = await contracts.vlauraOtcHelper.otcAmount();
  expect(otcAmount).to.be.equal(ethers.constants.WeiPerEther.mul(94_000));
  const daiWhaleSigner = await getImpersonatedSigner('0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168');
  await forceEth(daiWhaleSigner.address);
  await contracts.dai.connect(daiWhaleSigner).transfer(otcBuyerSigner.address, otcAmount);
  // approve DAI
  await contracts.dai.connect(otcBuyerSigner).approve(contracts.vlauraOtcHelper.address, otcAmount);
  // otc buy
  const daiBalanceBefore = await contracts.daiHoldingPCVDeposit.balance();
  await contracts.vlauraOtcHelper.connect(otcBuyerSigner).otcBuy(otcBuyerSigner.address);
  const daiBalanceAfter = await contracts.daiHoldingPCVDeposit.balance();
  // check received funds
  expect(daiBalanceAfter.sub(daiBalanceBefore)).to.be.equal(otcAmount);

  // Check vlAURA OTC helper owner and proxy owner
  expect(await contracts.vlauraOtcHelper.owner()).to.be.equal(ethers.constants.AddressZero);
  expect(
    '0x' +
      (await ethers.provider.getStorageAt(addresses.vlAuraDelegatorPCVDepositProxy, PROXY_ADMIN_STORAGE_SLOT)).slice(26)
  ).to.be.equal(auraOtcBuyer.toLowerCase());

  // auraOtcBuyer is the proxy admin (addresses.fishy)
  // a 2nd EOA is needed to interact with the proxy, for instance here we use addresses.eswak
  const fishy2Signer = await getImpersonatedSigner(addresses.eswak);
  // fishy deloys a new proxy implementation
  const VlAuraFishyImplementationFactory = await ethers.getContractFactory('VlAuraFishyImplementation');
  const vlAuraFishyImplementation = await VlAuraFishyImplementationFactory.deploy();
  await vlAuraFishyImplementation.deployTransaction.wait();
  // fishy upgrades the implementation
  await contracts.vlAuraDelegatorPCVDepositProxy.connect(otcBuyerSigner).upgradeTo(vlAuraFishyImplementation.address);
  const proxyTypedAsImplementation = new ethers.Contract(
    addresses.vlAuraDelegatorPCVDepositProxy,
    vlAuraFishyImplementation.interface
  );
  // delegate voting power to an address
  await proxyTypedAsImplementation.connect(fishy2Signer).delegate(auraOtcBuyer);
  // forward bribes earned by the proxy
  await proxyTypedAsImplementation
    .connect(fishy2Signer)
    .setRewardForwarding('0x642c59937A62cf7dc92F70Fd78A13cEe0aa2Bd9c', fishy2Signer.address);
  // fast forward 3 months and unlock vlAURA
  await time.increase(3600 * 24 * 90);
  await proxyTypedAsImplementation.connect(fishy2Signer).unlock();
  // send unlocked AURA to fishy
  const auraBalance = await contracts.aura.balanceOf(proxyTypedAsImplementation.address);
  await proxyTypedAsImplementation.connect(fishy2Signer).sweep(addresses.aura, fishy2Signer.address, auraBalance);
  expect((await contracts.aura.balanceOf(fishy2Signer.address)) / 1e18).to.be.at.least(34038);
};

export { deploy, setup, teardown, validate };
