import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts, NamedAddresses } from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';

const toBN = ethers.BigNumber.from;
const e18 = ethers.constants.WeiPerEther;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-fip-50', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
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
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('should be able to withdraw LUSD from B.AMM', async function () {
    // set Chainlink ETHUSD to a fixed 4,000$ value
    await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');

    await contracts.bammDeposit.deposit();
    expect(await contracts.bammDeposit.balance()).to.be.at.least(toBN(89_000_000).mul(e18));

    await contracts.bammDeposit.withdraw(contractAddresses.feiDAOTimelock, toBN(89_000_000).mul(e18));

    const lusdBalanceAfter = await contracts.lusd.balanceOf(contracts.feiDAOTimelock.address);
    expect(lusdBalanceAfter).to.be.bignumber.equal(toBN(89_000_000).mul(e18));
  });
});
