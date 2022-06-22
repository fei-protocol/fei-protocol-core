import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Peg Stability Module

Description: This module is used to manage the stability of the peg.

Deploy Steps:
  0 - Deploy New FixedPricePSM
*/

const fipNumber = '72';

// mint fee starts at 0
const daiPSMMintFeeBasisPoints = 0;
// redeem fee is 10 basis points
const daiPSMRedeemFeeBasisPoints = 10;

// hold a maximum of 20m DAI in this contract
const daiReservesThreshold = ethers.utils.parseEther('20000000');

const daiFeiMintLimitPerSecond = ethers.utils.parseEther('10000');

const daiPSMBufferCap = ethers.utils.parseEther('20000000');

const daiDecimalsNormalizer = 0;

const daiFloorPrice = 9_750;
const daiCeilingPrice = 10_250;

// PCVDrip Controller Params
const dripFrequency = 1_800;

const daiDripAmount = ethers.utils.parseEther('5000000');

const toBN = ethers.BigNumber.from;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const { core, dai, chainlinkDaiUsdOracleWrapper, compoundDaiPCVDeposit } = addresses;

  if (!core) {
    throw new Error('Core address not set.');
  }

  const daiPSMFactory = await ethers.getContractFactory('FixedPricePSM');

  // Deploy DAI Peg Stability Module
  // PSM will trade while DAI is between 97.5 cents and 102.5 cents.
  // If price is outside of this band, the PSM will not allow trades
  const daiFixedPricePSM = await daiPSMFactory.deploy(
    daiFloorPrice,
    daiCeilingPrice,
    {
      coreAddress: core,
      oracleAddress: chainlinkDaiUsdOracleWrapper,
      backupOracle: chainlinkDaiUsdOracleWrapper,
      decimalsNormalizer: daiDecimalsNormalizer,
      doInvert: false
    },
    daiPSMMintFeeBasisPoints,
    daiPSMRedeemFeeBasisPoints,
    daiReservesThreshold,
    daiFeiMintLimitPerSecond,
    daiPSMBufferCap,
    dai,
    compoundDaiPCVDeposit
  );

  logging && console.log('daiPSM: ', daiFixedPricePSM.address);

  // Wait for daiFixedPricePSM to deploy
  await daiFixedPricePSM.deployTransaction.wait();

  return {
    daiFixedPricePSM
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  /// no setup needed for this proposal
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // no teardown needed for this proposal
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { oneConstantOracle, daiPCVDripController, daiFixedPricePSM, daiPSM, fei, dai, compoundDaiPCVDeposit } =
    contracts;

  expect(await daiFixedPricePSM.backupOracle()).to.be.equal(oneConstantOracle.address);
  expect(await daiFixedPricePSM.underlyingToken()).to.be.equal(dai.address);
  expect(await daiFixedPricePSM.redeemFeeBasisPoints()).to.be.equal(daiPSMRedeemFeeBasisPoints);
  expect(await daiFixedPricePSM.mintFeeBasisPoints()).to.be.equal(daiPSMMintFeeBasisPoints);
  expect(await daiFixedPricePSM.reservesThreshold()).to.be.equal(daiReservesThreshold);
  expect(await daiFixedPricePSM.surplusTarget()).to.be.equal(compoundDaiPCVDeposit.address);
  expect(await daiFixedPricePSM.rateLimitPerSecond()).to.be.equal(toBN(10_000).mul(ethers.constants.WeiPerEther));
  expect(await daiFixedPricePSM.buffer()).to.be.equal(daiPSMBufferCap);
  expect(await daiFixedPricePSM.bufferCap()).to.be.equal(daiPSMBufferCap);

  expect(await daiPCVDripController.target()).to.be.equal(daiFixedPricePSM.address);
  expect(await daiPCVDripController.dripAmount()).to.be.equal(daiDripAmount);
  expect(await daiPCVDripController.duration()).to.be.equal(dripFrequency);

  expect(await daiPSM.paused()).to.be.true;
  expect(await daiPSM.balance()).to.be.equal(0);
  expect(await fei.balanceOf(daiPSM.address)).to.be.equal(0);
};

export { deploy, setup, teardown, validate };
