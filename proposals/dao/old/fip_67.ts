import hre, { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';

chai.use(CBN(ethers.BigNumber));

const eth = ethers.constants.WeiPerEther;
const toBN = ethers.BigNumber.from;
const ZERO_ADDRESS = ethers.constants.AddressZero;

/*
FIP-63
DEPLOY ACTIONS:

1. Deploy lusdPSM
  -- target of LUSD PSM will be bammDeposit
  -- reserve threshold will be 10m lusd
  -- mint fee 50 basis points
  -- redeem fee 50 basis points

*/

const decimalsNormalizer = 0;
const doInvert = false;

const mintFeeBasisPoints = 50;
const redeemFeeBasisPoints = 50;
const reservesThreshold = toBN(10_000_000).mul(eth);
const feiMintLimitPerSecond = ethers.utils.parseEther('10000');
const lusdPSMBufferCap = ethers.utils.parseEther('10000000');

const incentiveAmount = 0;

const lusdDripAmount = ethers.utils.parseEther('5000000');
const dripDuration = 1800;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { bammDeposit, core, chainlinkLUSDOracleWrapper, lusd } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy lusd PSM
  const lusdPSM = await (
    await ethers.getContractFactory('MintRedeemPausePSM')
  ).deploy(
    {
      coreAddress: core,
      oracleAddress: chainlinkLUSDOracleWrapper,
      backupOracle: ZERO_ADDRESS,
      decimalsNormalizer,
      doInvert
    },
    mintFeeBasisPoints,
    redeemFeeBasisPoints,
    reservesThreshold,
    feiMintLimitPerSecond,
    lusdPSMBufferCap,
    lusd,
    bammDeposit
  );

  logging && console.log('lusdPSM: ', lusdPSM.address);

  // 2. deploy lusd PCV DripController
  const lusdPCVDripController = await (
    await ethers.getContractFactory('PCVDripController')
  ).deploy(core, bammDeposit, lusdPSM.address, dripDuration, lusdDripAmount, incentiveAmount);

  logging && console.log('lusdPCVDripController: ', lusdPCVDripController.address);

  // 3. deploy lusd PSM Fei Skimmer
  const lusdPSMFeiSkimmer = await (
    await ethers.getContractFactory('FeiSkimmer')
  ).deploy(core, lusdPSM.address, lusdPSMBufferCap);

  logging && console.log('lusdPSMFeiSkimmer: ', lusdPSMFeiSkimmer.address);

  await lusdPSM.deployTransaction.wait();
  await lusdPCVDripController.deployTransaction.wait();
  await lusdPSMFeiSkimmer.deployTransaction.wait();

  return {
    lusdPSM,
    lusdPCVDripController,
    lusdPSMFeiSkimmer
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    lusdPCVDripController,
    lusdPSMFeiSkimmer,
    lusdPSM,
    pcvGuardian,
    bammDeposit,
    lusd,
    rariPool146EthPCVDeposit
  } = contracts;

  expect(await lusdPCVDripController.source()).to.be.equal(bammDeposit.address);
  expect(await lusdPCVDripController.target()).to.be.equal(lusdPSM.address);
  expect(await lusdPCVDripController.dripAmount()).to.be.equal(lusdDripAmount);
  expect(await lusdPCVDripController.incentiveAmount()).to.be.equal(incentiveAmount);
  expect(await lusdPCVDripController.duration()).to.be.equal(dripDuration);
  expect(await lusdPCVDripController.paused()).to.be.true;

  expect(await lusdPSM.surplusTarget()).to.be.equal(bammDeposit.address);
  expect(await lusdPSM.redeemFeeBasisPoints()).to.be.equal(redeemFeeBasisPoints);
  expect(await lusdPSM.mintFeeBasisPoints()).to.be.equal(mintFeeBasisPoints);
  expect(await lusdPSM.reservesThreshold()).to.be.equal(reservesThreshold);
  expect((await lusdPSM.underlyingToken()).toLowerCase()).to.be.equal(lusd.address.toLowerCase());
  expect(await lusdPSM.bufferCap()).to.be.equal(lusdPSMBufferCap);
  expect(await lusdPSM.redeemPaused()).to.be.true;
  expect(await lusdPSM.paused()).to.be.true;
  expect(await lusdPSM.balance()).to.be.equal(0);

  expect(await lusdPSMFeiSkimmer.source()).to.be.equal(lusdPSM.address);
  expect(await lusdPSMFeiSkimmer.paused()).to.be.true;

  expect(await lusd.balanceOf(lusdPSM.address)).to.be.equal(0);

  expect(await pcvGuardian.isSafeAddress(lusdPSM.address)).to.be.true;

  expect(await rariPool146EthPCVDeposit.balance()).to.be.equal(ethers.constants.WeiPerEther.mul(2500));
};
