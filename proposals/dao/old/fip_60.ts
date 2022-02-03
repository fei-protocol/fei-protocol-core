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
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

// add invariants
const NAMES = ['FeiRari d3pool Fuse', 'FeiRari FEI-3Crv Metampool Fuse'];
const SYMBOLS = ['fD3-8', 'fFEI-3Crv-8', 'fG-UNI-FEI-DAI-8'];

/*
FIP-60: Add tokens to FeiRari

DEPLOY ACTIONS:

1. Deploy TribalChiefSyncExtension
2. Deploy StakedTokenWrapper d3
3. Deploy StakedTokenWrapper FEI-3Crv
4. Deploy StakingTokenWrapper Gelato
5. Deploy AutoRewardsDistributor d3
6. Deploy AutoRewardsDistributor FEI-3Crv
7. Deploy AutoRewardsDistributor Gelato
8. Deploy Fuse Pause Guardian

OA ACTIONS:
1. Add cTokens
2. Set new oracle on Comptroller
3. Add rewards to TribalChief
4. Grant AutoRewardsDistributor role to ARDs on RewardsDistributorAdmin
*/

// This function was used to generate the calldatas found in the OA proposal script. It is not actively used in the deploy flow
const deployCTokenCalldata = async function (addresses, underlying, name, symbol, impl, data, irm) {
  const comptroller = await ethers.getContractAt('Unitroller', addresses.rariPool8Comptroller);

  const admin = await comptroller.admin();
  await forceEth(admin);
  const signer = await getImpersonatedSigner(admin);

  const calldata = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'string', 'string', 'address', 'bytes', 'uint256', 'uint256'],
    [
      underlying,
      addresses.rariPool8Comptroller,
      irm,
      name,
      symbol,
      impl,
      data,
      0, // no reserve fator
      0 // no admin fee
    ]
  );

  return calldata;
};

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, tribalChiefSyncV2, tribalChief, rewardsDistributorAdmin, rariPool8MasterOracle, rariPool8Comptroller } =
    addresses;

  // 1.
  const factory = await ethers.getContractFactory('TribalChiefSyncExtension');
  const tribalChiefSyncExtension = await factory.deploy(tribalChiefSyncV2);

  await tribalChiefSyncExtension.deployed();

  logging && console.log('tribalChiefSyncExtension: ', tribalChiefSyncExtension.address);

  const stw1 = await deploySTW(deployAddress, addresses, logging);
  const d3StakingTokenWrapper = stw1.stakingTokenWrapper;

  logging && console.log('d3StakingTokenWrapper: ', d3StakingTokenWrapper.address);

  const stw2 = await deploySTW(deployAddress, addresses, logging);
  const fei3CrvStakingtokenWrapper = stw2.stakingTokenWrapper;

  logging && console.log('fei3CrvStakingtokenWrapper: ', fei3CrvStakingtokenWrapper.address);

  const ardFactory = await ethers.getContractFactory('AutoRewardsDistributorV2');

  const d3AutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    d3StakingTokenWrapper.address,
    addresses.curveD3pool,
    false,
    rariPool8Comptroller
  );

  await d3AutoRewardsDistributor.deployed();

  logging && console.log('d3AutoRewardsDistributor: ', d3AutoRewardsDistributor.address);

  const fei3CrvAutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    fei3CrvStakingtokenWrapper.address,
    addresses.curve3Metapool,
    false,
    rariPool8Comptroller
  );

  await fei3CrvAutoRewardsDistributor.deployed();

  logging && console.log('fei3CrvAutoRewardsDistributor: ', fei3CrvAutoRewardsDistributor.address);

  const pauseFactory = await ethers.getContractFactory('FuseGuardian');
  const fuseGuardian = await pauseFactory.deploy(core, rariPool8Comptroller);

  await fuseGuardian.deployed();

  logging && console.log('fuseGuardian: ', fuseGuardian.address);

  return {
    tribalChiefSyncExtension,
    d3StakingTokenWrapper,
    fei3CrvStakingtokenWrapper,
    d3AutoRewardsDistributor,
    fei3CrvAutoRewardsDistributor,
    fuseGuardian
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { d3AutoRewardsDistributor, fei3CrvAutoRewardsDistributor, autoRewardsDistributor } = contracts;

  logging && console.log('Teardown: mass ARD sync');
  await autoRewardsDistributor.setAutoRewardsDistribution();

  logging && console.log('fei3Crv ARD');
  await fei3CrvAutoRewardsDistributor.setAutoRewardsDistribution();
  logging && console.log('d3 ARD');
  await d3AutoRewardsDistributor.setAutoRewardsDistribution();
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    tribalChief,
    d3StakingTokenWrapper,
    fei3CrvStakingtokenWrapper,
    d3AutoRewardsDistributor,
    fei3CrvAutoRewardsDistributor,
    rariRewardsDistributorDelegator,
    rariPool8Comptroller
  } = contracts;
  const comptroller = contracts.rariPool8Comptroller;

  const d3Ctoken = await comptroller.cTokensByUnderlying(addresses.curveD3pool);
  expect(d3Ctoken).to.not.be.equal(ethers.constants.AddressZero);

  const fei3CrvCtoken = await comptroller.cTokensByUnderlying(addresses.curve3Metapool);
  expect(fei3CrvCtoken).to.not.be.equal(ethers.constants.AddressZero);

  // Ctoken configs
  // supply cap
  expect(await rariPool8Comptroller.supplyCaps(d3Ctoken)).to.be.equal(ethers.constants.WeiPerEther.mul(25_000_000)); // 25 M
  expect(await rariPool8Comptroller.supplyCaps(fei3CrvCtoken)).to.be.equal(
    ethers.constants.WeiPerEther.mul(25_000_000)
  ); // 25 M

  // borrow paused
  expect(await rariPool8Comptroller.borrowGuardianPaused(d3Ctoken)).to.be.true;
  expect(await rariPool8Comptroller.borrowGuardianPaused(fei3CrvCtoken)).to.be.true;

  // LTV
  expect((await rariPool8Comptroller.markets(d3Ctoken)).collateralFactorMantissa).to.be.equal(
    ethers.constants.WeiPerEther.mul(60).div(100)
  );
  expect((await rariPool8Comptroller.markets(fei3CrvCtoken)).collateralFactorMantissa).to.be.equal(
    ethers.constants.WeiPerEther.mul(60).div(100)
  );

  // Rewards configs
  expect(d3Ctoken).to.be.equal(await d3AutoRewardsDistributor.cTokenAddress());
  expect(await d3StakingTokenWrapper.pid()).to.be.equal(await d3AutoRewardsDistributor.tribalChiefRewardIndex());
  expect((await tribalChief.poolInfo(await d3StakingTokenWrapper.pid())).allocPoint).to.be.equal(250);
  const d3RewardSpeed = await d3AutoRewardsDistributor.getNewRewardSpeed();
  expect(d3RewardSpeed[1]).to.be.false;
  console.log(`d3 reward speed: ${d3RewardSpeed[0]}`);
  expect(d3RewardSpeed[0]).to.be.equal(await rariRewardsDistributorDelegator.compSupplySpeeds(d3Ctoken));

  expect(fei3CrvCtoken).to.be.equal(await fei3CrvAutoRewardsDistributor.cTokenAddress());
  expect(await fei3CrvStakingtokenWrapper.pid()).to.be.equal(
    await fei3CrvAutoRewardsDistributor.tribalChiefRewardIndex()
  );
  expect((await tribalChief.poolInfo(await fei3CrvStakingtokenWrapper.pid())).allocPoint).to.be.equal(250);
  const fei3CrvRewardSpeed = await fei3CrvAutoRewardsDistributor.getNewRewardSpeed();
  expect(fei3CrvRewardSpeed[1]).to.be.false;
  console.log(`fei3CrvRewardSpeed: ${fei3CrvRewardSpeed[0]}`);
  expect(fei3CrvRewardSpeed[0]).to.be.equal(await rariRewardsDistributorDelegator.compSupplySpeeds(fei3CrvCtoken));
};
