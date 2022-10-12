import { VeBalHelper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { forceEth } from '../setup/utils';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-veBalHelper-setters', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let vebalOtcHelper: Contract;
  let otcBuyerAddress: string;
  let otcBuyerSigner: SignerWithAddress;

  let balWethBPTWhaleSigner: SignerWithAddress;
  const balWethBPTWhale = '0xC128a9954e6c874eA3d62ce62B468bA073093F25';

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
    await forceEth(otcBuyerAddress);
    otcBuyerSigner = await getImpersonatedSigner(otcBuyerAddress);

    balWethBPTWhaleSigner = await getImpersonatedSigner(balWethBPTWhale);
    await forceEth(balWethBPTWhale);
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

  it('all priviledged functions protected by onlyOwner should reject non-owner address calls', async () => {
    const fakeOwner = ethers.constants.AddressZero;
    const fakeOwnerSigner = await getImpersonatedSigner(fakeOwner);

    const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

    // setSpaceId
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).setSpaceId(ethers.constants.HashZero)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // setDelegate
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).setDelegate(ADDRESS_ONE)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // clearDelegate
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).clearDelegate()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // setLockDuration
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).setLockDuration(5)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // lock
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).lock()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // exitLock
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).exitLock()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // setGaugeController
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).setGaugeController(ADDRESS_ONE)).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // voteForGaugeWeight
    await expect(
      contracts.vebalOtcHelper
        .connect(fakeOwnerSigner)
        .voteForGaugeWeight(contractAddresses.dai, contractAddresses.weth, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // stakeInGauge
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).stakeInGauge(contractAddresses.dai, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // stakeAllInGauge
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).stakeAllInGauge(contractAddresses.dai)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // unstakeFromGauge
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).unstakeFromGauge(contractAddresses.dai, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // setBalancerMinter
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).setBalancerMinter(contractAddresses.dai)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // transferBalancerStakerOwnership
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).transferBalancerStakerOwnership(contractAddresses.dai)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // setVotingEscrowDelegation
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).setVotingEscrowDelegation(contractAddresses.dai)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // create_boost
    await expect(
      contracts.vebalOtcHelper
        .connect(fakeOwnerSigner)
        .create_boost(contractAddresses.dai, contractAddresses.weth, '500', '10', '20', '0')
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // extend_boost
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).extend_boost('0', '500', '10', '20')
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // cancel_boost
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).cancel_boost('0')).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // burn
    await expect(contracts.vebalOtcHelper.connect(fakeOwnerSigner).burn('0')).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );

    // withdrawERC20
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).withdrawERC20(contractAddresses.dai, contractAddresses.weth, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // withdrawETH
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).withdrawETH(contractAddresses.dai, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // withdrawERC20fromStaker
    await expect(
      contracts.vebalOtcHelper
        .connect(fakeOwnerSigner)
        .withdrawERC20fromStaker(contractAddresses.dai, contractAddresses.weth, 5)
    ).to.be.revertedWith('Ownable: caller is not the owner');

    // withdrawETHfromStaker
    await expect(
      contracts.vebalOtcHelper.connect(fakeOwnerSigner).withdrawETHfromStaker(contractAddresses.dai, 5)
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
      expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(contractAddresses.aaveCompaniesMultisig);
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

    it('should be able to setVotingEscrowDelegation()', async () => {
      const newDelegation = contractAddresses.dai;
      await vebalOtcHelper.connect(otcBuyerSigner).setVotingEscrowDelegation(newDelegation);
      expect(await contracts.balancerGaugeStaker.votingEscrowDelegation()).to.equal(newDelegation);
    });

    it('should be able to transferBalancerStakerOwnership()', async () => {
      const newOwner = contractAddresses.dai;
      await vebalOtcHelper.connect(otcBuyerSigner).transferBalancerStakerOwnership(newOwner);
      expect(await contracts.balancerGaugeStaker.owner()).to.equal(newOwner);
    });
  });
});
