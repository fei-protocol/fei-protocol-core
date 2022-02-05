import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*
FIP-77:

OA Steps:
1. Set rewards for fei-3crv on FeiRari to 1000
2. Set rewards for fei-3crv on TribalChief to 0
3. Set fei-3crv supply cap to 250m

*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  return {};
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Setup');
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log(`No Teardown`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Validate:');
  const { rariPool8Comptroller, tribalChief } = contracts;
  // supply cap
  const fei3CrvCToken = await rariPool8Comptroller.cTokensByUnderlying(addresses.curve3Metapool);

  expect(await rariPool8Comptroller.supplyCaps(fei3CrvCToken)).to.be.equal(
    ethers.constants.WeiPerEther.mul(250_000_000)
  ); // 250m

  // TribalChief
  expect(await tribalChief.stakedToken(1)).to.be.equal(addresses.curve3Metapool);
  expect(await tribalChief.stakedToken(14)).to.be.equal(addresses.fei3CrvStakingtokenWrapper);

  expect((await tribalChief.poolInfo(1)).allocPoint).to.be.equal(0);
  expect((await tribalChief.poolInfo(14)).allocPoint).to.be.equal(1000);
};

export { deploy, setup, teardown, validate };
