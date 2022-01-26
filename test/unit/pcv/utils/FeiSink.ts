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
  let sink: FeiSink;
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
    sink = (await (
      await ethers.getContractFactory('FeiSkimmer')
    ).deploy(core.address, source.address, threshold)) as FeiSink;
  });

  describe('Initial configuration', function () {
    it('has a source & threshold set', async function () {
      const sources = await sink.getSources();
      expect(sources[0][0]).to.equal(source.address);
      expect(sources[1][0]).to.equal(ZERO_ADDRESS);
    });
  });

  describe('Skim', function () {
    it('initial source is eligible and functional over threshold', async function () {
      const fei = await ethers.getContractAt('IFei', await core.fei());

      await fei.connect(impersonatedSigners[minterAddress]).mint(source.address, ethers.constants.WeiPerEther.mul(2));
      await sink.skim([source.address]);

      expect(await fei.balanceOf(source.address)).to.be.equal(threshold);
    });
  });

  describe('Set Threshold', function () {
    it('from governor succeeds', async function () {
      expect(await sink.thresholds(source.address)).to.be.equal(threshold);

      await sink.connect(impersonatedSigners[governorAddress]).setThreshold(source.address, 0);

      expect(await sink.thresholds[source.address]).to.be.equal(0);
    });

    it('not from governor succeeds', async function () {
      await expectRevert(
        sink.connect(impersonatedSigners[userAddress]).setThreshold(source.address, 0),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('Remove', function () {
    it('from governor succeeds', async function () {
      expect((await sink.getSources())[0][0]).to.be.equal(source.address);

      await sink.connect(impersonatedSigners[governorAddress]).removeSource(source.address);

      expect((await sink.getSources()).length).to.be.equal(0);
    });

    it('not from governor succeeds', async function () {
      await expectRevert(
        sink.connect(impersonatedSigners[userAddress]).removeSource(source.address),
        'CoreRef: Caller is not a governor'
      );
    });
  });
});
