import { expectRevert, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer, utils } from 'ethers';
import { Core, Fei, GlobalRateLimitedMinter, MockMinter } from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;
const scale = ethers.constants.WeiPerEther;

describe('GlobalRateLimitedMinterGovernor', function () {
  let userAddress;
  let governorAddress;
  let globalRateLimitedMinter: GlobalRateLimitedMinter;
  let authorizedMinter: MockMinter;
  let core: Core;
  let fei: Fei;

  const ADD_MINTER_ROLE = keccak256(utils.toUtf8Bytes('ADD_MINTER_ROLE'));
  const GOVERN_ROLE = keccak256(utils.toUtf8Bytes('GOVERN_ROLE'));

  const globalRateLimitPerSecond = scale.mul(100_000);
  const maxRateLimitPerSecond = globalRateLimitPerSecond.div(10);
  const bufferCap = scale.mul(100_000_000);
  const maxBufferCap = bufferCap.div(10);

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());

    core = await getCore();

    fei = await ethers.getContractAt('Fei', await core.fei());

    globalRateLimitedMinter = await (
      await ethers.getContractFactory('GlobalRateLimitedMinter')
    ).deploy(
      core.address,
      globalRateLimitPerSecond,
      globalRateLimitPerSecond,
      maxRateLimitPerSecond,
      maxBufferCap,
      bufferCap,
      false
    );

    authorizedMinter = await (await ethers.getContractFactory('MockMinter')).deploy(globalRateLimitedMinter.address);

    await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

    await globalRateLimitedMinter
      .connect(impersonatedSigners[governorAddress])
      .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);
  });

  describe('Set Fei Limit Per Second', function () {
    it('governor succeeds', async function () {
      const startingBuffer = await globalRateLimitedMinter.getBufferCap(authorizedMinter.address);
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .setIndividualRateLimitPerSecond(authorizedMinter.address, '10000');

      expect(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address)).to.be.equal(startingBuffer);
      expect(await globalRateLimitedMinter.getRateLimitPerSecond(authorizedMinter.address)).to.be.equal(10000);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[userAddress])
          .setIndividualRateLimitPerSecond(authorizedMinter.address, '10000'),
        'CoreRef: Caller is not a governor'
      );
    });

    it('fei per second above global rateLimitPerSecond cap reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .setIndividualRateLimitPerSecond(authorizedMinter.address, globalRateLimitPerSecond.mul(2)),
        'MultiRateLimited: rateLimitPerSecond too high'
      );
    });
  });

  describe('Add Minter', function () {
    beforeEach(async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .removeAddress(authorizedMinter.address);
    });

    it('starting values are 0', async function () {
      expect(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address)).to.be.equal(0);
      expect(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address)).to.be.equal(0);
      expect(await globalRateLimitedMinter.getRateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
    });

    it('governor succeeds and caps are correct', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);

      expect(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address)).to.be.equal(bufferCap);
      expect(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address)).to.be.equal(bufferCap);
      expect(await globalRateLimitedMinter.getRateLimitPerSecond(authorizedMinter.address)).to.be.equal(
        globalRateLimitPerSecond
      );
    });

    it('fails when buffer cap is over global max', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap.mul(2)),
        'MultiRateLimited: new buffercap too high'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[userAddress])
          .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Non governor actions', function () {
    describe('Add Minter', function () {
      beforeEach(async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .removeAddress(authorizedMinter.address);

        await core.createRole(ADD_MINTER_ROLE, GOVERN_ROLE);
        await core.grantRole(ADD_MINTER_ROLE, governorAddress);
      });

      it('cannot add the same address twice', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .addAddressWithCaps(authorizedMinter.address);

        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .addAddressWithCaps(authorizedMinter.address),
          'MultiRateLimited: address already added'
        );
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .addAddressWithCaps(authorizedMinter.address),
          'UNAUTHORIZED'
        );
      });
    });
  });

  describe('Remove Minter', function () {
    it('governor succeeds and all caps are zero', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .removeAddress(authorizedMinter.address);

      expect(await globalRateLimitedMinter.getRateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
      expect(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address)).to.be.equal(0);

      await expectRevert(
        authorizedMinter.mintFei(authorizedMinter.address, 1),
        'MultiRateLimited: no rate limit buffer'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).removeAddress(authorizedMinter.address),
        'CoreRef: Caller is not a guardian or governor'
      );
    });
  });

  describe('Update Minter Address', function () {
    it('governor succeeds', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateAddress(authorizedMinter.address, maxRateLimitPerSecond, maxBufferCap);
    });

    it('governor fails when new limit is over buffer cap', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateAddress(authorizedMinter.address, maxRateLimitPerSecond, bufferCap.add(1)),
        'MultiRateLimited: buffercap too high'
      );
    });

    it('governor fails when new limit is over max rate limit per second', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateAddress(authorizedMinter.address, globalRateLimitPerSecond.add(1), maxBufferCap),
        'MultiRateLimited: rateLimitPerSecond too high'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateAddress(authorizedMinter.address, 0, 0),
        'UNAUTHORIZED'
      );
    });
  });

  describe('Update Address With Caps', function () {
    beforeEach(async () => {
      await core.createRole(ADD_MINTER_ROLE, GOVERN_ROLE);
      await core.grantRole(ADD_MINTER_ROLE, governorAddress);
    });

    it('minor minter add role succeeds', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateAddress(authorizedMinter.address, maxRateLimitPerSecond, maxBufferCap);

      const { bufferCap, bufferStored, rateLimitPerSecond } = await globalRateLimitedMinter.rateLimitPerAddress(
        authorizedMinter.address
      );

      expect(rateLimitPerSecond).to.be.equal(maxRateLimitPerSecond);
      expect(bufferStored).to.be.equal(maxBufferCap);
      expect(bufferCap).to.be.equal(maxBufferCap);
    });

    it('minor minter add role fails when new limit is over buffer cap', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateAddress(authorizedMinter.address, maxRateLimitPerSecond, bufferCap.add(1)),
        'MultiRateLimited: max buffer cap exceeds non governor allowable amount'
      );
    });

    it('minor minter add role fails when new limit is over max rate limit per second', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateAddress(authorizedMinter.address, globalRateLimitPerSecond.add(1), maxBufferCap),
        'MultiRateLimited: rate limit per second exceeds non governor allowable amount'
      );
    });

    it('unauthorized reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateAddress(authorizedMinter.address, 0, 0),
        'UNAUTHORIZED'
      );
    });
  });

  describe('setBufferCap', function () {
    it('governor succeeds', async function () {
      const newBufferCap = 10000;
      await globalRateLimitedMinter.connect(impersonatedSigners[governorAddress]).setBufferCap(newBufferCap);

      expect(await globalRateLimitedMinter.bufferCap()).to.be.equal(newBufferCap);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).setBufferCap('10000'),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('updateMaxBufferCap', function () {
    it('governor succeeds', async function () {
      const newRateLimitPerSecond = 10000;
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateMaxBufferCap(newRateLimitPerSecond);

      expect(await globalRateLimitedMinter.maxBufferCap()).to.be.equal(newRateLimitPerSecond);
    });

    it('governor fails when new buffer cap is over global max', async function () {
      const newBufferCap = bufferCap.add(1);
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[governorAddress]).updateMaxBufferCap(newBufferCap),
        'MultiRateLimited: exceeds global buffer cap'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateMaxBufferCap('10000'),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('updateMaxRateLimitPerSecond', function () {
    it('governor succeeds', async function () {
      const newRateLimitPerSecond = 10000;
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateMaxRateLimitPerSecond(newRateLimitPerSecond);

      expect(await globalRateLimitedMinter.maxRateLimitPerSecond()).to.be.equal(newRateLimitPerSecond);
    });

    it('governor fails when over global max rate limit per second', async function () {
      const newRateLimitPerSecond = globalRateLimitPerSecond.add(1);
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateMaxRateLimitPerSecond(newRateLimitPerSecond),
        'MultiRateLimited: exceeds global max rate limit per second'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateMaxRateLimitPerSecond('10000'),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Set Individual Minting Buffer Cap', function () {
    it('governor succeeds', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .connect(impersonatedSigners[governorAddress])
        .setIndividualBufferCap(authorizedMinter.address, '10000', {});

      expect(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address)).to.be.equal(toBN('10000'));
      expect(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address)).to.be.equal(toBN('10000'));
    });

    it('too high fei buffer cap reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .setIndividualBufferCap(authorizedMinter.address, bufferCap.mul(2)),
        'MultiRateLimited: new buffer cap is over global max'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[userAddress])
          .setIndividualBufferCap(authorizedMinter.address, '10000'),
        'CoreRef: Caller is not a governor'
      );
    });
  });
});
