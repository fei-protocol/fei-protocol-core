import { getAddresses, getImpersonatedSigner } from '@test/helpers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { BPTLens, MockERC20, MockOracle, MockVault, MockWeightedPool } from '@custom-types/contracts';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
});

const toBN = ethers.BigNumber.from;

describe('BPTLens', function () {
  let userAddress: string;
  let pool: MockWeightedPool;
  let vault: MockVault;
  let token: MockERC20;
  let oracle1: MockOracle;
  let oracle2: MockOracle;
  let lens: BPTLens;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress } = await getAddresses());

    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    const tokenB = await (await ethers.getContractFactory('MockERC20')).deploy();

    vault = await (await ethers.getContractFactory('MockVault')).deploy([token.address, tokenB.address], userAddress);

    await vault.setBalances([ethers.constants.WeiPerEther, ethers.constants.WeiPerEther]);

    pool = await ethers.getContractAt('MockWeightedPool', await vault._pool());

    // set weights to 25%, 75%
    await pool.updateWeightsGradually(0, 0, [
      ethers.constants.WeiPerEther.div(4),
      ethers.constants.WeiPerEther.div(4).mul(3)
    ]);

    oracle1 = await (await ethers.getContractFactory('MockOracle')).deploy('1');

    oracle2 = await (await ethers.getContractFactory('MockOracle')).deploy('2');

    lens = await (
      await ethers.getContractFactory('BPTLens')
    ).deploy(token.address, pool.address, oracle1.address, oracle2.address, false, true);
  });

  it('initial state', async function () {
    expect(await lens.balanceReportedIn()).to.be.equal(token.address);
    expect(await lens.pool()).to.be.equal(pool.address);
    expect(await lens.VAULT()).to.be.equal(vault.address);
    expect(await lens.feiInPair()).to.be.true;
    expect(await lens.feiIsReportedIn()).to.be.false;
    expect(await lens.reportedOracle()).to.be.equal(oracle1.address);
    expect(await lens.otherOracle()).to.be.equal(oracle2.address);
  });

  it('balance', async function () {
    expect(await lens.balance()).to.be.bignumber.equal(ethers.constants.WeiPerEther);
  });

  it('resistantBalanceAndFei', async function () {
    const balances = await lens.resistantBalanceAndFei();
    expect(balances[0]).to.be.bignumber.equal(toBN('1414213562373095048'));
    expect(balances[1]).to.be.bignumber.equal(toBN('707106781186547524'));
  });
});
