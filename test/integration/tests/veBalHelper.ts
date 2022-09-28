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
import { forceEth } from '../setup/utils';

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
  let otcBuyer: string;
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

    otcBuyer = contractAddresses.aaveCompaniesMultisig;
    otcBuyerSigner = await getImpersonatedSigner(otcBuyer);
  });

  it('should have correct owner and initial state', async () => {
    expect(await vebalOtcHelper.owner()).to.equal(contractAddresses.aaveCompaniesMultisig);
    expect(await vebalOtcHelper.pcvDeposit()).to.equal(contractAddresses.veBalDelegatorPCVDeposit);
    expect(await vebalOtcHelper.boostManager()).to.equal(contractAddresses.balancerGaugeStaker);
  });

  it('should be able to setSpaceId() to change the snapshot space id', async () => {
    // Can setSpaceId() to change the snapshot space id
    const beforeSnapshotId = await contracts.veBalDelegatorPCVDeposit.spaceId();
    await vebalOtcHelper.connect(otcBuyerSigner).setSpaceId(ethers.constants.HashZero);
    expect(await contracts.veBalDelegatorPCVDeposit.spaceId()).to.be.eq(ethers.constants.HashZero);
    await vebalOtcHelper.connect(otcBuyerSigner).setSpaceId(beforeSnapshotId);
    expect(await contracts.veBalDelegatorPCVDeposit.spaceId()).to.be.eq(beforeSnapshotId);
  });

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

  it('should be able to setGaugeController() to update gauge controller', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(contractAddresses.feiDAOTimelock);
    await vebalOtcHelper.connect(otcBuyerSigner).setGaugeController(contractAddresses.balancerGaugeController);
    // TODO: Verify setting gaugeController had expected state change
  });

  it('can lock', async () => {
    await expect(contracts.vebalOtcHelper.connect(otcBuyerSigner).lock()).to.be.revertedWith(
      'Smart contract depositors not allowed'
    );
  });

  it('should be able to setLockDuration()', async () => {
    await contracts.vebalOtcHelper.connect(otcBuyerSigner).setLockDuration(20);
    expect(await contracts.veBalDelegatorPCVDeposit.lockDuration()).to.be.eq(20);
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

  it('should be able to exitLock()', async () => {
    const veBalBefore = await contracts.veBAL.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    const balWethBefore = await contracts.balWethBPT.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    expect(veBalBefore).to.be.not.eq(0);

    await time.increase(3600 * 24 * 365);
    await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

    const veBalAfter = await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    const balWethAfter = await contracts.balWethBpt.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    expect(veBalAfter).to.be.eq(0);
    expect(balWethAfter).to.be.gt(balWethBefore);
  });

  it('should be able to withdrawERC20() to receive B-80BAL-20WETH at end of lock', async () => {
    await time.increase(3600 * 24 * 365);
    await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

    // Can withdrawERC20() to receive B-80BAL-20WETH at end of lock
    const bpt80Bal20WethAmount = await contracts.bpt80Bal20Weth.balanceOf(contractAddresses.veBalDelegatorPCVDeposit);
    await vebalOtcHelper
      .connect(otcBuyerSigner)
      .withdrawERC20(contractAddresses.bpt80Bal20Weth, otcBuyer, bpt80Bal20WethAmount);
    expect(await contracts.bpt80Bal20Weth.balanceOf(otcBuyer)).to.be.equal(bpt80Bal20WethAmount);
    expect(bpt80Bal20WethAmount).to.be.at.least(e18(112_041));
  });

  it('can withdrawERC20 from staker and PCV', async () => {
    const balWethBPTWhale = '0xC128a9954e6c874eA3d62ce62B468bA073093F25';
    const balWethBPTWhaleSigner = await getImpersonatedSigner(balWethBPTWhale);
    await forceEth(balWethBPTWhale);

    await contracts.balWethBpt.connect(balWethBPTWhaleSigner).transfer(contracts.veBalDelegatorPCVDeposit.address, 1);
    await contracts.balWethBpt.connect(balWethBPTWhaleSigner).transfer(contracts.balancerGaugeStaker.address, 1);
    await forceEth(contracts.veBalDelegatorPCVDeposit.address);
    await forceEth(contracts.balancerGaugeStaker.address);

    const balanceBefore = await contracts.balWethBpt.balanceOf(otcBuyerSigner);
    await contracts.vebalOtcHelper
      .connect(otcBuyerSigner)
      .withdrawERC20fromPCV(contractAddresses.balWethBpt, otcBuyerSigner, 1);
    expect(await contracts.balWethBpt.balanceOf(otcBuyerSigner)).to.be.eq(balanceBefore.add(1));
    await contracts.vebalOtcHelper
      .connect(otcBuyerSigner)
      .withdrawERC20fromStaker(contracts.balWethBpt.address, otcBuyerSigner, 1);
    expect(await contracts.balWethBpt.balanceOf(otcBuyerSigner)).to.be.eq(balanceBefore.add(2));
  });
});
