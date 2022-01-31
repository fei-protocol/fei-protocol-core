import { time, expectRevert, expectApprox, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { Core, Fei, GlobalRateLimitedMinter, MockMinter } from '@custom-types/contracts';
import { start } from 'repl';

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
  const addressRateLimitPerSecond = scale.mul(10_000);
  const bufferCap = scale.mul(100_000_000);
  const minterBufferCap = scale.mul(10_000_000);

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
    ).deploy(core.address, globalRateLimitPerSecond, bufferCap, addressRateLimitPerSecond, bufferCap.mul(10), false);

    authorizedMinter = await (await ethers.getContractFactory('MockMinter')).deploy(globalRateLimitedMinter.address);

    await core.connect(impersonatedSigners[governorAddress]).grantMinter(globalRateLimitedMinter.address);

    await globalRateLimitedMinter
      .connect(impersonatedSigners[governorAddress])
      .addMinter(authorizedMinter.address, addressRateLimitPerSecond, minterBufferCap);
  });

  describe('Mint', function () {
    describe('Full mint', function () {
      beforeEach(async function () {
        await authorizedMinter.mintFei(userAddress, minterBufferCap);
      });

      it('clears out buffer', async function () {
        expectApprox(await globalRateLimitedMinter.buffer(authorizedMinter.address), '0');
        expect(await fei.balanceOf(userAddress)).to.be.equal(minterBufferCap);
      });

      it('second mint reverts', async function () {
        await expectRevert(
          authorizedMinter.mintFei(userAddress, minterBufferCap),
          'AddressRateLimited: rate limit hit'
        );
      });

      it('time increase refreshes buffer', async function () {
        await time.increase(500);
        expectApprox(await globalRateLimitedMinter.buffer(authorizedMinter.address), minterBufferCap.div(2));
      });

      it('time increase refreshes buffer', async function () {
        await time.increase(1000);
        expectApprox(await globalRateLimitedMinter.buffer(authorizedMinter.address), minterBufferCap);
      });
    });

    describe('Partial Mint', function () {
      //   const mintAmount = '10000';
      //   beforeEach(async function () {
      //     await globalRateLimitedMinter.setDoPartialMint(true); // mock method
      //     await globalRateLimitedMinter.mint(userAddress, mintAmount);
      //   });
      //   it('partially clears out buffer', async function () {
      //     expectApprox(await globalRateLimitedMinter.buffer(), '10000');
      //     expect(await fei.balanceOf(userAddress)).to.be.equal(mintAmount);
      //   });
      //   it('second mint is partial', async function () {
      //     await globalRateLimitedMinter.mint(userAddress, bufferCap);
      //     expectApprox(await fei.balanceOf(userAddress), bufferCap);
      //     expectApprox(await globalRateLimitedMinter.buffer(), '0');
      //   });
      //   it('time increase refreshes buffer', async function () {
      //     await time.increase('1000');
      //     expectApprox(await globalRateLimitedMinter.buffer(), '11000');
      //   });
      // });
    });

    describe('Set Fei Limit Per Second', function () {
      it('governor succeeds', async function () {
        const startingBuffer = await globalRateLimitedMinter.buffer(authorizedMinter.address);
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .setRateLimitPerSecond(authorizedMinter.address, '10000');

        expect(await globalRateLimitedMinter.buffer(authorizedMinter.address)).to.be.equal(startingBuffer);
        expect(await globalRateLimitedMinter.rateLimitPerSecond(authorizedMinter.address)).to.be.equal(10000);
        expect(await globalRateLimitedMinter.currentMaximumGlobalFeiPerSecond()).to.be.equal(10000);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .setRateLimitPerSecond(authorizedMinter.address, '10000'),
          'CoreRef: Caller is not a governor'
        );
      });

      it('too high fei per second cap reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setRateLimitPerSecond(authorizedMinter.address, bufferCap.mul(2)),
          'GlobalRateLimitedMinter: max fei per second exceeded'
        );
      });

      it('too high fei rate reverts in global rate limited minter', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setRateLimitPerSecond(authorizedMinter.address, globalRateLimitPerSecond.mul(2)),
          'GlobalRateLimitedMinter: max fei per second exceeded'
        );
      });

      it('too high fei rate reverts in address rate limited minter', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setRateLimitPerSecond(authorizedMinter.address, addressRateLimitPerSecond.mul(2)),
          'AddressRateLimited: rateLimitPerSecond too high'
        );
      });
    });

    describe('Add Minter', function () {
      beforeEach(async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .removeMinter(authorizedMinter.address);
      });

      it('starting values are 0', async function () {
        expect(await globalRateLimitedMinter.buffer(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.bufferCap(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.rateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
      });

      it('governor succeeds and caps are correct', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .addMinter(authorizedMinter.address, addressRateLimitPerSecond, minterBufferCap);

        expect(await globalRateLimitedMinter.buffer(authorizedMinter.address)).to.be.equal(minterBufferCap);
        expect(await globalRateLimitedMinter.bufferCap(authorizedMinter.address)).to.be.equal(minterBufferCap);
        expect(await globalRateLimitedMinter.rateLimitPerSecond(authorizedMinter.address)).to.be.equal(
          addressRateLimitPerSecond
        );
      });

      it('fails when buffer cap is over address global max', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .addMinter(authorizedMinter.address, addressRateLimitPerSecond, minterBufferCap.mul(2)),
          'AddressRateLimited: new buffercap too high'
        );
      });

      it('fails when fei per second is over address global max', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .addMinter(authorizedMinter.address, addressRateLimitPerSecond.mul(2), minterBufferCap),
          'AddressRateLimited: new rateLimitPerSecond too high'
        );
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .addMinter(authorizedMinter.address, addressRateLimitPerSecond, minterBufferCap),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('Remove Minter', function () {
      it('governor succeeds and all caps are zero', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .removeMinter(authorizedMinter.address);

        expect(await globalRateLimitedMinter.rateLimitPerSecond(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.bufferCap(authorizedMinter.address)).to.be.equal(0);
        expect(await globalRateLimitedMinter.buffer(authorizedMinter.address)).to.be.equal(0);

        await expectRevert(
          authorizedMinter.mintFei(authorizedMinter.address, 1),
          'AddressRateLimited: no rate limit buffer'
        );
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).removeMinter(authorizedMinter.address),
          'CoreRef: Caller is not governor or guardian or admin'
        );
      });
    });

    describe('updateGlobalFeiPerSecond', function () {
      it('governor succeeds', async function () {
        const newFeiPerSecondCap = 10000;
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateGlobalFeiPerSecond(newFeiPerSecondCap);
        expect(await globalRateLimitedMinter.maximumGlobalFeiPerSecond()).to.be.equal(newFeiPerSecondCap);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateGlobalFeiPerSecond('10000'),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('Update Minter', function () {
      it('governor succeeds', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateMinter(authorizedMinter.address, addressRateLimitPerSecond.div(2), minterBufferCap.div(2));

        expect(await globalRateLimitedMinter.maximumGlobalFeiPerSecond()).to.be.equal(globalRateLimitPerSecond);
        expect(await globalRateLimitedMinter.maximumGlobalBufferCap()).to.be.equal(bufferCap);

        expect(await globalRateLimitedMinter.currentMaximumGlobalBufferCap()).to.be.equal(minterBufferCap.div(2));
        expect(await globalRateLimitedMinter.currentMaximumGlobalFeiPerSecond()).to.be.equal(
          addressRateLimitPerSecond.div(2)
        );
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .updateMinter(authorizedMinter.address, 0, 0),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('updateGlobalFeiBufferCap', function () {
      it('governor succeeds', async function () {
        const newBufferCap = 10000;
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .updateGlobalFeiBufferCap(newBufferCap);
        expect(await globalRateLimitedMinter.maximumGlobalBufferCap()).to.be.equal(newBufferCap);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter.connect(impersonatedSigners[userAddress]).updateGlobalFeiBufferCap('10000'),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });
    });

    describe('Set Minting Buffer Cap', function () {
      it('governor succeeds', async function () {
        await globalRateLimitedMinter
          .connect(impersonatedSigners[governorAddress])
          .connect(impersonatedSigners[governorAddress])
          .setBufferCap(authorizedMinter.address, '10000', {});
        expect(await globalRateLimitedMinter.buffer(authorizedMinter.address)).to.be.equal(toBN('10000'));
        expect(await globalRateLimitedMinter.bufferCap(authorizedMinter.address)).to.be.equal(toBN('10000'));
        expect(await globalRateLimitedMinter.currentMaximumGlobalBufferCap()).to.be.equal(toBN('10000'));
      });

      it('too high fei buffer cap reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[governorAddress])
            .setBufferCap(authorizedMinter.address, bufferCap.mul(2)),
          'GlobalRateLimitedMinter: max fei buffer cap exceeded'
        );
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          globalRateLimitedMinter
            .connect(impersonatedSigners[userAddress])
            .setBufferCap(authorizedMinter.address, '10000'),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });
});
