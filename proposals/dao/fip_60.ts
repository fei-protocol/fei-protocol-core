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

const D3_TRIBAL_CHIEF_INDEX = 2;
const GELATO_TRIBAL_CHIEF_INDEX = 3;

const UNDERLYINGS = [
  '0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89',
  '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655',
  '0x3D1556e84783672f2a3bd187a592520291442539'
];
const NAMES = ['FeiRari d3pool Fuse', 'FeiRari FEI-3Crv Metampool Fuse', 'FeiRari Gelato FEI-DAI LP Fuse'];
const SYMBOLS = ['fD3-8', 'fFEI-3Crv-8', 'fG-UNI-FEI-DAI-8'];

const COLLATERAL_FACTOR = ethers.constants.WeiPerEther.mul(60).div(100); // 60% CF

const IMPL = '0x67Db14E73C2Dce786B5bbBfa4D010dEab4BBFCF9';
const BECOME_IMPL_DATA = '0x';

const COMPTROLLER = '0xc54172e34046c1653d1920d40333dd358c7a1af4'; // Pool 8 comptroller
const IRM = '0xbab47e4b692195bf064923178a90ef999a15f819'; // ETH IRM (not really used because borrowing off)

/*
FIP-60: Add tokens to FeiRari

DEPLOY ACTIONS:

1. Deploy TribalChiefSyncExtension
2. Deploy StakedTokenWrapper d3
3. Deploy StakedTokenWrapper Gelato
4. Deploy AutoRewardsDistributor d3
5. Deploy AutoRewardsDistributor Gelato

OA ACTIONS:
1. Add cTokens
2. Set new oracle on Comptroller
3. Add rewards to TribalChief
4. Grant AutoRewardsDistributor role to ARDs on RewardsDistributorAdmin
*/

const setMaster = async function (addresses, newOracle) {
  const comptroller = await ethers.getContractAt('Unitroller', addresses.rariPool8Comptroller);

  const admin = await comptroller.admin();
  await forceEth(admin);
  const signer = await getImpersonatedSigner(admin);

  await comptroller.connect(signer)._setPriceOracle(newOracle);

  console.log(await comptroller.oracle());
};

const deployCToken = async function (addresses, underlying, name, symbol) {
  const comptroller = await ethers.getContractAt('Unitroller', addresses.rariPool8Comptroller);

  const admin = await comptroller.admin();
  await forceEth(admin);
  const signer = await getImpersonatedSigner(admin);

  const calldata = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'address', 'string', 'string', 'address', 'bytes', 'uint256', 'uint256'],
    [
      underlying,
      COMPTROLLER,
      IRM,
      name,
      symbol,
      IMPL,
      BECOME_IMPL_DATA,
      0, // no reserve fator
      0 // no admin fee
    ]
  );
  console.log(calldata);
  await comptroller.connect(signer)._deployMarket(false, calldata, COLLATERAL_FACTOR);

  return await comptroller.cTokensByUnderlying(underlying);
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
  const gelatoFEIUSDCStakingTokenWrapper = stw2.stakingTokenWrapper;

  logging && console.log('gelatoFEIUSDCStakingTokenWrapper: ', gelatoFEIUSDCStakingTokenWrapper.address);

  const ardFactory = await ethers.getContractFactory('AutoRewardsDistributorV2');

  const d3AutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    d3StakingTokenWrapper.address,
    UNDERLYINGS[0],
    false,
    rariPool8Comptroller
  );

  await d3AutoRewardsDistributor.deployed();

  logging && console.log('d3AutoRewardsDistributor: ', d3AutoRewardsDistributor.address);

  const gelatoAutoRewardsDistributor = await ardFactory.deploy(
    core,
    rewardsDistributorAdmin,
    tribalChief,
    gelatoFEIUSDCStakingTokenWrapper.address,
    UNDERLYINGS[2],
    false,
    rariPool8Comptroller
  );

  await gelatoAutoRewardsDistributor.deployed();

  logging && console.log('gelatoAutoRewardsDistributor: ', gelatoAutoRewardsDistributor.address);

  await setMaster(addresses, rariPool8MasterOracle);

  const rariPool8D3 = await deployCToken(addresses, UNDERLYINGS[0], NAMES[0], SYMBOLS[0]);
  console.log(NAMES[0], rariPool8D3);

  const rariPool8Gelato = await deployCToken(addresses, UNDERLYINGS[2], NAMES[2], SYMBOLS[2]);
  console.log(NAMES[2], rariPool8Gelato);

  return {
    tribalChiefSyncExtension,
    d3StakingTokenWrapper,
    gelatoFEIUSDCStakingTokenWrapper,
    gelatoAutoRewardsDistributor,
    d3AutoRewardsDistributor
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {};
