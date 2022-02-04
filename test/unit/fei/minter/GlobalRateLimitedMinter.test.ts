import { time, expectRevert, expectApprox, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Contract, Signer } from 'ethers';
import { Core, Fei, GlobalRateLimitedMinter, MockMinter } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;
const scale = ethers.constants.WeiPerEther;

describe('GlobalglobalRateLimitedMinter', function () {
  let userAddress;
  let governorAddress;
  let globalRateLimitedMinter: GlobalRateLimitedMinter;
  let authorizedMinter: MockMinter;
  let core: Core;
  let fei: Fei;
  const globalRateLimitPerSecond = scale.mul(100_000);
  const bufferCap = scale.mul(100_000_000);

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
    ).deploy(core.address, globalRateLimitPerSecond, globalRateLimitPerSecond, bufferCap, false);

    authorizedMinter = await (await ethers.getContractFactory('MockMinter')).deploy(globalRateLimitedMinter.address);

    await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

    await globalRateLimitedMinter
      .connect(impersonatedSigners[governorAddress])
      .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);
  });

  describe('Init', function () {
    it('buffercap is correct on individual minter', async function () {
      expect((await globalRateLimitedMinter.rateLimitPerAddress(authorizedMinter.address)).bufferCap).to.be.equal(
        bufferCap
      );
    });

    it('rateLimitPerSecond is correctly initialized on individual minter', async function () {
      expect(
        (await globalRateLimitedMinter.rateLimitPerAddress(authorizedMinter.address)).rateLimitPerSecond
      ).to.be.equal(globalRateLimitPerSecond);
    });

    it('lastBufferUsedTime is not 0 individual minter', async function () {
      expect(
        (await globalRateLimitedMinter.rateLimitPerAddress(authorizedMinter.address)).lastBufferUsedTime
      ).to.not.be.equal(0);
    });

    it('bufferStored is correctly initialized on individual minter', async function () {
      expect((await globalRateLimitedMinter.rateLimitPerAddress(authorizedMinter.address)).bufferStored).to.be.equal(
        bufferCap
      );
    });
  });

  describe('Mint', function () {
    describe('Full mint', function () {
      beforeEach(async function () {
        await authorizedMinter.mintFei(userAddress, bufferCap);
      });

      it('clears out buffer', async function () {
        expectApprox(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address), '0');
        expect(await fei.balanceOf(userAddress)).to.be.equal(bufferCap);
      });

      it('second mint reverts', async function () {
        await expectRevert(authorizedMinter.mintFei(userAddress, bufferCap), 'RateLimited: rate limit hit');
      });

      it('mint fails when user has no buffer or allocation in the system', async function () {
        const { lastBufferUsedTime, bufferCap, rateLimitPerSecond, bufferStored } =
          await globalRateLimitedMinter.rateLimitPerAddress(userAddress);

        expect(lastBufferUsedTime).to.be.equal(0);
        expect(bufferCap).to.be.equal(0);
        expect(rateLimitPerSecond).to.be.equal(0);
        expect(bufferStored).to.be.equal(0);

        await expectRevert(
          globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).mintFei(userAddress, 100),
          'MultiRateLimited: no rate limit buffer'
        );
      });
    });

    it('time increase refreshes buffer', async function () {
      await time.increase(500);
      expectApprox(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address), bufferCap.div(2));
    });

    it('time increase refreshes buffer', async function () {
      await time.increase(1000);
      expectApprox(await globalRateLimitedMinter.getBufferCap(authorizedMinter.address), bufferCap);
    });
  });

  describe('Second Minter', function () {
    let secondAuthorizedMinter: MockMinter;

    beforeEach(async function () {
      secondAuthorizedMinter = await (
        await ethers.getContractFactory('MockMinter')
      ).deploy(globalRateLimitedMinter.address);

      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .addAddress(secondAuthorizedMinter.address, globalRateLimitPerSecond, bufferCap);
    });

    it('second minter mints successfully and depletes global buffer', async function () {
      const startingUserFeiBalance = await fei.balanceOf(userAddress);
      await secondAuthorizedMinter.mintFei(userAddress, await globalRateLimitedMinter.buffer());
      const endingUserFeiBalance = await fei.balanceOf(userAddress);

      expect(endingUserFeiBalance.sub(startingUserFeiBalance)).to.be.equal(await globalRateLimitedMinter.bufferCap());
    });

    it('first and second minter mints successfully and depletes their and global buffers', async function () {
      const globalBuffer = await globalRateLimitedMinter.buffer();
      const mintAmount = globalBuffer.div(2);

      await authorizedMinter.mintFei(userAddress, mintAmount);
      await secondAuthorizedMinter.mintFei(userAddress, mintAmount);

      /// expect individual buffers to be 50% depleted + 2 seconds of replenishment for the first minter
      expect((await globalRateLimitedMinter.individualBuffer(secondAuthorizedMinter.address)).mul(2)).to.be.equal(
        bufferCap
      );
      expect((await globalRateLimitedMinter.individualBuffer(authorizedMinter.address)).mul(2)).to.be.equal(
        bufferCap.add(globalRateLimitPerSecond.mul(2))
      );

      /// one second has passed so buffer has replenished a tiny bit
      expect(await globalRateLimitedMinter.buffer()).to.be.equal(globalRateLimitPerSecond);

      /// assert that the first minter minted 1 second before the 2nd
      expect(
        (await globalRateLimitedMinter.rateLimitPerAddress(secondAuthorizedMinter.address)).lastBufferUsedTime -
          (await globalRateLimitedMinter.rateLimitPerAddress(authorizedMinter.address)).lastBufferUsedTime
      ).to.be.equal(1);

      /// assert that the second minter updated the global buffer last used time correctly
      expect(
        (await globalRateLimitedMinter.rateLimitPerAddress(secondAuthorizedMinter.address)).lastBufferUsedTime
      ).to.be.equal(await globalRateLimitedMinter.lastBufferUsedTime());
    });

    it('second minter mint fails as global buffer is depleted', async function () {
      const remainingGlobalBuffer = await globalRateLimitedMinter.buffer();
      await authorizedMinter.mintFei(userAddress, remainingGlobalBuffer);
      await expectRevert(
        secondAuthorizedMinter.mintFei(userAddress, remainingGlobalBuffer),
        'RateLimited: rate limit hit'
      );
    });
  });

  describe('Partial Mint', function () {
    const mintAmount = '10000';

    beforeEach(async function () {
      globalRateLimitedMinter = await (
        await ethers.getContractFactory('GlobalRateLimitedMinter')
      ).deploy(core.address, globalRateLimitPerSecond, globalRateLimitPerSecond, bufferCap, true);

      authorizedMinter = await (await ethers.getContractFactory('MockMinter')).deploy(globalRateLimitedMinter.address);

      await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);

      await authorizedMinter.mintFei(userAddress, mintAmount);
    });

    it('partially clears out buffer', async function () {
      expectApprox(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address), bufferCap);
      expect(await fei.balanceOf(userAddress)).to.be.equal(mintAmount);
    });

    it('second mint is partial', async function () {
      await authorizedMinter.mintFei(userAddress, bufferCap.mul(2));
      expectApprox(await fei.balanceOf(userAddress), bufferCap);
      expectApprox(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address), '0');
    });

    it('time increase refreshes buffer', async function () {
      await time.increase('1000');
      expectApprox(await globalRateLimitedMinter.individualBuffer(authorizedMinter.address), bufferCap.sub(mintAmount));
    });
  });

  describe('Multi Rate Limit Buffer Exhaustion', function () {
    const newRateLimitPerSecond = globalRateLimitPerSecond.div(10);
    const newBufferCap = bufferCap.div(10);

    beforeEach(async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateAddress(authorizedMinter.address, newRateLimitPerSecond, newBufferCap);

      // clear the whole buffer out
      await authorizedMinter.mintFei(userAddress, newBufferCap);
    });

    it('time increase partially replenishes buffer and mint fails due to MultiRateLimit', async function () {
      /// only refresh the buffer 10%
      await time.increase('100');
      await expectRevert(authorizedMinter.mintFei(userAddress, newBufferCap), 'MultiRateLimited: rate limit hit');
    });
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
        'CoreRef: Caller is not a governor or contract admin'
      );
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
        'CoreRef: Caller is not governor or guardian or admin'
      );
    });
  });

  describe('Update Minter Address', function () {
    it('governor succeeds', async function () {
      await globalRateLimitedMinter
        .connect(impersonatedSigners[governorAddress])
        .updateAddress(authorizedMinter.address, globalRateLimitPerSecond.div(2), bufferCap.div(2));
    });

    it('governor fails when new limit is over buffer cap', async function () {
      await expectRevert(
        globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateAddress(authorizedMinter.address, globalRateLimitPerSecond.div(2), bufferCap.add(1)),
        'MultiRateLimited: buffercap too high'
      );
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateAddress(authorizedMinter.address, 0, 0),
        'CoreRef: Caller is not a governor or contract admin'
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
        'CoreRef: Caller is not a governor or contract admin'
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
