import { expectApprox, expectRevert, getAddresses, getCore, time, ZERO_ADDRESS } from '@test/helpers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

describe('FeiTimedMinter', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.secondUserAddress
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, secondUserAddress, governorAddress } = await getAddresses());

    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());

    this.incentive = '100';
    this.frequency = '3600';
    this.intialMintAmount = '10000';
    this.feiMinter = await (
      await ethers.getContractFactory('FeiTimedMinter')
    ).deploy(this.core.address, userAddress, this.incentive, this.frequency, this.intialMintAmount);

    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.feiMinter.address);
  });

  describe('Mint', function () {
    it('paued reverts', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).pause();
      await expectRevert(this.feiMinter.connect(impersonatedSigners[userAddress]).mint(), 'Pausable: paused');
    });

    it('before time reverts', async function () {
      await expectRevert(this.feiMinter.connect(impersonatedSigners[userAddress]).mint(), 'Timed: time not ended');
    });

    it('after time succeeds', async function () {
      await time.increase(this.frequency);
      await time.increase(this.frequency);
      await this.feiMinter.connect(impersonatedSigners[secondUserAddress]).mint();

      // timer reset
      expectApprox(await this.feiMinter.remainingTime(), this.frequency);

      // mint sent
      expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.intialMintAmount);

      // incentive for caller
      expect(await this.fei.balanceOf(secondUserAddress)).to.be.equal(this.incentive);
    });
  });

  describe('Set Target', function () {
    it('governor succeeds', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).setTarget(secondUserAddress);
      expect((await this.feiMinter.target()).toString()).to.be.equal(secondUserAddress);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[userAddress]).setTarget(secondUserAddress),
        'CoreRef: Caller is not a governor'
      );
    });

    it('zero address reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setTarget(ZERO_ADDRESS),
        'FeiTimedMinter: zero address'
      );
    });
  });

  describe('Set Mint Amount', function () {
    it('governor succeeds', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).setMintAmount('500');
      expect(await this.feiMinter.mintAmount()).to.be.equal('500');
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[userAddress]).setMintAmount('500'),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Set Frequency', function () {
    it('governor succeeds', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).setFrequency('5000');
      expect(await this.feiMinter.duration()).to.be.equal('5000');
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[userAddress]).setFrequency('5000'),
        'CoreRef: Caller is not a governor'
      );
    });

    it('below min reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setFrequency('500'),
        'FeiTimedMinter: frequency low'
      );
    });

    it('above max reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setFrequency('5000000'),
        'FeiTimedMinter: frequency high'
      );
    });
  });
});
