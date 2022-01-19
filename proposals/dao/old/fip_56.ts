import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Core, Tribe, TribeMinter, TribeReserveStabilizer } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

const toBN = ethers.BigNumber.from;

const TRIBE_INFLATION_BPS = 10000;

const ONE_IN_BPS = 10000;

const OSM_DURATION = 60 * 60 * 24; // 24h

// Constants for deploy. Tweak as needed.
const daiPSMMintFeeBasisPoints = 50;
const daiPSMRedeemFeeBasisPoints = 50;

const daiReservesThreshold = ethers.utils.parseEther('20000000');

const daiFeiMintLimitPerSecond = ethers.utils.parseEther('10000');

const daiPSMBufferCap = ethers.utils.parseEther('20000000');

const daiDecimalsNormalizer = 0;

const daiFloorPrice = 9_500;
const daiCeilingPrice = 10_500;

// PCVDrip Controller Params

// drips can happen every 30 mins
const dripFrequency = 1_800;

// do not incentivize these calls
const incentiveAmount = 0;

const daiDripAmount = ethers.utils.parseEther('5000000');

/*
FIP-56 Fei v2 Deployment
DEPLOY ACTIONS:

1. Deploy TribeMinter
2. Deploy TribeReserveStabilizer
3. Deploy DAI PriceBoundPegStabilityModule
4. Deploy DAI PCV Dripper

DAO ACTIONS:
1. Create TRIBE_MINTER_ADMIN Role
2. Grant TribeReserveStabilizer Admin Role
3. Set TribeMinter Contract Admin Role
4. Grant TRIBE_MINTER the Tribe Minter role
5. Grant Minter Role to DAI PSM
6. Grant PCV Controller to DAI PCVDripController
7. Create PSM_ADMIN_ROLE
8. Withdraw 20m DAI to PSM from Compound
9. Revoke Minter from DPI bonding curve
10. Revoke Minter from RAI bonding curve
11. Remove RAI & DPI bonding curve from Collateralization Oracle
12. Add DAI PSM to Collateralization Oracle
13. Raise ETH BondingCurve buffer to 75bps
14. Set EthReserveStabilizer exchange rate to $0.9925
15. Add DAI PSM to PCV Guardian
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    feiDAOTimelock,
    erc20Dripper,
    tribeUsdCompositeOracle,
    collateralizationOracleWrapper,
    fei,
    dai,
    chainlinkDaiUsdOracleWrapper,
    compoundDaiPCVDeposit
  } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy Tribe Minter
  const tribeMinterFactory = await ethers.getContractFactory('TribeMinter');
  const tribeMinter = await tribeMinterFactory.deploy(core, TRIBE_INFLATION_BPS, feiDAOTimelock, core, erc20Dripper);

  await tribeMinter.deployTransaction.wait();

  logging && console.log('tribeMinter: ', tribeMinter.address);

  // 2. Deploy TribeReserveStabilizer
  const stabilizerFactory = await ethers.getContractFactory('TribeReserveStabilizer');
  const tribeReserveStabilizer = await stabilizerFactory.deploy(
    core,
    tribeUsdCompositeOracle,
    ethers.constants.AddressZero,
    ONE_IN_BPS, // $1 Exchange
    collateralizationOracleWrapper,
    ONE_IN_BPS, // 100% CR threshold
    tribeMinter.address,
    OSM_DURATION
  );

  await tribeReserveStabilizer.deployTransaction.wait();

  logging && console.log('tribeReserveStabilizer: ', tribeReserveStabilizer.address);

  const daiPSMFactory = await ethers.getContractFactory('PriceBoundPSM');

  const PCVDripControllerFactory = await ethers.getContractFactory('PCVDripController');

  // 3. Deploy DAI PriceBoundPegStabilityModule
  // PSM will trade DAI between 95 cents and 1.05 cents.
  // If price is outside of this band, the PSM will not allow trades
  const daiPSM = await daiPSMFactory.deploy(
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

  await daiPSM.deployTransaction.wait();

  logging && console.log('daiPSM: ', daiPSM.address);

  // 4. Deploy DAI PCV Dripper
  const daiPCVDripController = await PCVDripControllerFactory.deploy(
    core,
    compoundDaiPCVDeposit,
    daiPSM.address,
    dripFrequency,
    daiDripAmount,
    incentiveAmount
  );

  await daiPCVDripController.deployTransaction.wait();

  logging && console.log('daiPCVDripController: ', daiPCVDripController.address);

  return {
    tribeMinter,
    tribeReserveStabilizer,
    daiPSM,
    daiPCVDripController
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const role = ethers.utils.id('TRIBE_MINTER_ROLE');
  const core: Core = contracts.core as Core;
  const tribe: Tribe = contracts.tribe as Tribe;
  const tribeMinter: TribeMinter = contracts.tribeMinter as TribeMinter;
  const tribeReserveStabilizer: TribeReserveStabilizer = contracts.tribeReserveStabilizer as TribeReserveStabilizer;

  expect(await core.hasRole(role, tribeReserveStabilizer.address)).to.be.true;
  expect(await tribe.minter()).to.be.equal(tribeMinter.address);
  expect(await tribeMinter.isContractAdmin(tribeReserveStabilizer.address)).to.be.true;

  const { daiPCVDripController, daiPSM, dai, compoundDaiPCVDeposit } = contracts;

  expect(await daiPSM.underlyingToken()).to.be.equal(dai.address);

  expect(await daiPSM.redeemFeeBasisPoints()).to.be.equal(daiPSMRedeemFeeBasisPoints);

  expect(await daiPSM.mintFeeBasisPoints()).to.be.equal(daiPSMMintFeeBasisPoints);

  expect(await daiPSM.reservesThreshold()).to.be.equal(daiReservesThreshold);

  expect(await daiPSM.balance()).to.be.equal(daiReservesThreshold);

  expect(await daiPSM.surplusTarget()).to.be.equal(compoundDaiPCVDeposit.address);

  expect(await daiPSM.rateLimitPerSecond()).to.be.equal(toBN(10_000).mul(ethers.constants.WeiPerEther));

  expect(await daiPSM.buffer()).to.be.equal(toBN(20_000_000).mul(ethers.constants.WeiPerEther));

  expect(await daiPSM.bufferCap()).to.be.equal(daiPSMBufferCap);

  expect(await daiPCVDripController.target()).to.be.equal(daiPSM.address);

  const collateralizationOracle = contracts.collateralizationOracle;

  expect(await collateralizationOracle.getDepositsForToken(addresses.dpi)).to.not.include(
    addresses.dpiBondingCurveWrapper
  );
  expect(await collateralizationOracle.getDepositsForToken(addresses.rai)).to.not.include(
    addresses.raiBondingCurveWrapper
  );
  expect(await collateralizationOracle.getDepositsForToken(addresses.dai)).to.include(daiPSM.address);

  expect((await contracts.bondingCurve.buffer()).toString()).to.be.equal('75');
  expect((await contracts.ethReserveStabilizer.usdPerFeiBasisPoints()).toString()).to.be.equal('9925');

  expect(await contracts.pcvGuardian.getSafeAddresses()).to.include(daiPSM.address);
};
