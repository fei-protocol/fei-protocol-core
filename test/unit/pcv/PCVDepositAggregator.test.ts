import { getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';
import {
  Core,
  Timelock,
  Timelock__factory,
  PCVDepositAggregator,
  PCVDepositAggregator__factory,
  MockERC20__factory,
  ERC20,
  MockPCVDepositV2__factory,
  PCVDeposit__factory,
  PCVDeposit,
  MockERC20
} from '@custom-types/contracts';
import chai from 'chai';
import { isStringObject } from 'util/types';

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

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    // add any addresses that you want to get here
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [userAddress, pcvControllerAddress, governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
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

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        core.address,
        token.address,
        [],
        [],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('returns expected values for deposits, weights, balances, and token', async () => {
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(0);
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);
    });

    it('successfully rebalances', async () => {});
  });

  describe('when it is deployed with a single deposit', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: MockERC20;
    let pcvDeposit: PCVDeposit;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositAggregatorDeployer = new PCVDepositAggregator__factory(impersonatedSigners[userAddress]);
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      await token.deployTransaction.wait();

      pcvDeposit = await mockPCVDepositDeployer.deploy(core.address, token.address, ethers.utils.parseEther('1000'), 0);
      await pcvDeposit.deployTransaction.wait();

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        core.address,
        token.address,
        [pcvDeposit.address],
        [90],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('returns expected values for deposits, weights, balances, and token', async () => {
      await token.mint(pcvDeposit.address, ethers.utils.parseEther('1000'));
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('1000'));
      expect(await pcvDepositAggregator.paused()).to.be.false;
      expect(await pcvDepositAggregator.bufferWeight()).to.be.equal(10);
      expect(await pcvDepositAggregator.token()).to.equal(token.address);
    });

    it('successfully rebalances', async () => {});
  });

  describe('when it is deployed with multiple deposits', async () => {
    let pcvDepositAggregator: PCVDepositAggregator;
    let token: MockERC20;
    let pcvDeposit1: PCVDeposit;
    let pcvDeposit2: PCVDeposit;
    let pcvDeposit3: PCVDeposit;

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

      pcvDepositAggregator = await pcvDepositAggregatorDeployer.deploy(
        core.address,
        core.address,
        token.address,
        [pcvDeposit1.address, pcvDeposit2.address, pcvDeposit3.address],
        [20, 30, 40],
        10
      );
      await pcvDepositAggregator.deployTransaction.wait();
    });

    it('returns expected values for deposits, weights, balances, and token', async () => {
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

    it('successfully rebalances when all pcv deposits need tokens', async () => {
      // Mint 1000, 2000, and 3000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('1000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('2000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('3000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Mint 4000 tokens to the pcv deposit aggregator
      await token.mint(pcvDepositAggregator.address, ethers.utils.parseEther('4000'));
      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('10000'));
      expect(await pcvDepositAggregator.totalWeight()).to.equal(100);

      // Call rebalance
      await pcvDepositAggregator.rebalance();

      // Check pcv deposit balances
      // Should be 2000, 3000, 4000 in deposits
      // Should be 1000 in the aggregator
      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('2000'));
      expect(await token.balanceOf(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('3000'));
      expect(await token.balanceOf(pcvDeposit3.address)).to.equal(ethers.utils.parseEther('4000'));

      // Also check the aggregator balance
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('1000'));
    });

    it('successfully rebalances when some pcv deposits have an overage of tokens and some do not', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('10000'));
      expect(await pcvDepositAggregator.totalWeight()).to.equal(100);

      // Call rebalance
      await pcvDepositAggregator.rebalance();

      // Check pcv deposit balances
      // Should be 2000, 3000, 4000 in deposits
      // Should be 1000 in the aggregator
      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('2000'));
      expect(await token.balanceOf(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('3000'));
      expect(await token.balanceOf(pcvDeposit3.address)).to.equal(ethers.utils.parseEther('4000'));

      // Also check the aggregator balance
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('1000'));
    });

    it('rebalances a single deposit', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      expect(await pcvDepositAggregator.getTotalBalance()).to.equal(ethers.utils.parseEther('10000'));
      expect(await pcvDepositAggregator.totalWeight()).to.equal(100);

      await pcvDepositAggregator.rebalanceSingle(pcvDeposit1.address);

      expect(await token.balanceOf(pcvDeposit1.address)).to.equal(ethers.utils.parseEther('2000'));
      expect(await token.balanceOf(pcvDepositAggregator.address)).to.equal(ethers.utils.parseEther('4000'));
    });

    it('adds a pcv deposit', async () => {
      const mockPCVDepositDeployer = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      const pcvDeposit4 = await mockPCVDepositDeployer.deploy(core.address, token.address, 0, 0);
      await pcvDeposit4.deployTransaction.wait();

      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).addPCVDeposit(pcvDeposit4.address, 10);
      expect(await pcvDepositAggregator.totalWeight()).to.equal(110);
    });

    it('removes a pcv deposit', async () => {
      await pcvDepositAggregator.connect(impersonatedSigners[governorAddress]).removePCVDeposit(pcvDeposit1.address);
      expect(await pcvDepositAggregator.totalWeight()).to.equal(80);
    });

    it('reports accurate targetPercentHeld', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Rebalance
      await pcvDepositAggregator.rebalance();

      const pcvDeposit1TargetPercentHeld = await pcvDepositAggregator.targetPercentHeld(pcvDeposit1.address);
      const pcvDeposit2TargetPercentHeld = await pcvDepositAggregator.targetPercentHeld(pcvDeposit2.address);
      const pcvDeposit3TargetPercentHeld = await pcvDepositAggregator.targetPercentHeld(pcvDeposit3.address);

      expect(ethers.utils.formatUnits(pcvDeposit1TargetPercentHeld.value)).to.equal('0.2');
      expect(ethers.utils.formatUnits(pcvDeposit2TargetPercentHeld.value)).to.equal('0.3');
      expect(ethers.utils.formatUnits(pcvDeposit3TargetPercentHeld.value)).to.equal('0.4');
    });

    it('reports accurate amountFromTarget', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Amount from target should be -4000, 0, 3000, respectively
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit1.address)).to.equal(
        ethers.utils.parseEther('4000')
      );
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit2.address)).to.equal(ethers.utils.parseEther('0'));
      expect(await pcvDepositAggregator.amountFromTarget(pcvDeposit3.address)).to.equal(
        ethers.utils.parseEther('-3000')
      );
    });

    it('reports accurate percentHeld', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
      await token.mint(pcvDeposit1.address, ethers.utils.parseEther('6000'));
      await token.mint(pcvDeposit2.address, ethers.utils.parseEther('3000'));
      await token.mint(pcvDeposit3.address, ethers.utils.parseEther('1000'));

      // Call deposit on each pcv deposit so that their balances update
      await pcvDeposit1.deposit();
      await pcvDeposit2.deposit();
      await pcvDeposit3.deposit();

      // Rebalance
      await pcvDepositAggregator.rebalance();

      const pcvDeposit1PercentHeld = (
        await pcvDepositAggregator.percentHeld(pcvDeposit1.address, ethers.utils.parseEther('10000'))
      ).value;

      expect(ethers.utils.formatUnits(pcvDeposit1PercentHeld)).to.equal('0.6');
    });

    it('reports accurate resistanceBalanceAndFei & balanceReportedIn', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
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

    it('withdraws when the buffer is not enough to cover the balasnce', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
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
      expect(await token.balanceOf(userAddress)).to.equal(ethers.utils.parseEther('8000'));
    });

    it('withdraws everything', async () => {
      // Mint 4000, 4000, and 4000 tokens to each pcv deposit, respectively
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
      expect(await token.balanceOf(userAddress)).to.equal(ethers.utils.parseEther('10000'));
    });
  });
});
