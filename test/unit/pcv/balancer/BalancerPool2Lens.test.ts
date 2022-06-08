import {
  BalancerPool2Lens,
  MockERC20,
  MockOracle,
  MockPCVDepositV2,
  MockVault,
  MockWeightedPool
} from '@custom-types/contracts';
import { expectApproxAbs, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
});

const toBN = ethers.BigNumber.from;

describe('BalancerPool2Lens', function () {
  let userAddress: string;
  let pool: MockWeightedPool;
  let vault: MockVault;
  let token: MockERC20;
  let oracle1: MockOracle;
  let oracle2: MockOracle;
  let deposit: MockPCVDepositV2;
  let lens: BalancerPool2Lens;

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

    await vault.setBalances([ethers.constants.WeiPerEther.mul(20), ethers.constants.WeiPerEther.mul(30000)]);

    pool = await ethers.getContractAt('MockWeightedPool', await vault._pool());

    const core = await getCore();
    deposit = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      core.address,
      pool.address,
      10000, // deposit reports 10000 LP tokens
      0
    );

    await pool.mint(pool.address, 89999);
    await pool.mint(deposit.address, 10000);

    // set weights to 70%, 30%
    await pool.updateWeightsGradually(0, 0, [
      ethers.constants.WeiPerEther.div(100).mul(70),
      ethers.constants.WeiPerEther.div(100).mul(30)
    ]);
    await pool.mockSetNormalizedWeights([
      ethers.constants.WeiPerEther.div(100).mul(70),
      ethers.constants.WeiPerEther.div(100).mul(30)
    ]);

    oracle1 = await (await ethers.getContractFactory('MockOracle')).deploy('3500');
    oracle2 = await (await ethers.getContractFactory('MockOracle')).deploy('1');

    lens = await (
      await ethers.getContractFactory('BalancerPool2Lens')
    ).deploy(deposit.address, token.address, pool.address, oracle1.address, oracle2.address, false, true);
  });

  // pool contains 20 tokenA, 30,000 tokenB
  // tokenA price 3,500 $, tokenB price 1 $
  // -> pool contains 70,000$, 30,000$
  // pool weight 70% tokenA, 30% tokenB (currently balanced)
  // userAddress owns 10% of the pool (10,000 / 100,000)

  it('initial state', async function () {
    expect(await lens.balanceReportedIn()).to.be.equal(token.address);
    expect(await lens.pool()).to.be.equal(pool.address);
    expect(await lens.balancerVault()).to.be.equal(vault.address);
    expect(await lens.feiInPair()).to.be.true;
    expect(await lens.feiIsReportedIn()).to.be.false;
    expect(await lens.reportedOracle()).to.be.equal(oracle1.address);
    expect(await lens.otherOracle()).to.be.equal(oracle2.address);

    expect(await pool.balanceOf(pool.address)).to.be.equal('90000');
    expect(await pool.balanceOf(deposit.address)).to.be.equal('10000');
  });

  it('balance', async function () {
    expectApproxAbs(await lens.balance(), ethers.constants.WeiPerEther.mul('2'), '1');
  });

  it('resistantBalanceAndFei', async function () {
    const balances = await lens.resistantBalanceAndFei();
    expectApproxAbs(balances[0], ethers.constants.WeiPerEther.mul('2'), '1');
    expectApproxAbs(balances[1], ethers.constants.WeiPerEther.mul('3000'), '1');
  });
});
