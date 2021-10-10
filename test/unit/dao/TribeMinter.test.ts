import { expectRevert, getAddresses, getCore, getImpersonatedSigner, increaseTime } from '../../helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { Core, Tribe, TribeMinter } from '@custom-types/contracts';
import chai from 'chai';
import CBN from 'chai-bn';
const toBN = ethers.BigNumber.from;

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

describe('TribeMinter', function () {
  let userAddress: string;
  let governorAddress: string;
  let core: Core;
  let tribe: Tribe;
  let tribeMinter: TribeMinter;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());
    core = await getCore();

    tribe = await ethers.getContractAt('Tribe', await core.tribe());

    tribeMinter = await (
      await ethers.getContractFactory('TribeMinter')
    ).deploy(
      core.address,
      '1000', // 10% inflation cap
      governorAddress,
      [] // no additional lockedTribeAddresses
    );

    await tribe.connect(impersonatedSigners[governorAddress]).setMinter(tribeMinter.address);
  });

  describe('Init', function () {
    it('annualMaxInflationBasisPoints', async function () {
      expect(await tribeMinter.annualMaxInflationBasisPoints()).to.be.bignumber.equal(toBN('1000'));
    });

    it('owner', async function () {
      expect(await tribeMinter.owner()).to.be.equal(governorAddress);
    });

    it('bufferCap', async function () {
      const bufferCap = await tribeMinter.bufferCap();
      expect(bufferCap).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul(100_000_000));
      expect(bufferCap).to.be.bignumber.equal(await tribeMinter.idealBufferCap());
      expect(bufferCap).to.be.bignumber.equal(await tribeMinter.buffer());
    });

    it('isPokeNeeded', async function () {
      expect(await tribeMinter.isPokeNeeded()).to.be.false;
    });

    it('rateLimitPerSecond', async function () {
      expect(await tribeMinter.rateLimitPerSecond()).to.be.bignumber.equal(
        ethers.constants.WeiPerEther.mul(100_000_000).div(31_557_600)
      );
    });

    it('tribeCirculatingSupply', async function () {
      expect(await tribeMinter.tribeCirculatingSupply()).to.be.bignumber.equal(await tribe.totalSupply());
      expect(await tribeMinter.totalSupply()).to.be.bignumber.equal(await tribe.totalSupply());
    });

    it('lockedTribeAddresses', async function () {
      const lockedAddresses = await tribeMinter.lockedTribeAddresses();
      expect(lockedAddresses.length).to.be.equal(1);
      expect(lockedAddresses[0]).to.be.equal(tribeMinter.address);
    });
  });

  describe('Poke', function () {
    let mintAmount;
    let inflationIncrement;

    beforeEach(async function () {
      mintAmount = ethers.constants.WeiPerEther.mul(10_000);

      // set the inflation increment to 10% of the mintAmount because that is the annualMaxInflation
      inflationIncrement = mintAmount.div(10);
    });

    describe('Increase Supply', function () {
      beforeEach(async function () {
        await tribeMinter.connect(impersonatedSigners[governorAddress]).mint(userAddress, mintAmount);

        // Increase time to refill the buffer
        await increaseTime(10000000);
      });

      it('increases rate limit', async function () {
        const bufferCapBefore = await tribeMinter.bufferCap();

        expect(await tribeMinter.isPokeNeeded()).to.be.true;
        const tx = await tribeMinter.poke();

        // Check the events, particularly that the buffer is used by the increase
        expect(tx).to.emit(tribeMinter, 'BufferUsed').withArgs(inflationIncrement, bufferCapBefore);

        // To get rate limit per second divide by 365.25 days in seconds
        expect(tx)
          .to.emit(tribeMinter, 'RateLimitPerSecondUpdate')
          .withArgs(bufferCapBefore.div(31_557_600), bufferCapBefore.add(inflationIncrement).div(31_557_600));
        expect(tx)
          .to.emit(tribeMinter, 'BufferCapUpdate')
          .withArgs(bufferCapBefore, bufferCapBefore.add(inflationIncrement));

        expect(await tribeMinter.isPokeNeeded()).to.be.false;
      });
    });

    describe('Decrease Supply', function () {
      beforeEach(async function () {
        // Transferring TRIBE to user address and setting it to locked effectively decreases circulating supply
        await core.connect(impersonatedSigners[governorAddress]).allocateTribe(userAddress, mintAmount);
        await tribeMinter.connect(impersonatedSigners[governorAddress]).addLockedTribeAddress(userAddress);
      });

      it('decreases rate limit', async function () {
        const bufferCapBefore = await tribeMinter.bufferCap();

        expect(await tribeMinter.isPokeNeeded()).to.be.true;

        const tx = await tribeMinter.poke();

        // Check the events, particularly that no buffer is used
        expect(tx).to.not.emit(tribeMinter, 'BufferUsed');

        // To get rate limit per second divide by 365.25 days in seconds
        expect(tx)
          .to.emit(tribeMinter, 'RateLimitPerSecondUpdate')
          .withArgs(bufferCapBefore.div(31_557_600), bufferCapBefore.sub(inflationIncrement).div(31_557_600));
        expect(tx)
          .to.emit(tribeMinter, 'BufferCapUpdate')
          .withArgs(bufferCapBefore, bufferCapBefore.sub(inflationIncrement));

        expect(await tribeMinter.isPokeNeeded()).to.be.false;
      });
    });

    describe('No Change', function () {
      it('reverts', async function () {
        expect(await tribeMinter.isPokeNeeded()).to.be.false;
        await expectRevert(tribeMinter.poke(), 'TribeMinter: No rate limit change needed');
      });
    });
  });

  describe('Mint', function () {
    let mintAmount;
    beforeEach(async function () {
      mintAmount = ethers.constants.WeiPerEther.mul(10_000);
    });

    describe('Access', function () {
      it('governor succeeds', async function () {
        const bufferCap = await tribeMinter.bufferCap();

        // Check that minting uses up the rate limit buffer
        expect(await tribeMinter.connect(impersonatedSigners[governorAddress]).mint(userAddress, mintAmount))
          .to.emit(tribeMinter, 'BufferUsed')
          .withArgs(mintAmount, bufferCap.sub(mintAmount));
        expect(await tribe.balanceOf(userAddress)).to.be.equal(mintAmount);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          tribeMinter.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount),
          'CoreRef: Caller is not a governor'
        );
      });
    });

    describe('No Held TRIBE', function () {
      it('mints all TRIBE', async function () {
        // If the deposit holds no TRIBE, 100% of the mint should be truly minted
        expect(await tribe.balanceOf(tribeMinter.address)).to.be.equal(toBN('0'));
        expect(await tribe.balanceOf(userAddress)).to.be.equal(toBN('0'));

        await tribeMinter.connect(impersonatedSigners[governorAddress]).mint(userAddress, mintAmount);

        expect(await tribe.balanceOf(tribeMinter.address)).to.be.equal(toBN('0'));
        expect(await tribe.balanceOf(userAddress)).to.be.equal(toBN(mintAmount));
      });
    });

    describe('Some Held TRIBE', function () {
      beforeEach(async function () {
        await tribeMinter.connect(impersonatedSigners[governorAddress]).mint(tribeMinter.address, mintAmount);
        expect(await tribe.balanceOf(tribeMinter.address)).to.be.equal(mintAmount);
      });

      it('mints some TRIBE', async function () {
        // If the deposit holds some TRIBE, it should transfer that TRIBE before minting
        expect(await tribe.balanceOf(userAddress)).to.be.equal(toBN('0'));
        await tribeMinter.connect(impersonatedSigners[governorAddress]).mint(userAddress, mintAmount.mul(2));
        expect(await tribe.balanceOf(tribeMinter.address)).to.be.equal(toBN('0'));
        expect(await tribe.balanceOf(userAddress)).to.be.equal(mintAmount.mul(2));
      });
    });
  });

  describe('Set Minter', function () {
    it('governor succeeds', async function () {
      await tribeMinter.connect(impersonatedSigners[governorAddress]).setMinter(userAddress);
      expect(await tribe.minter()).to.be.equal(userAddress);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        tribeMinter.connect(impersonatedSigners[userAddress]).setMinter(userAddress),
        'Ownable: caller is not the owner'
      );
    });
  });

  describe('Add Locked Tribe Address', function () {
    it('governor succeeds', async function () {
      const signer = impersonatedSigners[governorAddress];

      // First mint some TRIBE to check if it is excluded later
      const mintAmount = ethers.constants.WeiPerEther.mul(10_000);
      await tribeMinter.connect(signer).mint(userAddress, mintAmount);

      const supplyBefore = await tribeMinter.totalSupply();

      expect(await tribeMinter.connect(signer).addLockedTribeAddress(userAddress))
        .to.emit(tribeMinter, 'AddLockedTribeAddress')
        .withArgs(userAddress);

      // Check the new lockedTribeAddresses
      const lockedAddresses = await tribeMinter.lockedTribeAddresses();
      expect(lockedAddresses[1]).to.be.equal(userAddress);
      expect(lockedAddresses.length).to.be.equal(2);

      // Check that the minted TRIBE was excluded
      expect(await tribeMinter.totalSupply()).to.be.bignumber.equal(supplyBefore.sub(mintAmount));
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        tribeMinter.connect(impersonatedSigners[userAddress]).addLockedTribeAddress(userAddress),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('Remove Locked Tribe Address', function () {
    it('governor succeeds', async function () {
      const signer = impersonatedSigners[governorAddress];

      // First mint some excluded TRIBE to see if it is re-included after removing
      const mintAmount = ethers.constants.WeiPerEther.mul(10_000);
      await tribeMinter.connect(signer).mint(tribeMinter.address, mintAmount);

      const supplyBefore = await tribeMinter.totalSupply();

      expect(await tribeMinter.connect(signer).removeLockedTribeAddress(tribeMinter.address))
        .to.emit(tribeMinter, 'RemoveLockedTribeAddress')
        .withArgs(tribeMinter.address);

      // Check lockedTribeAddresses is empty after removing tribeMinter
      const lockedAddresses = await tribeMinter.lockedTribeAddresses();
      expect(lockedAddresses.length).to.be.equal(0);

      // Then check the previously excluded balance is now included
      expect(await tribeMinter.totalSupply()).to.be.bignumber.equal(supplyBefore.add(mintAmount));
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        tribeMinter.connect(impersonatedSigners[userAddress]).removeLockedTribeAddress(userAddress),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('Set Annual Max Inflation', function () {
    it('governor succeeds', async function () {
      await tribeMinter.connect(impersonatedSigners[governorAddress]).setAnnualMaxInflationBasisPoints('300');
      expect(await tribeMinter.annualMaxInflationBasisPoints()).to.be.bignumber.equal(toBN(300));
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        tribeMinter.connect(impersonatedSigners[userAddress]).setAnnualMaxInflationBasisPoints('300'),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('Set Buffer Cap', function () {
    it('reverts', async function () {
      await expectRevert(tribeMinter.connect(impersonatedSigners[userAddress]).setBufferCap(0), 'no-op');
    });
  });

  describe('Set Rate Limit Per Second', function () {
    it('reverts', async function () {
      await expectRevert(tribeMinter.connect(impersonatedSigners[userAddress]).setBufferCap(0), 'no-op');
    });
  });
});
