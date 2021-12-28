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
import { forceEth } from '@test/integration/setup/utils';
import { getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

const eth = ethers.constants.WeiPerEther;

const namedPCVDeposits = [
  {
    depositName: '500k Idle FEI Senior Tranche',
    usdAmount: 0,
    feiAmount: eth.mul(500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0x9ce3a740df498646939bcbb213a66bbfa1440af6'
  },
  {
    depositName: '2M Visor FEI-USDC 0.05% fee pool',
    usdAmount: 0,
    feiAmount: eth.mul(2_000_000),
    underlyingTokenAmount: eth.mul(2_000_000),
    underlyingToken: '0x767FFf096392EB26668E969C346ace3f327Eae8D'
  },
  {
    depositName: '500k Barnbridge Senior',
    usdAmount: 0,
    feiAmount: eth.mul(500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0xA3abb32c657adA8803bF6AEEF6Eb42B29c74bf28'
  },
  {
    depositName: '2.5M Idle FEI Best Yield',
    usdAmount: 0,
    feiAmount: eth.mul(2_500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0xb2d5cb72a621493fe83c6885e4a776279be595bc'
  },
  {
    depositName: '100k INDEX Token',
    usdAmount: eth.mul(2_240_000),
    feiAmount: 0,
    underlyingTokenAmount: eth.mul(100_000),
    underlyingToken: '0x0954906da0Bf32d5479e25f46056d22f08464cab'
  },
  {
    depositName: '50m Ondo LaaS',
    usdAmount: 0,
    feiAmount: eth.mul(50_000_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0x0000000000000000000000000000000000000000'
  },
  {
    depositName: 'Kashi 1m DPI-FEI',
    usdAmount: 0,
    feiAmount: eth.mul(1_000_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0xf352773f1d4d69deb4de8d0578e43b993ee76e5d'
  },
  {
    depositName: 'Kashi 2.5m SUSHI-FEI',
    usdAmount: 0,
    feiAmount: eth.mul(2_500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0xf2028069cd88f75fcbcfe215c70fe6d77cb80b10'
  },
  {
    depositName: 'Kashi 2.5m TRIBE-FEI',
    usdAmount: 0,
    feiAmount: eth.mul(2_500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0x18c9584d9ce56a0f62f73f630f180d5278c873b7'
  },
  {
    depositName: 'Kashi 2.5m WETH-FEI',
    usdAmount: 0,
    feiAmount: eth.mul(2_500_000),
    underlyingTokenAmount: 0,
    underlyingToken: '0x329efec40f58054fc2f2cd4fd65809f2be3e11c8'
  }
];

const rewards = [];
const timestamps = [];

/*
FIP-57
DEPLOY ACTIONS:

1. Deploy NamedStaticPCVDepositWrapper
2. Deploy TribalChiefSyncV2

DAO ACTIONS:
1. Add NamedStaticPCVDepositWrapper to the Collateralization Oracle 
2. Deprecate DAI bonding curve + TRIBERagequit
3. Add TribalChief auto-decrease rewards
4. Reduce DAI PSM spread to 25 bps
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, tribalChief, optimisticTimelock, autoRewardsDistributor } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy NamedStaticPCVDepositWrapper
  const namedStaticPCVDepositWrapperFactory = await ethers.getContractFactory('NamedStaticPCVDepositWrapper');
  const namedStaticPCVDepositWrapper = await namedStaticPCVDepositWrapperFactory.deploy(core, namedPCVDeposits);
  await namedStaticPCVDepositWrapper.deployTransaction.wait();

  logging && console.log('namedStaticPCVDepositWrapper: ', namedStaticPCVDepositWrapper.address);

  // 2. Deploy TribalChiefSyncV2
  const tcFactory = await ethers.getContractFactory('TribalChiefSyncV2');
  const tribalChiefSyncV2 = await tcFactory.deploy(
    tribalChief,
    optimisticTimelock,
    autoRewardsDistributor,
    rewards,
    timestamps
  );
  await tribalChiefSyncV2.deployTransaction.wait();

  logging && console.log('tribalChiefSyncV2: ', tribalChiefSyncV2.address);

  return {
    namedStaticPCVDepositWrapper,
    tribalChiefSyncV2
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { optimisticTimelock, staticPcvDepositWrapper2, namedStaticPCVDepositWrapper } = addresses;
  const { collateralizationOracle } = contracts;

  const oatimelock = await getImpersonatedSigner(optimisticTimelock);
  await forceEth(optimisticTimelock);

  await collateralizationOracle.connect(oatimelock).removeDeposit(staticPcvDepositWrapper2);
  await collateralizationOracle.connect(oatimelock).addDeposit(namedStaticPCVDepositWrapper);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { collateralizationOracle, namedStaticPCVDepositWrapper } = contracts;
  const usdAddress = '0x1111111111111111111111111111111111111111';

  expect(await collateralizationOracle.depositToToken(namedStaticPCVDepositWrapper.address)).to.be.equal(usdAddress);
  expect(await collateralizationOracle.getDepositsForToken(usdAddress)).to.include(
    namedStaticPCVDepositWrapper.address
  );
  expect(await namedStaticPCVDepositWrapper.numDeposits()).to.equal(10);
  expect(await namedStaticPCVDepositWrapper.balance()).to.equal(eth.mul(2_240_000));
  expect(await namedStaticPCVDepositWrapper.feiReportBalance()).to.equal(eth.mul(64_000_000));
};
