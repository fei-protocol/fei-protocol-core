import { time, expectRevert, expectApprox, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
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
    ).deploy(core.address, globalRateLimitPerSecond, bufferCap, bufferCap, bufferCap, false);

    authorizedMinter = await (await ethers.getContractFactory('MockMinter')).deploy(globalRateLimitedMinter.address);

    await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

    await globalRateLimitedMinter
      .connect(impersonatedSigners[governorAddress])
      .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);
  });

  describe('Mint', function () {
    describe('Full mint', function () {
      beforeEach(async function () {
        await authorizedMinter.mintFei(userAddress, bufferCap);
      });

      it('clears out buffer', async function () {
        expectApprox(await globalRateLimitedMinter['buffer(address)'](authorizedMinter.address), '0');
        expect(await fei.balanceOf(userAddress)).to.be.equal(bufferCap);
      });

      it('second mint reverts', async function () {
        await expectRevert(authorizedMinter.mintFei(userAddress, bufferCap), 'RateLimited: rate limit hit');
      });

      it('time increase refreshes buffer', async function () {
        await time.increase(500);
        expectApprox(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address), bufferCap.div(2));
      });

      it('time increase refreshes buffer', async function () {
        await time.increase(1000);
        expectApprox(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address), bufferCap);
      });
    });

    describe('Partial Mint', function () {
      const mintAmount = '10000';

      beforeEach(async function () {
        globalRateLimitedMinter = await (
          await ethers.getContractFactory('GlobalRateLimitedMinter')
        ).deploy(core.address, globalRateLimitPerSecond, bufferCap, bufferCap, bufferCap, true);

        authorizedMinter = await (
          await ethers.getContractFactory('MockMinter')
        ).deploy(globalRateLimitedMinter.address);

        await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);

        await authorizedMinter.mintFei(userAddress, mintAmount);
      });

      it('partially clears out buffer', async function () {
        expectApprox(await globalRateLimitedMinter['buffer(address)'](authorizedMinter.address), bufferCap);
        expect(await fei.balanceOf(userAddress)).to.be.equal(mintAmount);
      });

      it('second mint is partial', async function () {
        await authorizedMinter.mintFei(userAddress, bufferCap.mul(2));
        expectApprox(await fei.balanceOf(userAddress), bufferCap);
        expectApprox(await globalRateLimitedMinter['buffer(address)'](authorizedMinter.address), '0');
      });

      it('time increase refreshes buffer', async function () {
        await time.increase('1000');
        expectApprox(
          await globalRateLimitedMinter['buffer(address)'](authorizedMinter.address),
          bufferCap.sub(mintAmount)
        );
      });
    });

    describe('Set Fei Limit Per Second', function () {
      it('governor succeeds', async function () {
        const startingBuffer = await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address);
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .setIndividualRateLimitPerSecond(authorizedMinter.address, '10000');

        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(startingBuffer);
        expect(await globalRateLimitedMinter.individualRateLimitPerSecond(authorizedMinter.address)).to.be.equal(10000);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .setIndividualRateLimitPerSecond(authorizedMinter.address, '10000'),
          'CoreRef: Caller is not a governor'
        );
      });

      it('too high fei per second cap reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setIndividualRateLimitPerSecond(authorizedMinter.address, globalRateLimitPerSecond.mul(2)),
          'MultiRateLimited: rateLimitPerSecond too high'
        );
      });

      it('too high fei rate reverts in global rate limited minter', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setIndividualRateLimitPerSecond(authorizedMinter.address, globalRateLimitPerSecond.mul(2)),
          'MultiRateLimited: rateLimitPerSecond too high'
        );
      });

      it('too high fei rate reverts in address rate limited minter', async function () {
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
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.individualRateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
      });

      it('governor succeeds and caps are correct', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .addAddress(authorizedMinter.address, globalRateLimitPerSecond, bufferCap);

        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(bufferCap);
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(bufferCap);
        expect(await globalRateLimitedMinter.individualRateLimitPerSecond(authorizedMinter.address)).to.be.equal(
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

        expect(await globalRateLimitedMinter.individualRateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(0);

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
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .updateAddress(authorizedMinter.address, 0, 0),
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

        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(toBN('10000'));
        expect(await globalRateLimitedMinter.individualBufferCap(authorizedMinter.address)).to.be.equal(toBN('10000'));
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
});
