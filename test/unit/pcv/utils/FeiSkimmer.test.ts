import { Core, FeiSkimmer, MockPCVDepositV2 } from '@custom-types/contracts';
import { expectRevert, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';

describe('FeiSkimmer', function () {
  let minterAddress: string;
  let userAddress: string;
  let governorAddress: string;
  let core: Core;
  let skimmer: FeiSkimmer;
  let source: MockPCVDepositV2;

  const threshold = ethers.constants.WeiPerEther;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress, addresses.minterAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress, minterAddress } = await getAddresses());
    core = await getCore();

    source = await (await ethers.getContractFactory('MockPCVDepositV2')).deploy(core.address, await core.fei(), 0, 0);

    skimmer = await (await ethers.getContractFactory('FeiSkimmer')).deploy(core.address, source.address, threshold);
  });

  describe('Initial configuration', function () {
    it('has source set', async function () {
      expect(await skimmer.source()).to.be.equal(source.address);
    });

    it('has threshold set', async function () {
      expect(await skimmer.threshold()).to.be.equal(threshold);
    });

    it('is not skim eligible', async function () {
      expect(await skimmer.skimEligible()).to.be.false;
      await expectRevert(skimmer.skim(), 'under threshold');
    });
  });

  describe('Skim', function () {
    it('is eligible and functional over threshold', async function () {
      const fei = await ethers.getContractAt('IFei', await core.fei());

      await fei.connect(impersonatedSigners[minterAddress]).mint(source.address, ethers.constants.WeiPerEther.mul(2));

      expect(await skimmer.skimEligible()).to.be.true;

      await skimmer.skim();

      expect(await fei.balanceOf(source.address)).to.be.equal(threshold);
    });
  });

  describe('Set Threshold', function () {
    it('from governor succeeds', async function () {
      expect(await skimmer.threshold()).to.be.equal(threshold);

      await skimmer.connect(impersonatedSigners[governorAddress]).setThreshold(0);

      expect(await skimmer.threshold()).to.be.equal(0);
    });

    it('not from governor succeeds', async function () {
      await expectRevert(
        skimmer.connect(impersonatedSigners[userAddress]).setThreshold(0),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });
});
