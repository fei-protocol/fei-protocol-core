import {
  Fei,
  MerkleRedeemerDripper,
  MerkleRedeemerDripper__factory,
  RariMerkleRedeemer,
  MerkleTest
} from '@custom-types/contracts';
import { RariMerkleRedeemer__factory } from '@custom-types/contracts/factories/RariMerkleRedeemer__factory';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Contract } from '@ethersproject/contracts';
import { cTokens } from '@proposals/data/merkle_redemption/cTokens';
import rates from '@proposals/data/merkle_redemption/prod/rates.json';
import roots from '@proposals/data/merkle_redemption/prod/roots.json';
import { MainnetContractsConfig } from '@protocol/mainnetAddresses';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import balances from '../../data/merkle_redemption/prod/mergedBalances.json';
import proofs from '../../data/merkle_redemption/prod/proofs.json';

/*

DAO Proposal Part 2

Description: Enable and mint FEI into the MerkleRedeeemrDripper contract, allowing those that are specified 
in the snapshot [insert link] and previous announcement to redeem an amount of cTokens for FEI.

Steps:
  1 - Mint FEI to the RariMerkleRedeemer contract
*/

const fipNumber = 'tip_121b';

const dripPeriod = 3600; // 1 hour
const dripAmount = ethers.utils.parseEther('1000000'); // 1m Fei

const total = parseEther('12680884'); // 12.68M Fei total
const merkleRedeemerDripperInitialBalance = parseEther('9000000'); // 9m Fei initially in dripper
const rariMerkleRedeemerInitialBalance = total.sub(merkleRedeemerDripperInitialBalance); // Remaining Fei for merkle redeemer (3.68m Fei)

let pcvStatsBefore: PcvStats;

const ratesArray: string[] = [];
const rootsArray: string[] = [];

// Construct rates and roots arrays
for (const token of cTokens) {
  ratesArray.push(rates[token.toLowerCase() as keyof typeof rates]);
  rootsArray.push(roots[token.toLowerCase() as keyof typeof roots]);
}

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Quick check: ensure that the rates, roots, and ctokens are all in the same order
  for (let i = 0; i < cTokens.length; i++) {
    const token = cTokens[i];
    expect(rates[token as keyof typeof rates]).to.equal(ratesArray[i]);
    expect(roots[token as keyof typeof roots]).to.equal(rootsArray[i]);
  }

  // Log our output for visual inspection
  console.log('Rates:', JSON.stringify(ratesArray, null, 2));
  console.log('Roots:', JSON.stringify(rootsArray, null, 2));
  console.log('cTokens:', JSON.stringify(cTokens, null, 2));

  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory((await ethers.getSigners())[0]);
  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address, // token: fei
    cTokens, // ctokens (address[])
    ratesArray, // rates (uint256[])
    rootsArray // roots (bytes32[])
  );
  await rariMerkleRedeemer.deployTransaction.wait();

  const merkleRedeeemrDripperFactory = new MerkleRedeemerDripper__factory((await ethers.getSigners())[0]);
  const merkleRedeemerDripper = await merkleRedeeemrDripperFactory.deploy(
    addresses.core,
    rariMerkleRedeemer.address,
    dripPeriod,
    dripAmount,
    addresses.fei
  );
  await merkleRedeemerDripper.deployTransaction.wait();

  return {
    rariMerkleRedeemer,
    merkleRedeemerDripper
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup actions for fip${fipNumber}`);
  await logDaiBalances(contracts.dai);

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
  const claimChecker = (await ethers.getContractAt(
    'MerkleTest',
    '0x4f3348dd19ec65bdcC3cDD7d8e8A078a0B2C46fD'
  )) as MerkleTest;

  // for every ctoken/root
  for (let i = 0; i < cTokens.length; i++) {
    const ctoken = cTokens[i];
    const root = rootsArray[i];

    // for every user in that ctoken's data
    const cTokenBalances = balances[ctoken.toLowerCase() as keyof typeof balances];
    const cTokenProofs = proofs[ctoken.toLowerCase() as keyof typeof proofs];

    for (const userBalanceData of Object.entries(cTokenBalances)) {
      const userAddress = userBalanceData[0];
      const userBalance = userBalanceData[1];
      const proof = cTokenProofs[userAddress as keyof typeof cTokenProofs];

      // check that the user can claim the correct amount
      const claimable = await claimChecker.checkClaim(root, userAddress, userBalance, proof);
      expect(claimable).to.be.true;
    }
  }

  const rariMerkleRedeemer = contracts.rariMerkleRedeemer as RariMerkleRedeemer;
  const merkleRedeemerDripper = contracts.merkleRedeemerDripper as MerkleRedeemerDripper;

  //await validatePCV(contracts);

  console.log(rootsArray);
  console.log(ratesArray);

  // validate that all 20 ctokens exist & are set
  for (let i = 0; i < cTokens.length; i++) {
    expect(await rariMerkleRedeemer.merkleRoots(cTokens[i].toLowerCase())).to.be.equal(rootsArray[i].toLowerCase());
    expect(await rariMerkleRedeemer.cTokenExchangeRates(cTokens[i].toLowerCase())).to.be.equal(
      ratesArray[i].toLowerCase()
    );
  }

  //console.log(`Sending ETH to both contracts...`);

  // send eth to both contracts so that we can impersonate them later
  await forceEth(rariMerkleRedeemer.address, parseEther('1').toString());
  await forceEth(merkleRedeemerDripper.address, parseEther('1').toString());

  // check initial balances of dripper & redeemer
  // ensure that initial balance of the dripper is a multiple of drip amount
  const fei = contracts.fei as Fei;
  expect(await fei.balanceOf(rariMerkleRedeemer.address)).to.be.gte(rariMerkleRedeemerInitialBalance);
  expect(await fei.balanceOf(merkleRedeemerDripper.address)).to.be.equal(merkleRedeemerDripperInitialBalance);
  expect((await fei.balanceOf(merkleRedeemerDripper.address)).mod(dripAmount)).to.be.equal(0);

  //console.log('Advancing time 1 hour...');

  // advance time > 1 hour to drip again
  await ethers.provider.send('evm_increaseTime', [dripPeriod + 1]);

  // expect a drip to fail because the redeemer has enough tokens already
  await expect(merkleRedeemerDripper.drip()).to.be.revertedWith(
    'MerkleRedeemerDripper: dripper target already has enough tokens.'
  );

  // impersonate the redeemer and send away its tokens so that we can drip again
  const redeemerSigner = await getImpersonatedSigner(rariMerkleRedeemer.address);
  const redeemerFeiBalance = await (contracts.fei as Fei).balanceOf(rariMerkleRedeemer.address);
  await (contracts.fei as Fei).connect(redeemerSigner).transfer(addresses.timelock, redeemerFeiBalance);
  expect(await (contracts.fei as Fei).balanceOf(rariMerkleRedeemer.address)).to.be.equal(0);

  //console.log('Doing final drip test...');

  // finally, call drip again to make sure it works
  const redeemerBalBeforeDrip = await fei.balanceOf(rariMerkleRedeemer.address);
  await merkleRedeemerDripper.drip();
  const redeemerBalAfterDrip = await fei.balanceOf(rariMerkleRedeemer.address);
  expect(redeemerBalAfterDrip.sub(redeemerBalBeforeDrip)).to.be.equal(dripAmount);

  await logDaiBalances(contracts.dai);

  // Execute fuseWithdrawalGuard actions
  let i = 0;
  while (await contracts.fuseWithdrawalGuard.check()) {
    const protecActions = await contracts.fuseWithdrawalGuard.getProtecActions();
    const depositAddress = '0x' + protecActions.datas[0].slice(34, 74);
    const depositLabel = getAddressLabel(addresses, depositAddress);
    const withdrawAmountHex = '0x' + protecActions.datas[0].slice(138, 202);
    const withdrawAmountNum = Number(withdrawAmountHex) / 1e18;
    console.log('fuseWithdrawalGuard   protec action #', ++i, depositLabel, 'withdraw', withdrawAmountNum);
    await contracts.pcvSentinel.protec(contracts.fuseWithdrawalGuard.address);
  }
};

const BABYLON_ADDRESS = '0x97FcC2Ae862D03143b393e9fA73A32b563d57A6e';
const FRAX_ADDRESS = '0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27';
const OLYMPUS_ADDRESS = '0x245cc372C84B3645Bf0Ffe6538620B04a217988B';
const VESPER_ADDRESS = '0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A';
const RARI_DAI_AGGREGATOR_ADDRESS = '0xafd2aade64e6ea690173f6de59fc09f5c9190d74';
const GNOSIS_SAFE_ADDRESS = '0x7189b2ea41d406c5044865685fedb615626f9afd';
const FUJI_CONTRACT_ADDRESS = '0x1868cBADc11D3f4A12eAaf4Ab668e8aA9a76d790';
const CONTRACT_1_ADDRESS = '0x07197a25bf7297c2c41dd09a79160d05b6232bcf';
const ALOE_ADDRESS_1 = '0x0b76abb170519c292da41404fdc30bb5bef308fc';
const ALOE_ADDRESS_2 = '0x8bc7c34009965ccb8c0c2eb3d4db5a231ecc856c';
const CONTRACT_2_ADDRESS = '0x5495f41144ecef9233f15ac3e4283f5f653fc96c';
const BALANCER_ADDRESS = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
const CONTRACT_3_ADDRESS = '0xeef86c2e49e11345f1a693675df9a38f7d880c8f';
const CONTRACT_4_ADDRESS = '0xa10fca31a2cb432c9ac976779dc947cfdb003ef0';
const RARI_FOR_ARBITRUM_ADDRESS = '0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85';

async function logDaiBalances(dai: Contract) {
  console.log('Babylon DAI balance: ', Number(await dai.balanceOf(BABYLON_ADDRESS)) / 1e18);
  console.log('Frax DAI balance: ', Number(await dai.balanceOf(FRAX_ADDRESS)) / 1e18);
  console.log('Olympus DAI balance: ', Number(await dai.balanceOf(OLYMPUS_ADDRESS)) / 1e18);
  console.log('Vesper DAI balance: ', Number(await dai.balanceOf(VESPER_ADDRESS)) / 1e18);
  console.log('Rari DAI balance: ', Number(await dai.balanceOf(RARI_DAI_AGGREGATOR_ADDRESS)) / 1e18);
  console.log('Gnosis DAI balance: ', Number(await dai.balanceOf(GNOSIS_SAFE_ADDRESS)) / 1e18);
  console.log('Fuji DAI balance: ', Number(await dai.balanceOf(FUJI_CONTRACT_ADDRESS)) / 1e18);
  console.log('Contract 1 DAI balance: ', Number(await dai.balanceOf(CONTRACT_1_ADDRESS)) / 1e18);
  console.log('Contract 2 DAI balance: ', Number(await dai.balanceOf(CONTRACT_2_ADDRESS)) / 1e18);
  console.log('Contract 3 DAI balance: ', Number(await dai.balanceOf(CONTRACT_3_ADDRESS)) / 1e18);
  console.log('Contract 4 DAI balance: ', Number(await dai.balanceOf(CONTRACT_4_ADDRESS)) / 1e18);
  console.log('Aloe 1 DAI balance: ', Number(await dai.balanceOf(ALOE_ADDRESS_1)) / 1e18);
  console.log('Aloe 2 DAI balance: ', Number(await dai.balanceOf(ALOE_ADDRESS_2)) / 1e18);
  console.log('Balancer DAI balance: ', Number(await dai.balanceOf(BALANCER_ADDRESS)) / 1e18);
  console.log('Rari for Arbitrum DAI balance: ', Number(await dai.balanceOf(RARI_FOR_ARBITRUM_ADDRESS)) / 1e18);
}

function getAddressLabel(addresses: NamedAddresses, address: string) {
  for (const key in addresses) {
    if (address.toLowerCase() == addresses[key].toLowerCase()) return key;
  }
  return '???';
}

const PCV_DIFF_LOWER = ethers.constants.WeiPerEther.mul(-42_000_000); // -42M
const PCV_DIFF_UPPER = ethers.constants.WeiPerEther.mul(-30_000_000); // -30M

async function validatePCV(contracts: NamedContracts) {
  // 0. Verify PCV has minimal change
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

  expect(eqDiff).to.be.bignumber.greaterThan(PCV_DIFF_LOWER);
  expect(eqDiff).to.be.bignumber.lessThan(PCV_DIFF_UPPER);
}
export { deploy, setup, teardown, validate };
