import { getImpersonatedSigner, balance, getAddresses, getCore } from '@test/helpers';
import chai, { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import {
  MockERC20,
  MockERC20__factory,
  MockOracle,
  MockOracle__factory,
  MockWeth,
  MockWeth__factory,
  MockVault,
  MockVault__factory,
  MockMerkleOrchard,
  MockMerkleOrchard__factory,
  BalancerPCVDepositPoolTwo,
  BalancerPCVDepositPoolTwo__factory,
  Core
} from '@custom-types/contracts';
import { expectApprox } from '@test/helpers';

chai.config.includeStack = true;

describe('BalancerPCVDepositPoolTwo', function () {
  let core: Core;
  let weth: MockWeth;
  let bal: MockERC20;
  let vault: MockVault;
  let rewards: MockMerkleOrchard;
  let oracleBal: MockOracle;
  let oracleWeth: MockOracle;
  let deposit: BalancerPCVDepositPoolTwo;

  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  before(async () => {
    const addresses = await getAddresses();
    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
  });

  beforeEach(async function () {
    core = await getCore();
    weth = await new MockWeth__factory(await getImpersonatedSigner(userAddress)).deploy();
    bal = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
    oracleBal = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('25');
    oracleWeth = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('4000');
    vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
      [bal.address, weth.address],
      userAddress
    );
    await vault.setMockDoTransfers(true);
    rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(bal.address);
    deposit = await new BalancerPCVDepositPoolTwo__factory(await getImpersonatedSigner(userAddress)).deploy(
      core.address,
      vault.address,
      rewards.address,
      '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
      '300', // max 3% slippage
      bal.address,
      oracleBal.address,
      oracleWeth.address
    );
  });

  describe('Deposit', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.deposit()).to.be.revertedWith('Pausable: paused');
    });

    it('succeeds if not paused', async function () {
      // seed the deposit with BAL & WETH
      await weth.mint(deposit.address, '250'); // 1M$ of WETH
      await bal.mint(deposit.address, '40000'); // 1M$ of BAL

      expect(await deposit.balance()).to.be.equal('0');
      await deposit.deposit();
      expectApprox(await deposit.balance(), '80000', '10');
    });
  });

  describe('Withdraw', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000')
      ).to.be.revertedWith('Pausable: paused');
    });

    it('reverts if not PCVController', async function () {
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).withdraw(userAddress, '1000')
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('succeeds if deposit is not empty', async function () {
      // deposit in the PCVDeposit
      await weth.mint(deposit.address, '250'); // 1M$ of WETH
      await bal.mint(deposit.address, '40000'); // 1M$ of BAL
      await deposit.deposit();

      expectApprox(await deposit.balance(), '80000', '10');
      expect(await bal.balanceOf(userAddress)).to.be.equal('0');
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000');
      expectApprox(await deposit.balance(), '79000', '10');
      expect(await bal.balanceOf(userAddress)).to.be.equal('1000');
    });
  });

  describe('Withdraw ERC20', function () {
    it('reverts if not PCVController', async function () {
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).withdrawERC20(weth.address, userAddress, '1000')
      ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
    });

    it('succeeds if called as PCVController', async function () {
      await bal.mint(deposit.address, '20000'); // suppose we just claimed some rewards

      expect(await bal.balanceOf(deposit.address)).to.be.equal('20000');
      expect(await bal.balanceOf(userAddress)).to.be.equal('0');

      // send half of rewards somewhere else
      await deposit
        .connect(await getImpersonatedSigner(pcvControllerAddress))
        .withdrawERC20(bal.address, userAddress, '10000');

      expect(await bal.balanceOf(deposit.address)).to.be.equal('10000');
      expect(await bal.balanceOf(userAddress)).to.be.equal('10000');
    });
  });

  describe('Exit pool', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(deposit.exitPool(userAddress)).to.be.revertedWith('Pausable: paused');
    });

    it('reverts if not PCVController', async function () {
      await expect(deposit.connect(await getImpersonatedSigner(userAddress)).exitPool(userAddress)).to.be.revertedWith(
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('succeeds and sends tokens to target', async function () {
      // deposit in the PCVDeposit
      await weth.mint(deposit.address, '250'); // 1M$ of WETH
      await bal.mint(deposit.address, '40000'); // 1M$ of BAL
      await deposit.deposit();
      expect(await weth.balanceOf(userAddress)).to.be.equal('0');
      expect(await bal.balanceOf(userAddress)).to.be.equal('0');
      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(userAddress);
      expect(await weth.balanceOf(userAddress)).to.be.equal('250');
      expect(await bal.balanceOf(userAddress)).to.be.equal('40000');
    });
  });

  describe('Claim Rewards', function () {
    it('reverts if paused', async function () {
      await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
      await expect(
        deposit.claimRewards(
          '83', // distributionId
          '524310123843078144915', // amount
          ['0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f'] // merkleProof
        )
      ).to.be.revertedWith('Pausable: paused');
    });

    it('claims some BAL on the deposit', async function () {
      expect(await bal.balanceOf(deposit.address)).to.be.equal('0');
      await deposit.claimRewards('1', '42', ['0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f']);
      expect(await bal.balanceOf(deposit.address)).to.be.equal('42');
    });
  });

  describe('Set oracle', function () {
    it('reverts if not Governor or Admin', async function () {
      const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('3980');
      await expect(
        deposit.connect(await getImpersonatedSigner(userAddress)).setOracle(weth.address, newOracle.address)
      ).to.be.revertedWith('CoreRef: Caller is not a governor or contract admin');
    });

    it("can update token's oracle", async function () {
      const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('33');
      expect(await deposit.tokenOracle()).to.be.equal(oracleBal.address);
      await deposit.connect(await getImpersonatedSigner(governorAddress)).setOracle(bal.address, newOracle.address);
      expect(await deposit.tokenOracle()).to.be.equal(newOracle.address);
    });

    it("can update otherToken's oracle", async function () {
      const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('33');
      expect(await deposit.otherTokenOracle()).to.be.equal(oracleWeth.address);
      await deposit.connect(await getImpersonatedSigner(governorAddress)).setOracle(weth.address, newOracle.address);
      expect(await deposit.otherTokenOracle()).to.be.equal(newOracle.address);
    });
  });
});
