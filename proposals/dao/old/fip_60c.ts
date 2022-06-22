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
import { Fei } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
FIP-60c: Complete FeiRari transition

DEPLOY ACTIONS:
Deploy wrappers

OA ACTIONS:
1. Set rewards on G-UNI FEI-USDC to 500 AP
2. Transfer 1M FEI to UMA pool
3. Add all wrappers to CR Oracle
4. Deposit 1M FEI to UMA pool
5. Remove old PCV deposits from CR Oracle
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    fei,
    rariPool90FeiPCVDeposit,
    rariPool91FeiPCVDeposit,
    rariPool79FeiPCVDeposit,
    rariPool72FeiPCVDeposit,
    rariPool128FeiPCVDeposit,
    rariPool22FeiPCVDeposit
  } = addresses;

  const factory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool90FeiPCVDepositWrapper = await factory.deploy(rariPool90FeiPCVDeposit, fei, true);

  await rariPool90FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool90FeiPCVDepositWrapper: ', rariPool90FeiPCVDepositWrapper.address);

  const rariPool91FeiPCVDepositWrapper = await factory.deploy(rariPool91FeiPCVDeposit, fei, true);

  await rariPool91FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool91FeiPCVDepositWrapper: ', rariPool91FeiPCVDepositWrapper.address);

  const rariPool79FeiPCVDepositWrapper = await factory.deploy(rariPool79FeiPCVDeposit, fei, true);

  await rariPool79FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool79FeiPCVDepositWrapper: ', rariPool79FeiPCVDepositWrapper.address);

  const rariPool72FeiPCVDepositWrapper = await factory.deploy(rariPool72FeiPCVDeposit, fei, true);

  await rariPool72FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool72FeiPCVDepositWrapper: ', rariPool72FeiPCVDepositWrapper.address);

  const rariPool128FeiPCVDepositWrapper = await factory.deploy(rariPool128FeiPCVDeposit, fei, true);

  await rariPool128FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool128FeiPCVDepositWrapper: ', rariPool128FeiPCVDepositWrapper.address);

  const rariPool22FeiPCVDepositWrapper = await factory.deploy(rariPool22FeiPCVDeposit, fei, true);

  await rariPool22FeiPCVDepositWrapper.deployed();

  logging && console.log('rariPool22FeiPCVDepositWrapper: ', rariPool22FeiPCVDepositWrapper.address);

  return {
    rariPool90FeiPCVDepositWrapper,
    rariPool91FeiPCVDepositWrapper,
    rariPool79FeiPCVDepositWrapper,
    rariPool72FeiPCVDepositWrapper,
    rariPool128FeiPCVDepositWrapper,
    rariPool22FeiPCVDepositWrapper
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    rariPool90FeiPCVDepositWrapper,
    rariPool91FeiPCVDepositWrapper,
    rariPool79FeiPCVDepositWrapper,
    rariPool72FeiPCVDepositWrapper,
    rariPool128FeiPCVDepositWrapper,
    rariPool22FeiPCVDepositWrapper,
    rariPool28FeiPCVDepositWrapper,
    rariPool31FeiPCVDepositWrapper
  } = contracts;

  const wrappers = [
    rariPool90FeiPCVDepositWrapper,
    rariPool91FeiPCVDepositWrapper,
    rariPool79FeiPCVDepositWrapper,
    rariPool72FeiPCVDepositWrapper,
    rariPool128FeiPCVDepositWrapper,
    rariPool22FeiPCVDepositWrapper,
    rariPool28FeiPCVDepositWrapper,
    rariPool31FeiPCVDepositWrapper
  ];

  console.log('Validating');

  for (const wrapper of wrappers) {
    expect(await wrapper.isProtocolFeiDeposit()).to.be.true;
    const balances = await wrapper.resistantBalanceAndFei();
    expect(balances[0]).to.be.at.least(ethers.constants.WeiPerEther.mul(250_000));
    expect(balances[1]).to.be.at.least(ethers.constants.WeiPerEther.mul(250_000));
    expect(balances[0]).to.be.equal(balances[1]);
  }
};
