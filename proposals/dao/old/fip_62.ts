import hre, { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';

chai.use(CBN(ethers.BigNumber));

const eth = ethers.constants.WeiPerEther;
const toBN = ethers.BigNumber.from;

/*
FIP-62
DEPLOY ACTIONS:

1. Deploy EthPSM
  -- target of WETH PSM will be compoundEthPCVDeposit
  -- reserve threshold will be 250 eth
  -- mint fee 50 basis points
  -- redeem fee 20 basis points
2. Deploy PSM Router

DAO ACTIONS:
1. Grant the EthPSM the minter role
2. Hit the secondary pause switch so redemptions are paused
3. Pause the WETH compound PCV Drip controller
4. Point the aave eth PCV Drip controller to the ethPSM
5. Pause eth redeemer
6. Pause eth reserve stabilizer
*/

const decimalsNormalizer = 0;
const doInvert = false;

const mintFeeBasisPoints = 75;
const redeemFeeBasisPoints = 75;
const reservesThreshold = toBN(250).mul(eth);
const feiMintLimitPerSecond = ethers.utils.parseEther('10000');
const ethPSMBufferCap = ethers.utils.parseEther('10000000');

const incentiveAmount = 0;

const ethDripAmount = ethers.utils.parseEther('5000');
const dripDuration = 7200;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { aaveEthPCVDeposit, core, chainlinkEthUsdOracleWrapper, weth, fei } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy eth PSM
  const ethPSM = await (
    await ethers.getContractFactory('MintRedeemPausePSM')
  ).deploy(
    {
      coreAddress: core,
      oracleAddress: chainlinkEthUsdOracleWrapper,
      backupOracle: chainlinkEthUsdOracleWrapper,
      decimalsNormalizer,
      doInvert
    },
    mintFeeBasisPoints,
    redeemFeeBasisPoints,
    reservesThreshold,
    feiMintLimitPerSecond,
    ethPSMBufferCap,
    weth,
    aaveEthPCVDeposit
  );

  // 2. deploy psm router
  const ethPSMRouter = await (await ethers.getContractFactory('PSMRouter')).deploy(ethPSM.address, fei);

  await ethPSM.deployTransaction.wait();
  logging && console.log('ethPegStabilityModule: ', ethPSM.address);

  await ethPSMRouter.deployTransaction.wait();
  logging && console.log('ethPSMRouter: ', ethPSMRouter.address);

  return {
    ethPSM,
    ethPSMRouter
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { bondingCurve } = contracts;

  /// give the bonding curve a balance so that the ratioPCVControllerV2 doesn't revert in the dao script
  await hre.network.provider.send('hardhat_setBalance', [bondingCurve.address, '0x21E19E0C9BAB2400000']);
  logging && console.log('Sent eth to bonding curve so ratioPCVController withdraw');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    aaveEthPCVDripController,
    ethPSM,
    ethPSMRouter,
    aaveEthPCVDeposit,
    wethERC20,
    pcvGuardian,
    ethReserveStabilizer,
    bondingCurve
  } = contracts;

  expect(await aaveEthPCVDripController.source()).to.be.equal(aaveEthPCVDeposit.address);
  expect(await aaveEthPCVDripController.target()).to.be.equal(ethPSM.address);
  expect(await aaveEthPCVDripController.dripAmount()).to.be.equal(ethDripAmount);
  expect(await aaveEthPCVDripController.incentiveAmount()).to.be.equal(incentiveAmount);
  expect(await aaveEthPCVDripController.duration()).to.be.equal(dripDuration);

  expect(await ethPSM.surplusTarget()).to.be.equal(aaveEthPCVDeposit.address);
  expect(await ethPSM.redeemFeeBasisPoints()).to.be.equal(redeemFeeBasisPoints);
  expect(await ethPSM.mintFeeBasisPoints()).to.be.equal(mintFeeBasisPoints);
  expect(await ethPSM.reservesThreshold()).to.be.equal(reservesThreshold);
  expect((await ethPSM.underlyingToken()).toLowerCase()).to.be.equal(wethERC20.address.toLowerCase());
  expect(await ethPSM.bufferCap()).to.be.equal(ethPSMBufferCap);
  expect(await ethPSM.redeemPaused()).to.be.true;

  expect(await ethPSMRouter.psm()).to.be.equal(ethPSM.address);

  expect(await ethReserveStabilizer.balance()).to.be.equal(0);

  expect(await wethERC20.balanceOf(ethPSM.address)).to.be.equal(0);

  expect(await pcvGuardian.isSafeAddress(ethPSM.address)).to.be.true;

  expect(await bondingCurve.balance()).to.be.equal(0);
};
