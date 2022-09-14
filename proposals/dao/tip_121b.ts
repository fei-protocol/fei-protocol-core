import {
  Fei,
  MerkleRedeemerDripper,
  MerkleRedeemerDripper__factory,
  RariMerkleRedeemer
} from '@custom-types/contracts';
import { RariMerkleRedeemer__factory } from '@custom-types/contracts/factories/RariMerkleRedeemer__factory';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { cTokens } from '@proposals/data/merkle_redeemer/cTokens';
import { rates } from '@proposals/data/merkle_redeemer/rates';
import { roots } from '@proposals/data/merkle_redeemer/roots';
import { MainnetContractsConfig } from '@protocol/mainnetAddresses';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { expect } from 'chai';
import { parseEther } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import * as snapshot from 'scripts/shutdown/data/prod/snapshot.json';

/*

DAO Proposal Part 2

Description: Enable and mint FEI into the MerkleRedeeemrDripper contract, allowing those that are specified 
in the snapshot [insert link] and previous announcement to redeem an amount of cTokens for FEI.

Steps:
  1 - Mint FEI to the RariMerkleRedeemer contract
*/

const fipNumber = 'tip_121b';

const dripPeriod = 3600; // 1 hour
const dripAmount = ethers.utils.parseEther('2500000'); // 2.5m Fei

const rariMerkleRedeemerInitialBalance = ethers.utils.parseEther('5000000'); // 5m Fei
const merkleRedeemerDripperInitialBalance = ethers.utils.parseEther('45000000'); // 45m Fei

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory((await ethers.getSigners())[0]);
  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address, // token: fei
    cTokens, // ctokens (address[])
    rates, // rates (uint256[])
    roots // roots (bytes32[])
  );

  const merkleRedeeemrDripperFactory = new MerkleRedeemerDripper__factory((await ethers.getSigners())[0]);
  const merkleRedeemerDripper = await merkleRedeeemrDripperFactory.deploy(
    addresses.core,
    rariMerkleRedeemer.address,
    dripPeriod,
    dripAmount,
    addresses.fei
  );

  return {
    rariMerkleRedeemer,
    merkleRedeemerDripper
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const rariMerkleRedeemer = contracts.rariMerkleRedeemer as RariMerkleRedeemer;
  const merkleRedeemerDripper = contracts.merkleRedeemerDripper as MerkleRedeemerDripper;

  // validate that all 27 ctokens exist & are set
  for (let i = 0; i < cTokens.length; i++) {
    expect(await rariMerkleRedeemer.merkleRoots(cTokens[i])).to.be.equal(roots[i]);
    expect(await rariMerkleRedeemer.cTokenExchangeRates(cTokens[i])).to.be.equal(rates[i]);
  }

  //console.log(`Sending ETH to both contracts...`);

  // send eth to both contracts so that we can impersonate them later
  await forceEth(rariMerkleRedeemer.address, parseEther('1').toString());
  await forceEth(merkleRedeemerDripper.address, parseEther('1').toString());

  // check initial balances of dripper & redeemer
  // ensure that initial balance of the dripper is a multiple of drip amount
  const fei = contracts.fei as Fei;
  expect(await fei.balanceOf(rariMerkleRedeemer.address)).to.be.equal(rariMerkleRedeemerInitialBalance);
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

  // test every single user in every single token in the snapshot
  const snapshotKeys = Object.keys(snapshot);

  for (const cTokenAddress of snapshotKeys) {
    const cTokenData = snapshot[cTokenAddress as keyof typeof snapshot];
    const entries = Object.keys(cTokenData);

    for (const entry of entries) {
      const user = entry[0];
      const amount = entry[1];
    }
  }
};

export { deploy, setup, teardown, validate };
