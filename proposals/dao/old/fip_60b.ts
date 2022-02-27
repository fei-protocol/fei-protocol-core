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
import { deploy as deploySTW } from '@scripts/deploy/deployStakingTokenWrapper';

chai.use(CBN(ethers.BigNumber));

/*
FIP-60b: Add tokens to FeiRari

DEPLOY ACTIONS:

1. Deploy StakedTokenWrapper FEI-DAI
2. Deploy StakedTokenWrapper FEI-USDC
3. Deploy AutoRewardsDistributor FEI-DAI
4. Deploy AutoRewardsDistributor FEI-USDC
5. Deploy Fuse Admin

OA ACTIONS:
1. Set Fuse Admin
2. Add cTokens
3. Set Borrow paused by underlying
4. Set Market Supply Caps
3. Add to oracle on Comptroller
4. Add rewards to TribalChief, init stw
5. Grant AutoRewardsDistributor role to ARDs on RewardsDistributorAdmin
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, tribalChief, rewardsDistributorAdmin, rariPool8Comptroller } = addresses;

  // 1.
  const stw1 = await deploySTW(deployAddress, addresses, false);
  const feiDaiStakingTokenWrapper = stw1.stakingTokenWrapper;

  logging && console.log('feiDaiStakingTokenWrapper: ', feiDaiStakingTokenWrapper.address);

  const stw2 = await deploySTW(deployAddress, addresses, false);
  const feiUsdcStakingTokenWrapper = stw2.stakingTokenWrapper;

  logging && console.log('feiUsdcStakingTokenWrapper: ', feiUsdcStakingTokenWrapper.address);

  const ardFactory = await ethers.getContractFactory('AutoRewardsDistributorV2');

  const feiDaiAutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    feiDaiStakingTokenWrapper.address,
    addresses.gUniFeiDaiLP,
    false,
    rariPool8Comptroller
  );

  await feiDaiAutoRewardsDistributor.deployed();

  logging && console.log('feiDaiAutoRewardsDistributor: ', feiDaiAutoRewardsDistributor.address);

  const feiUsdcAutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    feiUsdcStakingTokenWrapper.address,
    addresses.gUniFeiUsdcLP,
    false,
    rariPool8Comptroller
  );

  await feiUsdcAutoRewardsDistributor.deployed();

  logging && console.log('feiUsdcAutoRewardsDistributor: ', feiUsdcAutoRewardsDistributor.address);

  const adminFactory = await ethers.getContractFactory('FuseAdmin');
  const fuseAdmin = await adminFactory.deploy(core, rariPool8Comptroller);

  await fuseAdmin.deployed();

  logging && console.log('fuseAdmin: ', fuseAdmin.address);

  return {
    feiDaiStakingTokenWrapper,
    feiUsdcStakingTokenWrapper,
    feiDaiAutoRewardsDistributor,
    feiUsdcAutoRewardsDistributor,
    fuseAdmin
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const {
    d3AutoRewardsDistributor,
    fei3CrvAutoRewardsDistributor,
    feiDaiAutoRewardsDistributor,
    feiUsdcAutoRewardsDistributor,
    autoRewardsDistributor
  } = contracts;

  logging && console.log('Teardown: mass ARD sync');
  await autoRewardsDistributor.setAutoRewardsDistribution();

  logging && console.log('FEI-USDC ARD');
  await feiUsdcAutoRewardsDistributor.setAutoRewardsDistribution();
  logging && console.log('FEI-DAI ARD');
  await feiDaiAutoRewardsDistributor.setAutoRewardsDistribution();
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    tribalChief,
    feiDaiStakingTokenWrapper,
    feiUsdcStakingTokenWrapper,
    feiDaiAutoRewardsDistributor,
    feiUsdcAutoRewardsDistributor,
    rariRewardsDistributorDelegator,
    rariPool8Comptroller
  } = contracts;
  const comptroller = contracts.rariPool8Comptroller;

  console.log('Validating');

  expect(addresses.fuseAdmin).to.be.equal(await comptroller.admin());

  expect(await contracts.rariPool8MasterOracle.admin()).to.be.equal(addresses.fuseAdmin);

  const feiDaiCToken = await comptroller.cTokensByUnderlying(addresses.gUniFeiDaiLP);
  expect(feiDaiCToken).to.not.be.equal(ethers.constants.AddressZero);

  const feiUsdcCToken = await comptroller.cTokensByUnderlying(addresses.gUniFeiUsdcLP);
  expect(feiUsdcCToken).to.not.be.equal(ethers.constants.AddressZero);

  console.log('Ctoken configs');

  // supply cap
  expect(await rariPool8Comptroller.supplyCaps(feiDaiCToken)).to.be.equal(
    ethers.constants.WeiPerEther.mul(2_500_000_000)
  ); // 2.5BN
  expect(await rariPool8Comptroller.supplyCaps(feiUsdcCToken)).to.be.equal(ethers.constants.WeiPerEther.mul(50_000)); // 25 M

  console.log('Borrow Pause');

  // borrow paused
  expect(await rariPool8Comptroller.borrowGuardianPaused(feiDaiCToken)).to.be.true;
  expect(await rariPool8Comptroller.borrowGuardianPaused(feiUsdcCToken)).to.be.true;

  console.log('LTV');

  // LTV
  expect((await rariPool8Comptroller.markets(feiDaiCToken)).collateralFactorMantissa).to.be.equal(
    ethers.constants.WeiPerEther.mul(60).div(100)
  );
  expect((await rariPool8Comptroller.markets(feiUsdcCToken)).collateralFactorMantissa).to.be.equal(
    ethers.constants.WeiPerEther.mul(60).div(100)
  );

  // Rewards configs
  console.log('Rewards');

  expect(feiDaiCToken).to.be.equal(await feiDaiAutoRewardsDistributor.cTokenAddress());
  expect(await feiDaiStakingTokenWrapper.pid()).to.be.equal(
    await feiDaiAutoRewardsDistributor.tribalChiefRewardIndex()
  );
  expect((await tribalChief.poolInfo(await feiDaiStakingTokenWrapper.pid())).allocPoint).to.be.equal(100);
  const feiDaiRewardSpeed = await feiDaiAutoRewardsDistributor.getNewRewardSpeed();
  expect(feiDaiRewardSpeed[1]).to.be.false;
  console.log(`d3 reward speed: ${feiDaiRewardSpeed[0]}`);
  expect(feiDaiRewardSpeed[0]).to.be.equal(await rariRewardsDistributorDelegator.compSupplySpeeds(feiDaiCToken));

  expect(feiUsdcCToken).to.be.equal(await feiUsdcAutoRewardsDistributor.cTokenAddress());
  expect(await feiUsdcStakingTokenWrapper.pid()).to.be.equal(
    await feiUsdcAutoRewardsDistributor.tribalChiefRewardIndex()
  );
  expect((await tribalChief.poolInfo(await feiUsdcStakingTokenWrapper.pid())).allocPoint).to.be.equal(250);
  const feiUsdcRewardSpeed = await feiUsdcAutoRewardsDistributor.getNewRewardSpeed();
  expect(feiUsdcRewardSpeed[1]).to.be.false;
  console.log(`feiUsdcRewardSpeed: ${feiUsdcRewardSpeed[0]}`);
  expect(feiUsdcRewardSpeed[0]).to.be.equal(await rariRewardsDistributorDelegator.compSupplySpeeds(feiUsdcCToken));
};
