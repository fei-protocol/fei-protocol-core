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
FIP-64: Add wstETH to FeiRari

OA ACTIONS:


*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  return {} as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

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

  const d3Ctoken = await comptroller.cTokensByUnderlying(addresses.curveD3pool);
  expect(d3Ctoken).to.not.be.equal(ethers.constants.AddressZero);

  const fei3CrvCtoken = await comptroller.cTokensByUnderlying(addresses.curve3Metapool);
  expect(fei3CrvCtoken).to.not.be.equal(ethers.constants.AddressZero);

  const feiUsdcCToken = await comptroller.cTokensByUnderlying(addresses.gUniFeiUsdcLP);
  expect(feiUsdcCToken).to.not.be.equal(ethers.constants.AddressZero);

  const wstEthCToken = await comptroller.cTokensByUnderlying(addresses.wstEth);
  expect(wstEthCToken).to.not.be.equal(ethers.constants.AddressZero);

  console.log('Ctoken configs');

  // supply cap
  expect(await rariPool8Comptroller.supplyCaps(feiUsdcCToken)).to.be.equal(ethers.constants.WeiPerEther.mul(200_000)); // 100 M
  expect(await rariPool8Comptroller.supplyCaps(fei3CrvCtoken)).to.be.equal(
    ethers.constants.WeiPerEther.mul(100_000_000)
  ); // 100 M
  expect(await rariPool8Comptroller.supplyCaps(wstEthCToken)).to.be.equal(ethers.constants.WeiPerEther.mul(30_000)); // 100 M
  expect(await rariPool8Comptroller.supplyCaps(d3Ctoken)).to.be.equal(ethers.constants.WeiPerEther.mul(100_000_000)); // 100 M

  console.log('Borrow Pause');

  // borrow paused
  expect(await rariPool8Comptroller.borrowGuardianPaused(wstEthCToken)).to.be.true;

  console.log('LTV');

  // LTV
  expect((await rariPool8Comptroller.markets(wstEthCToken)).collateralFactorMantissa).to.be.equal(
    ethers.constants.WeiPerEther.mul(80).div(100)
  );
};
