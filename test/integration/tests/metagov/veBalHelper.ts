import { VeBalHelper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner, time } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumberish, Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { forceEth } from '../../setup/utils';

const e18 = (x: BigNumberish) => ethers.constants.WeiPerEther.mul(x);

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-veBalHelper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let vebalOtcHelper: Contract;
  let otcBuyerAddress: string;
  let otcBuyerSigner: SignerWithAddress;

  before(async function () {
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);
    const addresses = await getAddresses();
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: 1
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());

    ({ vebalOtcHelper } = contracts);
    doLogging && console.log(`Environment loaded.`);
    vebalOtcHelper = vebalOtcHelper as VeBalHelper;

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }

    otcBuyerAddress = contractAddresses.aaveCompaniesMultisig;
    otcBuyerSigner = await getImpersonatedSigner(otcBuyerAddress);
  });

  it('should have correct owner and initial state', async () => {
    expect(await vebalOtcHelper.owner()).to.equal(contractAddresses.aaveCompaniesMultisig);
    expect(await vebalOtcHelper.pcvDeposit()).to.equal(contractAddresses.veBalDelegatorPCVDeposit);
    expect(await vebalOtcHelper.balancerStaker()).to.equal(contractAddresses.balancerGaugeStaker);
  });

  it('onlyOwner should allow owner to call priviledged function', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).setSpaceId(ethers.constants.HashZero);
    expect(await contracts.veBalDelegatorPCVDeposit.spaceId()).to.be.eq(ethers.constants.HashZero);
  });

  it('onlyOwner should reject non-owner address on priviledged function', async () => {
    const fakeOwner = ethers.constants.AddressZero;
    const fakeOwnerSigner = await getImpersonatedSigner(fakeOwner);
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).setSpaceId(ethers.constants.HashZero)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  describe('Setters', () => {
    it('should be able to setSpaceId() to change the snapshot space id', async () => {
      const beforeSnapshotId = await contracts.veBalDelegatorPCVDeposit.spaceId();
      await vebalOtcHelper.connect(otcBuyerSigner).setSpaceId(ethers.constants.HashZero);
      expect(await contracts.veBalDelegatorPCVDeposit.spaceId()).to.be.eq(ethers.constants.HashZero);
      await vebalOtcHelper.connect(otcBuyerSigner).setSpaceId(beforeSnapshotId);
      expect(await contracts.veBalDelegatorPCVDeposit.spaceId()).to.be.eq(beforeSnapshotId);
    });

    it('should be able setDelegate() to give snapshot voting power to another address', async () => {
      // Can setDelegate() to give Snapshot voting power to someone else
      expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(contractAddresses.eswak);
      await vebalOtcHelper.connect(otcBuyerSigner).setDelegate(contractAddresses.feiDAOTimelock);
      expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(contractAddresses.feiDAOTimelock);
    });

    it('should be able to clearDelegate() to give snapshot voting power to nobody', async () => {
      // Can clearDelegate() to give Snapshot voting power to nobody
      const snapshotSpaceId = await contracts.veBalDelegatorPCVDeposit.spaceId();
      expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(contractAddresses.feiDAOTimelock);
      expect(
        await contracts.snapshotDelegateRegistry.delegation(contractAddresses.veBalDelegatorPCVDeposit, snapshotSpaceId)
      ).to.be.equal(contractAddresses.feiDAOTimelock);
      await vebalOtcHelper.connect(otcBuyerSigner).clearDelegate();
      expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(vebalOtcHelper.address);
      expect(
        await contracts.snapshotDelegateRegistry.delegation(contractAddresses.veBalDelegatorPCVDeposit, snapshotSpaceId)
      ).to.be.equal(ethers.constants.AddressZero);
    });

    it('can setBalancerMinter()', async () => {
      const newMinter = contractAddresses.aaveCompaniesMultisig;
      await vebalOtcHelper.connect(otcBuyerSigner).setBalancerMinter(newMinter);
      expect(await contracts.balancerGaugeStaker.balancerMinter()).to.equal(newMinter);
    });

    it('should be able to setGaugeController() to update gauge controller', async () => {
      await vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(contractAddresses.feiDAOTimelock);
      expect(await contracts.veBalDelegatorPCVDeposit.gaugeController()).to.equal(contractAddresses.feiDAOTimelock);
      await vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(contractAddresses.balancerGaugeController);
      expect(await contracts.veBalDelegatorPCVDeposit.gaugeController()).to.equal(
        contractAddresses.balancerGaugeController
      );
    });
  });

  describe('Gauge management', () => {
    it('can stakeInGauge()', async () => {
      // TODO: There are tests for stakeInGauge on the base LiquidityGaugeManager elsewhere
    });

    it('can stakeAllInGauge()', async () => {
      // TODO: There are tests for stakeInGauge on the base LiquidityGaugeManager elsewhere
    });

    it('can unstakeFromGauge()', async () => {
      // TODO: There are tests for stakeInGauge on the base LiquidityGaugeManager elsewhere
    });

    it('should be able to voteForGaugeWeight() to vote for gauge weights whilst a lock is active ', async () => {
      // remove 100% votes for B-30FEI-70WETH
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            contractAddresses.balancerGaugeBpt30Fei70Weth
          )
        )[1]
      ).to.be.equal('10000');
      await vebalOtcHelper
        .connect(otcBuyerSigner)
        .voteForGaugeWeight(contractAddresses.bpt30Fei70Weth, contractAddresses.balancerGaugeBpt30Fei70Weth, 0);
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            contractAddresses.balancerGaugeBpt30Fei70Weth
          )
        )[1]
      ).to.be.equal('0');
      // set 100% votes for bb-a-usd
      await vebalOtcHelper.connect(otcBuyerSigner).voteForGaugeWeight(
        '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2', // bb-a-usd token
        '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb', // bb-a-usd gauge
        10000
      );
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb'
          )
        )[1]
      ).to.be.equal('10000');
    });
  });

  describe('Vote lock management', () => {
    it('can lock', async () => {
      // TODO - check the lock works. May need to unlock first
      await expect(contracts.vebalOtcHelper.connect(otcBuyerSigner).lock()).to.be.revertedWith(
        'Smart contract depositors not allowed'
      );
    });

    it('should be able to setLockDuration()', async () => {
      await contracts.vebalOtcHelper.connect(otcBuyerSigner).setLockDuration(20);
      expect(await contracts.veBalDelegatorPCVDeposit.lockDuration()).to.be.eq(20);
    });

    it('should be able to exitLock()', async () => {
      const veBalBefore = await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
      const balWethBefore = await contracts.balWethBPT.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
      expect(veBalBefore).to.be.not.eq(0);

      await time.increase(3600 * 24 * 365);
      await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

      const veBalAfter = await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
      const balWethAfter = await contracts.balWethBPT.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
      expect(veBalAfter).to.be.eq(0);
      expect(balWethAfter).to.be.gt(balWethBefore);
    });
  });

  describe('Boost management', () => {
    it('should be able to create_boost() to boost delegation to another address', async () => {
      await vebalOtcHelper.connect(otcBuyerSigner).create_boost(
        contractAddresses.veBalDelegatorPCVDeposit, // address _delegator
        contractAddresses.eswak, // address _receiver
        '10000', // int256 _percentage
        '1669852800', // uint256 _cancel_time = December 1 2022
        '1672272000', // uint256 _expire_time = December 29 2022
        '0' // uint256 _id
      );
      const expectedMinBoost = '70000000000000000000000'; // should be 77.5k with 18 decimals as of 14/09/2022
      expect(
        await contracts.balancerVotingEscrowDelegation.delegated_boost(contracts.veBalDelegatorPCVDeposit.address)
      ).to.be.at.least(expectedMinBoost);
      expect(await contracts.balancerVotingEscrowDelegation.received_boost(contractAddresses.eswak)).to.be.at.least(
        expectedMinBoost
      );

      // token id is uint256(delegatorAddress << 96 + boostId), and boostId = 0
      const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
      expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least(expectedMinBoost);
      expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal('1672272000');
      expect(await contracts.balancerVotingEscrowDelegation.token_cancel_time(tokenId)).to.equal('1669852800');
    });

    it('should be able to transferBalancerStakerOwnership()', async () => {
      const newOwner = contractAddresses.dai;
      await vebalOtcHelper.connect(otcBuyerSigner).transferBalancerStakerOwnership(newOwner);
      expect(await contracts.balancerGaugeStaker.owner()).to.equal(newOwner);
    });

    it('should be able to setVotingEscrowDelegation()', async () => {
      const newDelegation = contractAddresses.dai;
      await vebalOtcHelper.connect(otcBuyerSigner).setVotingEscrowDelegation(newDelegation);
      expect(await contracts.balancerGaugeStaker.votingEscrowDelegation()).to.equal(newDelegation);
    });
  });

  describe('Asset management', () => {
    // Tests withdrawERC20() from pcvDeposit
    it('should be able to withdrawERC20() to receive B-80BAL-20WETH at end of lock', async () => {
      await time.increase(3600 * 24 * 365);
      await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

      // Can withdrawERC20() to receive B-80BAL-20WETH at end of lock
      const bpt80Bal20WethAmount = await contracts.bpt80Bal20Weth.balanceOf(contractAddresses.veBalDelegatorPCVDeposit);
      await vebalOtcHelper
        .connect(otcBuyerSigner)
        .withdrawERC20(contractAddresses.bpt80Bal20Weth, otcBuyerAddress, bpt80Bal20WethAmount);
      expect(await contracts.bpt80Bal20Weth.balanceOf(otcBuyerAddress)).to.be.equal(bpt80Bal20WethAmount);
      expect(bpt80Bal20WethAmount).to.be.at.least(e18(112_041));
    });

    // Tests withdrawERC20() from staker
    it('can withdrawERC20 from staker', async () => {
      const balWethBPTWhale = '0xC128a9954e6c874eA3d62ce62B468bA073093F25';
      const balWethBPTWhaleSigner = await getImpersonatedSigner(balWethBPTWhale);
      await forceEth(balWethBPTWhale);

      // Transfer 1 balWETHBPT token to the balancerGaugeStaker, which we will later withdraw
      // via the vebalOtcHelper contract
      await contracts.balWethBPT.connect(balWethBPTWhaleSigner).transfer(contracts.balancerGaugeStaker.address, 1);
      await forceEth(contracts.balancerGaugeStaker.address);

      const userBalanceBefore = await contracts.balWethBPT.balanceOf(otcBuyerAddress);

      // Withdraw the 1 BPT token from the balancerGaugeStaker to the user
      await contracts.vebalOtcHelper
        .connect(otcBuyerSigner)
        .withdrawERC20fromStaker(contracts.balWethBPT.address, otcBuyerAddress, 1);

      const userBalanceAfter = await contracts.balWethBPT.balanceOf(otcBuyerAddress);
      expect(userBalanceAfter).to.be.eq(userBalanceBefore.add(1));
    });

    it('can withdrawETH from pcvDeposit', async () => {
      // Transfer 1 ETH to the veBalPCVDeposit
      await forceEth(contractAddresses.veBalDelegatorPCVDeposit);
      const oneEth = ethers.utils.parseEther('1');

      const receiverAddress = '0x0000000000000000000000000000000000000001';
      const userEthBefore = await ethers.provider.getBalance(receiverAddress);

      // Withdraw ETH from pcvDeposit to the user
      await vebalOtcHelper.connect(otcBuyerSigner).withdrawETH(receiverAddress, oneEth);

      const userEthAfter = await ethers.provider.getBalance(receiverAddress);
      expect(userEthAfter.sub(userEthBefore)).to.equal(oneEth);
    });

    it('can withdrawETH from staker', async () => {
      // Transfer 1 ETH to the staker
      await forceEth(contractAddresses.balancerGaugeStaker);
      const oneEth = ethers.utils.parseEther('1');

      const receiverAddress = '0x0000000000000000000000000000000000000001';
      const userEthBefore = await ethers.provider.getBalance(receiverAddress);

      // Withdraw ETH from pcvDeposit to the user
      await vebalOtcHelper.connect(otcBuyerSigner).withdrawETHfromStaker(receiverAddress, oneEth);

      const userEthAfter = await ethers.provider.getBalance(receiverAddress);
      expect(userEthAfter.sub(userEthBefore)).to.equal(oneEth);
    });
  });
});
