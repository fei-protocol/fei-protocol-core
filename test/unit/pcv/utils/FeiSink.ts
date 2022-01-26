import { Core, FeiSink, MockPCVDepositV2 } from '@custom-types/contracts';
import { expectRevert, getAddresses, getCore, getImpersonatedSigner, ZERO_ADDRESS } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';

describe('FeiSkim', function () {
  let minterAddress: string;
  let userAddress: string;
  let governorAddress: string;
  let core: Core;
  let skimmer: FeiSink;
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
    it('has a source & threshold set', async function () {
      const sources = await skimmer.sources();
      expect(sources[0][0]).to.equal(source.address);
      expect(sources[1][0]).to.equal(ZERO_ADDRESS);
    });

    it('initial source is not skim eligible', async function () {
      const sources = await skimmer.sources();
      expect(await skimmer.skimEligible(sources[0][0])).to.be.false;
    });
  });

  describe('Skim', function () {
    it('initial source is eligible and functional over threshold', async function () {
      const fei = await ethers.getContractAt('IFei', await core.fei());

      await fei.connect(impersonatedSigners[minterAddress]).mint(source.address, ethers.constants.WeiPerEther.mul(2));

      expect(await skimmer.skimEligible(source.address)).to.be.true;

      await skimmer.skim(source.address);

      expect(await fei.balanceOf(source.address)).to.be.equal(threshold);
    });
  });

  describe('Set Threshold', function () {
    it('from governor succeeds', async function () {
      expect(await skimmer.thresholds(source.address)).to.be.equal(threshold);

      await skimmer.connect(impersonatedSigners[governorAddress]).setThreshold(source, 0);

      expect(await skimmer.threshold()).to.be.equal(0);
    });

    it('not from governor succeeds', async function () {
      await expectRevert(
        skimmer.connect(impersonatedSigners[userAddress]).setThreshold(0),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('Set Source', function () {
    it('from governor succeeds', async function () {
      expect(await skimmer.source()).to.be.equal(source.address);

      await skimmer.connect(impersonatedSigners[governorAddress]).setSource(ZERO_ADDRESS);

      expect(await skimmer.source()).to.be.equal(ZERO_ADDRESS);
    });

    it('not from governor succeeds', async function () {
      await expectRevert(
        skimmer.connect(impersonatedSigners[userAddress]).setSource(ZERO_ADDRESS),
        'CoreRef: Caller is not a governor'
      );
    });
  });
});
