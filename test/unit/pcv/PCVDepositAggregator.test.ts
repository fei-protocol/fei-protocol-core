import { expectRevert, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';
import {
  Core,
  PCVDepositAggregator,
  PCVDepositAggregator__factory,
  MockERC20__factory,
  ERC20,
  MockPCVDepositV2__factory,
  PCVDeposit,
  MockERC20,
  IRewardsAssetManager__factory
} from '@custom-types/contracts';
import chai from 'chai';
import { deployMockContract, MockContract } from '@ethereum-waffle/mock-contract';

// This will theoretically make the error stack actually print!
chai.config.includeStack = true;

// Import if needed, just a helper.
// const toBN = ethers.BigNumber.from;

describe('PCV Deposit Aggregator', function () {
  // variable decs for vars that you want to use in multiple tests
  // typeing contracts specifically to what kind they are will catch before you run them!
  let core: Core;

  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  let guardianAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    // add any addresses that you want to get here
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
    guardianAddress = addresses.guardianAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [userAddress, pcvControllerAddress, governorAddress, guardianAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async () => {
    // If the forked-network state needs to be reset between each test, run this
    // await network.provider.request({method: 'hardhat_reset', params: []});

    // Do any pre-test setup here
    core = await getCore();

    // To deploy a contract, import and use the contract factory specific to that contract
    // note that the signer supplied is optional
  });

  // Try and do as much deployment in beforeEach, and as much testing in the actual functions
  describe('when it is deployed with no deposits', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: ERC20;
    let assetManager: MockContract;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      assetManager = await deployMockContract(
        impersonatedSigners[userAddress],
        IRewardsAssetManager__factory.createInterface().format('json')
      );
      await assetManager.mock.getToken.returns(token.address);

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        assetManager.address,
        token.address,
        [],
        [],
        10
      );

      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('initial values are correct: balance, paused, buffer weight, token', async () => {
      expect(await pcvDepositAggregator.balance()).to.equal(0);
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(0);
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);

      const resistantBalanceAndFei = await pcvDepositAggregator.resistantBalanceAndFei();
      const totalResistantBalanceAndFei = await pcvDepositAggregator.getTotalResistantBalanceAndFei();

      expect(resistantBalanceAndFei[0]).to.equal(0);
      expect(resistantBalanceAndFei[1]).to.equal(0);
      expect(totalResistantBalanceAndFei[0]).to.equal(0);
      expect(totalResistantBalanceAndFei[1]).to.equal(0);
    });
  });

  describe('when it is deployed with a single deposit', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: MockERC20;
    let pcvDeposit: PCVDeposit;
    let assetManager: MockContract;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      pcvDeposit = await mockPCVDepositDeployer.deploy(core.address, token.address, ethers.utils.parseEther('1000'), 0);
      await pcvDeposit.deployTransaction.wait();

      assetManager = await deployMockContract(
        impersonatedSigners[userAddress],
        IRewardsAssetManager__factory.createInterface().format('json')
      );
      await assetManager.mock.getToken.returns(token.address);

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        assetManager.address,
        token.address,
        [pcvDeposit.address],
        [90],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('initial values are correct: balance, paused, buffer weight, token', async () => {
      expect(await pcvDepositAggregator.balance()).to.equal(0);
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);
    });

    it('reports accurate percentHeld', async () => {
      // Mint some tokens into the deposit and the aggregator
      await token.mint(pcvDeposit.address, ethers.utils.parseEther('1000'));
      await token.mint(pcvDepositAggregator.address, ethers.utils.parseEther('1000'));

      await pcvDeposit.deposit();

      const percentHeldWithoutDeposit = (await pcvDepositAggregator.percentHeld(pcvDeposit.address, 0)).value;
      const percentHeldWithDeposit = (
        await pcvDepositAggregator.percentHeld(pcvDeposit.address, ethers.utils.parseEther('8000'))
      ).value;

      expect(ethers.utils.formatUnits(percentHeldWithoutDeposit)).to.equal('0.5');
      expect(ethers.utils.formatUnits(percentHeldWithDeposit)).to.equal('0.9');
    });

    it('reports accurate normalizedTargetWeight', async () => {
      expect((await pcvDepositAggregator.normalizedTargetWeight(pcvDeposit.address)).value).to.equal(
        ethers.utils.parseEther('0.9')
      );
    });

    it('reports accurate amountFromTarget', async () => {
      // Mint some tokens into the deposit and the aggregator
      await token.mint(pcvDeposit.address, ethers.utils.parseEther('1000'));
      await token.mint(pcvDepositAggregator.address, ethers.utils.parseEther('1000'));

      await pcvDeposit.deposit();

      const amountFromTarget = await pcvDepositAggregator.amountFromTarget(pcvDeposit.address);
      expect(amountFromTarget).to.equal(ethers.utils.parseEther('-800'));
    });

    it('reports accurate resistantBalanceAndFei and balanceReportedIn', async () => {
      // Mint some tokens into the deposit and the aggregator
      await token.mint(pcvDeposit.address, ethers.utils.parseEther('1000'));
      await token.mint(pcvDepositAggregator.address, ethers.utils.parseEther('1000'));

      await pcvDeposit.deposit();

      const resistantBalanceAndFei = await pcvDepositAggregator.resistantBalanceAndFei();
      const totalResistantBalanceAndFei = await pcvDepositAggregator.getTotalResistantBalanceAndFei();

      const resistantBalance = resistantBalanceAndFei[0];
      const resistantFei = resistantBalanceAndFei[1];

      const totalResistantBalance = totalResistantBalanceAndFei[0];
      const totalResistantFei = totalResistantBalanceAndFei[1];

      expect(resistantBalance).to.equal(ethers.utils.parseEther('1000'));
      expect(resistantFei).to.equal(ethers.utils.parseEther('0'));

      expect(totalResistantBalance).to.equal(ethers.utils.parseEther('2000'));
      expect(totalResistantFei).to.equal(ethers.utils.parseEther('0'));
    });
  });

  describe('when it is deployed with multiple deposits', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: MockERC20;
    let pcvDeposit1: PCVDeposit;
    let pcvDeposit2: PCVDeposit;
    let pcvDeposit3: PCVDeposit;
    let assetManager: MockContract;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      pcvDeposit1 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit1.deployTransaction.wait();

      pcvDeposit2 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit2.deployTransaction.wait();

      pcvDeposit3 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit3.deployTransaction.wait();

      assetManager = await deployMockContract(
        impersonatedSigners[userAddress],
        IRewardsAssetManager__factory.createInterface().format('json')
      );
      await assetManager.mock.getToken.returns(token.address);

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        assetManager.address,
        token.address,
        [pcvDeposit1.address, pcvDeposit2.address, pcvDeposit3.address],
        [20, 30, 40],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('initial values are correct: balance, paused, buffer weight, token', async () => {
      expect(await pcvDepositAggregator.balance()).to.equal(0);
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);
    });

    it('returns correct values after calling deposit on each pcv deposit', async () => {
      // Mint 1000, 2000, and 3000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('1000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('2000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('3000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('6000'));
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);

      const pcvDeposits = await pcvDepositAggregator.pcvDeposits();
      expect(pcvDeposits.length).to.equal(2);

      const deposits = pcvDeposits[0];
      const weights = pcvDeposits[1];

      expect(deposits.length).to.equal(3);
      expect(weights.length).to.equal(3);

      expect(deposits[0]).to.equal(pcvDeposit1.address);
      expect(deposits[1]).to.equal(pcvDeposit2.address);
      expect(deposits[2]).to.equal(pcvDeposit3.address);

      expect(weights[0]).to.equal(20);
      expect(weights[1]).to.equal(30);
      expect(weights[2]).to.equal(40);
    });

    it('adds a pcv deposit', async () => {
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      const pcvDeposit4 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit4.deployTransaction.wait();

      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).addPCVDeposit(pcvDeposit4.address, 10);
      expect(await pcvDepositAggregator.totalWeight()).to.equal(110);
    });

    it('reports accurate amountFromTarget', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Amount from target should be 4000, 0, -3000, respectively
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit1.address)).to.equal(
        ethers.utils.parseEther('4000')
      );
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit3.address)).to.equal(
        ethers.utils.parseEther('-3000')
      );
    });

    it('reports accurate resistanceBalanceAndFei & balanceReportedIn', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('10000'));
      expect(await pcvDepositAggregator.totalWeight()).to.equal(100);

      const resistantBalanceAndFei = await pcvDepositAggregator.resistantBalanceAndFei();
      const balanceReportedIn = await pcvDepositAggregator.balanceReportedIn();

      expect(balanceReportedIn).to.equal(token.address);

      const resistantBalance = resistantBalanceAndFei[0];
      const fei = resistantBalanceAndFei[1];

      expect(resistantBalance).to.equal(ethers.utils.parseEther('0'));
      expect(fei).to.equal(ethers.utils.parseEther('0'));

      const totalResistantBalanceAndFei = await pcvDepositAggregator.getTotalResistantBalanceAndFei();

      const totalResistantBalance = totalResistantBalanceAndFei[0];
      const totalResistantFei = totalResistantBalanceAndFei[1];

      expect(totalResistantBalance).to.equal(ethers.utils.parseEther('10000'));
      expect(totalResistantFei).to.equal(0);
    });

    it('sets the pcv deposit weight and updates the totalweight accordingly', async () => {
      await pcvDepositAggregator
        .connect(impersonatedSigners[governorAddress])
        .setPCVDepositWeight(pcvDeposit1.address, 50);
      expect(await pcvDepositAggregator.totalWeight()).to.equal(130);
    });

    it('sets the buffer weight and updates the totalweight accordingly', async () => {
      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).setBufferWeight(50);
      expect(await pcvDepositAggregator.totalWeight()).to.equal(140);
    });

    it('withdraws when the buffer is not enough to cover the balances', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      await pcvDepositAggregator
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, ethers.utils.parseEther('8000'));

      // Check token balances. After withdrawing 8000 tokens, the total balance will be 2000, with none in the buffer.
      // Since this withdraw towards the optimal weighting, the post-withdraw balance should be split 20/30/40(/10)
      // 20/100 * 2000 = 400 (pcv deposit 1)
      // 30/100 * 2000 = 600 (pcv deposit 2)
      // 40/100 * 2000 = 800 (pcv deposit 3)
      // 10/100 * 2000 = 200 (aggregator)

      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('400'));
      expect(await token.balanceOf(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('600'));
      expect(await token.balanceOf(pcvDeposit3.address)).to.equal(ethers.utils.parseEther('800'));
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('200'));
      expect(await token.balanceOf(userAddress)).to.equal(ethers.utils.parseEther('8000'));

      // Check pcv deposit & aggregator balance() calls
      expect(await pcvDeposit1.balance()).to.equal(ethers.utils.parseEther('400'));
      expect(await pcvDeposit2.balance()).to.equal(ethers.utils.parseEther('600'));
      expect(await pcvDeposit3.balance()).to.equal(ethers.utils.parseEther('800'));
      expect(await pcvDepositAggregator.balance()).to.equal(ethers.utils.parseEther('200'));
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('2000'));
    });

    it('reverts when calling deposit when paused', async () => {
      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).pause();
      await expect(pcvDepositAggregator.deposit()).to.be.revertedWith('Pausable: paused');
    });

    it('reverts when calling withdraw when paused', async () => {
      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).pause();
      await expect(
        pcvDepositAggregator
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdraw(userAddress, ethers.utils.parseEther('1000'))
      ).to.be.revertedWith('Pausable: paused');
    });

    // This test covers the special edge case with the following context:
    // 1. The buffer is not enough to cover the balances
    // 2. There is (at least one) pcv deposit that has a defecit
    // 3. Said defecit is *still* a defecit after the withdrawal
    // This edge case is special because it is the only time when we DONT pull tokens from every pcv deposit to cover the overage,
    // and where we'll actually end up pulling more tokens than needed into the aggregator - ie the aggregatort will have an overage
    // after this method is complete. This is because we don't do deposits of tokens on withdraw - only withdrawals.
    it('withdraws when the buffer is not enough to cover the balances and there is a pcv deposit that should not be pulled from', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Only withdraw 100 tokens this time
      await pcvDepositAggregator
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, ethers.utils.parseEther('100'));

      // Check token balances. After withdrawing 100 tokens, the total balance will be 9900.

      // The optimal weighting given this total balance is:
      // 20/100 * 9900 = 1980 (pcv deposit 1)
      // 30/100 * 9900 = 2970 (pcv deposit 2)
      // 40/100 * 9900 = 3960 (pcv deposit 3)
      // 10/100 * 9900 = 990 (aggregator)

      // However, because PCV Deposit 3 has a defecit and will still have it after the withdrawal,
      // this defecit will actually be accounted for as an overage in the buffer itself. Therefore no
      // withdrawals should happen on it, and it will still have its original value of 1000 tokens.

      // The actual weighting given this edge case is:
      // 20/100 * 9900 = 1980 tokens
      // 30/100 * 9900 = 2970 tokens
      // 40/100 * 9900 = 3960 - aggregatorOverage = 1000 tokens
      // 10/100 * 9900 = 990 + aggregatorOverage = 3950 tokens
      // 1980 + 2970 + 1000 + 3950 = 9900 tokens which is correct after a 100 token withdrawal

      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('1980'));
      expect(await token.balanceOf(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('2970'));
      expect(await token.balanceOf(pcvDeposit3.address)).to.equal(ethers.utils.parseEther('1000'));
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('3950'));
      expect(await token.balanceOf(userAddress)).to.equal(ethers.utils.parseEther('100'));

      // Check pcv deposit & aggregator balance() calls
      expect(await pcvDeposit1.balance()).to.equal(ethers.utils.parseEther('1980'));
      expect(await pcvDeposit2.balance()).to.equal(ethers.utils.parseEther('2970'));
      expect(await pcvDeposit3.balance()).to.equal(ethers.utils.parseEther('1000'));
      expect(await pcvDepositAggregator.balance()).to.equal(ethers.utils.parseEther('3950'));
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('9900'));
    });

    it('withdraws everything', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      await pcvDepositAggregator
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, ethers.utils.parseEther('10000'));

      // Check token balances
      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await token.balanceOf(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await token.balanceOf(pcvDeposit3.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await token.balanceOf(userAddress)).to.equal(ethers.utils.parseEther('10000'));

      // Check pcv deposit & aggregator balance() calls
      expect(await pcvDeposit1.balance()).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDeposit2.balance()).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDeposit3.balance()).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDepositAggregator.balance()).to.equal(ethers.utils.parseEther('0'));
    });

    it('withdraws trace amounts', async () => {
      // Mint 6000, 3000, and 1000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      await pcvDepositAggregator
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, ethers.utils.parseEther('0.000000001'));

      // Check balances after
      const pcvDeposit1Balance = await token.balanceOf(pcvDeposit1.address);
      const pcvDeposit2Balance = await token.balanceOf(pcvDeposit2.address);
      const pcvDeposit3Balance = await token.balanceOf(pcvDeposit3.address);

      const aggregatorBalance = await token.balanceOf(pcvDepositAggregator.address);

      const sum = pcvDeposit1Balance.add(pcvDeposit2Balance).add(pcvDeposit3Balance).add(aggregatorBalance);

      expect(sum).to.equal(ethers.utils.parseEther('10000').sub(ethers.utils.parseEther('0.000000001')));
    });

    it('deposits trace amounts', async () => {
      // Mint 1, 1000, 1e10, and 100 wei tokens to each pcv deposit and aggregator respectively
      await token.mint(pcvDeposit1.address, '1');
      await token.mint(pcvDeposit2.address, '1000');
      await token.mint(pcvDeposit3.address, '10000000000');
      await token.mint(pcvDepositAggregator.address, '100');

      // total: 1 + 1000 + 10000000000 + 100 wei = 10000001101 wei

      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      await pcvDepositAggregator.deposit();

      // Check balances after
      const pcvDeposit1Balance = await token.balanceOf(pcvDeposit1.address);
      const pcvDeposit2Balance = await token.balanceOf(pcvDeposit2.address);
      const pcvDeposit3Balance = await token.balanceOf(pcvDeposit3.address);
      const aggregatorBalance = await token.balanceOf(pcvDepositAggregator.address);

      const sum = pcvDeposit1Balance.add(pcvDeposit2Balance).add(pcvDeposit3Balance).add(aggregatorBalance);

      expect(sum.toNumber()).to.equal(10000001101);
    });

    it('deposit-singles with no overage in aggregator< and reverts', async () => {
      // Mint 3000, 3000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('4000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Call depositSingle on each pcv deposit; they should all revert as the aggregator has no balance
      await expect(pcvDepositAggregator.depositSingle(pcvDeposit1.address)).to.be.revertedWith(
        'No overage in aggregator to top up deposit.'
      );
      await expect(pcvDepositAggregator.depositSingle(pcvDeposit2.address)).to.be.revertedWith(
        'No overage in aggregator to top up deposit.'
      );
      await expect(pcvDepositAggregator.depositSingle(pcvDeposit3.address)).to.be.revertedWith(
        'No overage in aggregator to top up deposit.'
      );
    });

    it('deposit-singles with overage in the aggregator and succeeds', async () => {
      // Mint 3000, 3000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('4000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Top up the aggregator with a bunch of tokens, and then call deposit single; they should not revert
      await token.mint(pcvDepositAggregator.address, ethers.utils.parseEther('10000'));

      // Should have 20% after = 20_000 * 0.2 = 4000
      await pcvDepositAggregator.depositSingle(pcvDeposit1.address);
      expect(await pcvDeposit1.balance()).to.equal(ethers.utils.parseEther('4000'));

      // Should have 30% after = 30_000 * 0.3 = 6000
      await pcvDepositAggregator.depositSingle(pcvDeposit2.address);
      expect(await pcvDeposit2.balance()).to.equal(ethers.utils.parseEther('6000'));

      // Should have 40% after = 40_000 * 0.4 = 8000
      await pcvDepositAggregator.depositSingle(pcvDeposit3.address);
      expect(await pcvDeposit3.balance()).to.equal(ethers.utils.parseEther('8000'));
    });

    it('correctly sets deposit weight to zero via setDepositWeightZero()', async () => {
      await pcvDepositAggregator
        .connect(impersonatedSigners[guardianAddress])
        .setPCVDepositWeightZero(pcvDeposit1.address);
      expect((await pcvDepositAggregator.normalizedTargetWeight(pcvDeposit1.address)).value).to.equal(0);
    });

    it('correctly sets the buffer weight via setBufferWeight()', async () => {
      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).setBufferWeight('5000');
      expect(await pcvDepositAggregator.bufferWeight()).to.equal('5000');
    });

    it('correctly sets pcv deposit weights via setPCVDepositWeight()', async () => {
      await pcvDepositAggregator
        .connect(impersonatedSigners[governorAddress])
        .setPCVDepositWeight(pcvDeposit1.address, '5000');
      expect(await pcvDepositAggregator.pcvDepositWeights(pcvDeposit1.address)).to.equal('5000');
    });

    it('reverts upon attempting to remove a non-existent pcv deposit', async () => {
      await pcvDepositAggregator
        .connect(impersonatedSigners[governorAddress])
        .removePCVDeposit(pcvDeposit1.address, false);
      await expect(
        pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).removePCVDeposit(pcvDeposit1.address, true)
      ).to.be.revertedWith('Deposit does not exist.');
    });

    it('reverts upon trying to add a pcv deposit that already exists', async () => {
      await expect(
        pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).addPCVDeposit(pcvDeposit1.address, '5000')
      ).to.be.revertedWith('Deposit already added.');
    });

    it('reverts when trying to add a pcv deposit with a non-matching token', async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const token2 = await tokenFactory.deploy();
      await token2.deployTransaction.wait();

      await expect(
        pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).addPCVDeposit(token2.address, '5000')
      ).to.be.revertedWith("function selector was not recognized and there's no fallback function");
    });

    it('returns correctl values from hasPCVDeposit()', async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const token2 = await tokenFactory.deploy();
      await token2.deployTransaction.wait();

      expect(await pcvDepositAggregator.hasPCVDeposit(pcvDeposit1.address)).to.equal(true);
      expect(await pcvDepositAggregator.hasPCVDeposit(token2.address)).to.equal(false);
    });

    it('correctly returns all the pcv deposit when pcvDeposits() is called', async () => {
      const deposits = await pcvDepositAggregator.pcvDeposits();

      expect(deposits.deposits.length).to.equal(3);
      expect(deposits.weights.length).to.equal(3);

      expect(deposits.deposits[0]).to.equal(pcvDeposit1.address);
      expect(deposits.deposits[1]).to.equal(pcvDeposit2.address);
      expect(deposits.deposits[2]).to.equal(pcvDeposit3.address);

      expect(deposits.weights[0]).to.equal('20');
      expect(deposits.weights[1]).to.equal('30');
      expect(deposits.weights[2]).to.equal('40');
    });
  });

  describe('access control', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: MockERC20;
    let pcvDeposit1: PCVDeposit;
    let pcvDeposit2: PCVDeposit;
    let pcvDeposit3: PCVDeposit;
    let assetManager: MockContract;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      pcvDeposit1 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit1.deployTransaction.wait();

      pcvDeposit2 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit2.deployTransaction.wait();

      pcvDeposit3 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit3.deployTransaction.wait();

      assetManager = await deployMockContract(
        impersonatedSigners[userAddress],
        IRewardsAssetManager__factory.createInterface().format('json')
      );
      await assetManager.mock.getToken.returns(token.address);

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        assetManager.address,
        token.address,
        [pcvDeposit1.address, pcvDeposit2.address, pcvDeposit3.address],
        [20, 30, 40],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('governor-or-admin-only methods', async () => {
      // add & remove pcv deposit
      await expect(pcvDepositAggregator.addPCVDeposit(pcvDeposit1.address, '5000')).to.be.revertedWith(
        'CoreRef: Caller is not a governor or contract admin'
      );
      await expect(pcvDepositAggregator.removePCVDeposit(pcvDeposit1.address, false)).to.be.revertedWith(
        'CoreRef: Caller is not a governor or contract admin'
      );

      // set pcv deposit weight & set buffer weight
      await expect(pcvDepositAggregator.setBufferWeight('5000')).to.be.revertedWith(
        'CoreRef: Caller is not a governor or contract admin'
      );
      await expect(pcvDepositAggregator.setPCVDepositWeight(pcvDeposit1.address, '5000')).to.be.revertedWith(
        'CoreRef: Caller is not a governor or contract admin'
      );
    });

    it('reverts when trying to call governor-only methods from non-governor accounts', async () => {
      await expect(pcvDepositAggregator.setAssetManager(pcvDeposit1.address)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
      await expect(pcvDepositAggregator.setNewAggregator(pcvDeposit1.address)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
    });

    it('reverts when trying to call guardian methods from non guardian accounts', async () => {
      await expect(pcvDepositAggregator.setPCVDepositWeightZero(pcvDeposit1.address)).to.be.revertedWith(
        'CoreRef: Caller is not a guardian'
      );
    });
  });
});
