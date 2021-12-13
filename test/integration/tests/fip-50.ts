import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, time, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
const toBN = ethers.BigNumber.from;
const e18 = toBN('1000000000000000000');

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-fip-50', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('should be able to withdraw LUSD from B.AMM', async function () {
    expect(await contracts.bammLens.balance()).to.be.at.least(toBN(89_000_000).mul(e18));

    const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    const bammShares = await contracts.bamm.balanceOf(contracts.feiDAOTimelock.address);
    await contracts.bamm.connect(daoSigner).withdraw(bammShares);

    const lusdBalanceAfter = await contracts.lusd.balanceOf(contracts.feiDAOTimelock.address);
    expect(lusdBalanceAfter).to.be.at.least(toBN(89_000_000).mul(e18));
  });
});
