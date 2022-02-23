import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import proposals from '@test/integration/proposals_config';
import mainnetAddresses from '@protocol/mainnetAddresses';
import tribalchief from '@protocol/tribalchief';

describe('e2e-tribalchief', function () {
  let contracts: NamedContracts;
  let e2eCoord: TestEndtoEndCoordinator;
  const doLogging = Boolean(process.env.LOGGING);

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    const config = {
      logging: doLogging,
      deployAddress: (await ethers.getSigners())[0].address,
      version: 1
    };
    e2eCoord = new TestEndtoEndCoordinator(config, proposals);
    ({ contracts } = await e2eCoord.loadEnvironment());
  });

  it('should have the proper total number of pools', async function () {
    const numPools = await contracts.tribalChief.numPools();
    expect(numPools).to.be.equal(Object.keys(tribalchief).length);
  });

  it('should have the proper total of allocated points', async function () {
    const totalAllocPoint = await contracts.tribalChief.totalAllocPoint();
    const totalAllocPointDocumented = Object.values(tribalchief).reduce((sum, cur) => {
      sum += cur.allocPoint;
      return sum;
    }, 0);
    expect(totalAllocPoint).to.be.equal(totalAllocPointDocumented);
  });

  it('should properly describe the current pools config', async function () {
    const numPools = await contracts.tribalChief.numPools();
    const documentedPoolsKeys = Object.keys(tribalchief);
    const documentedPoolsValues = Object.values(tribalchief);
    for (let i = 0; i < numPools && i < documentedPoolsKeys.length; i++) {
      const documentedStakedContract = mainnetAddresses[documentedPoolsKeys[i]];
      const errmsg1 = `Staked token "${documentedPoolsKeys[i]}" is not found in mainnetAddresses.ts`;
      expect(documentedStakedContract).to.not.be.equal(undefined, errmsg1);

      const poolInfo = await contracts.tribalChief.poolInfo(i);
      const stakedToken = await contracts.tribalChief.stakedToken(i);
      let stakedTokenName = null;
      for (const key in mainnetAddresses) {
        if (mainnetAddresses[key].address == stakedToken) {
          stakedTokenName = key;
        }
      }
      let errmsg2 = `Staked token "${documentedPoolsKeys[i]}" has wrong address`;
      if (stakedTokenName) {
        errmsg2 += `. Did you mean "${stakedTokenName}" ? This contract is what is actually staked on the TribalChief pool #${i}.`;
      }
      expect(stakedToken).to.be.equal(documentedStakedContract.address, errmsg2);

      const errmsg3 = `TribalChief pool #${i} "${documentedPoolsKeys[i]}" has ${poolInfo.allocPoint} allocPoint on-chain, but ${documentedPoolsValues[i].allocPoint} in the config file.`;
      expect(poolInfo.allocPoint, errmsg3).to.be.equal(documentedPoolsValues[i].allocPoint);

      const errmsg4 = `TribalChief pool #${i} "${documentedPoolsKeys[i]}" has unlocked=${poolInfo.unlocked} on-chain, but ${documentedPoolsValues[i].unlocked} in the config file.`;
      expect(poolInfo.unlocked).to.be.equal(documentedPoolsValues[i].unlocked, errmsg4);
    }
  });
});
