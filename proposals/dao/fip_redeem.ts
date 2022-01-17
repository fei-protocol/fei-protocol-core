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

chai.use(CBN(ethers.BigNumber));

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { fei, reptb } = addresses;

  // 1. Deploy Redeemer
  const reptbRedeemer = await (await ethers.getContractFactory('REPTbRedeemer')).deploy(fei, reptb);

  return {
    reptbRedeemer
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { fei, pegExchanger, reptbRedeemer } = contracts;
  console.log('Validating');
  expect(await fei.balanceOf(reptbRedeemer.address)).to.be.equal(ethers.constants.WeiPerEther.mul(12_000_000));
  expect(await pegExchanger.expirationTimestamp()).to.be.equal(1659312000);
};
