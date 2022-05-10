import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { contract } from '@openzeppelin/test-environment';
import { Fei } from '@custom-types/contracts';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

DAO Proposal #99

Description: Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure

Steps:
  1 - Move 80% of PCV RAI to AAVE from Fuse Pool 9 via the ratioPCVControllerV2
  2 - Call depsoit() on the aave rai pcv deposit
  4 - Grant the PCV_CONTROLLER role to the rai pcv drip controller
  5 - Pause mint on the rai psm
  6 - Whitelist the fuse pool 9 rai pcv deposit on the pcv guardian
  7 - Whitelist the aave rai pcv deposit on the pcv guardian
  9 - Add the rai price-bound psm to the collateralization oracle
*/

const fipNumber = '99'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const raiUsdChainlinkOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    '0x483d36f6a1d063d580c7a24f9a42b346f3a69fbb'
  );
  await raiUsdChainlinkOracleWrapper.deployed();

  logging && console.log(`Chainlink oracle wrapper deployed`);

  const priceBoundPSMFactory = await ethers.getContractFactory('PriceBoundPSM');
  const raiPriceBoundPSM = await priceBoundPSMFactory.deploy(
    30_000,
    ethers.constants.WeiPerEther,
    {
      coreAddress: addresses.core,
      oracleAddress: addresses.chainlinkRaiUsdOracleWrapper,
      backupOracle: ethers.constants.AddressZero,
      decimalsNormalizer: 0,
      doInvert: false
    },
    0, // mint fee = 0 bp
    0, // redeem fee = 0 bp
    ethers.constants.WeiPerEther.mul(10_000_000), // reserves threshold = 10m
    50_000, // fei rate limit = 50k fei/sec
    0, // minting buffer cap = 0 = disables minting fei
    addresses.rai, // rai as the underlying token
    addresses.feiDAOTimelock // surplus target = timelock
  );
  await raiPriceBoundPSM.deployed();

  logging && console.log(`Rai price bound psm deployed`);

  const pcvDripControllerFactory = await ethers.getContractFactory('PCVDripController');
  const raiPCVDripController = await pcvDripControllerFactory.deploy(
    addresses.core,
    addresses.aaveRaiPCVDeposit, // drip source = aave rai pcv deposit
    raiPriceBoundPSM.address, // drip target = rai psm
    1800, // drip interval = 30 minutes
    ethers.constants.WeiPerEther.mul(2_500_000), // drip size = 2.5 million
    0 // incentive amount = 0
  );

  logging && console.log(`Rai pcv drip controller deployed`);

  logging && console.log('Chainlink oracle wrapper, Rai PCV drip controller and rai price-bound psm deployed');

  return {
    raiUsdChainlinkOracleWrapper,
    raiPriceBoundPSM,
    raiPCVDripController
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
  await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), addresses.raiPCVDripController);

  // Ensure that the rai aave pcv deposit has >= 10m RAI
  expect((await contracts.aaveRaiPCVDeposit.balance()).gte(ethers.constants.WeiPerEther.mul(10_000_000)));

  // Ensure that minting is paused on the rai psm
  expect(await contracts.raiPriceBoundPSM.mintPaused()).to.equal(true);

  // Ensure that redeem is not paused on the rai psm
  expect(await contracts.raiPriceBoundPSM.redeemPaused()).to.equal(false);

  // Ensure that the fuse pool 9 rai pcv deposit and the aave rai pcv deposit are whitelisted on the pcv guardian
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.rariPool9RaiPCVDeposit)).to.equal(true);
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.aaveRaiPCVDeposit)).to.equal(true);

  // Call drip on the rai pcv drip controller and make sure the rai price bound psm got the drip
  await contracts.raiPCVDripController.drip();

  expect(await contracts.rai.balanceOf(contracts.raiPriceBoundPSM.address)).to.be.gt(
    ethers.constants.WeiPerEther.mul(1_000_000)
  );

  // Query the rai oracle just to make sure the contract call works
  await contracts.chainlinkRaiUsdOracleWrapper.read();

  // Attempt to swap some fei for rai via the rai price bound psm
  await forceEth((await ethers.getSigners())[0].address);
  await forceEth(contracts.optimisticTimelock.address);
  await contracts.fei
    .connect(await getImpersonatedSigner(contracts.optimisticTimelock.address))
    .transfer((await ethers.getSigners())[0].address, ethers.constants.WeiPerEther.mul(2_000_000));
  await contracts.fei.approve(contracts.raiPriceBoundPSM.address, ethers.constants.MaxUint256);
  await contracts.raiPriceBoundPSM.redeem(
    addresses.feiDAOTimelock,
    ethers.constants.WeiPerEther.mul(1_000_000),
    ethers.constants.WeiPerEther.mul(200_000)
  );
  expect(await contracts.rai.balanceOf(addresses.feiDAOTimelock)).to.be.gt(ethers.constants.WeiPerEther.mul(200_000));
};

export { deploy, setup, teardown, validate };
