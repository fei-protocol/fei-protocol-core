import { expectApprox, expectRevert, getAddresses, getCore, time, ZERO_ADDRESS } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';

describe('PCVEquityMinter', function () {
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
    this.collateralizationOracle = await (
      await ethers.getContractFactory('MockCollateralizationOracle')
    ).deploy(this.core.address, '1');

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());

    this.swapper = await (await ethers.getContractFactory('MockPCVSwapper')).deploy();

    this.incentive = '100';
    this.frequency = '3600'; // 1 hour
    this.intialMintAmount = '10000';
    this.aprBasisPoints = '200'; // 2%
    this.feiMinter = await (
      await ethers.getContractFactory('PCVEquityMinter')
    ).deploy(
      this.core.address,
      this.swapper.address,
      this.incentive,
      this.frequency,
      this.collateralizationOracle.address,
      this.aprBasisPoints,
      '5000', // max APR 50%
      ethers.constants.WeiPerEther.mul(1000) // 1000 FEI/s max
    );

    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.feiMinter.address);
  });

  describe('Mint', function () {
    it('pasued reverts', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).pause();
      await expectRevert(this.feiMinter.connect(impersonatedSigners[userAddress]).mint(), 'Pausable: paused');
    });

    it('before time reverts', async function () {
      await expectRevert(this.feiMinter.connect(impersonatedSigners[userAddress]).mint(), 'Timed: time not ended');
    });

    describe('after time', function () {
      beforeEach(async function () {
        await time.increase(this.frequency);
        await time.increase(this.frequency);
      });

      it('below rate limit succeeds', async function () {
        await this.feiMinter.connect(impersonatedSigners[secondUserAddress]).mint();

        // timer reset
        expectApprox(await this.feiMinter.remainingTime(), this.frequency);

        // mint sent
        const expected = (4e20 * 0.02) / (24 * 365); // This is equity * APR / durations / year
        expectApprox(await this.fei.balanceOf(this.swapper.address), expected.toFixed(0));

        // incentive for caller
        expect(await this.fei.balanceOf(secondUserAddress)).to.be.equal(this.incentive);
        expect(await this.swapper.swapped()).to.be.true;
      });

      it('above rate limit does partial mint', async function () {
        // set PCV equity to be massive
        await this.collateralizationOracle.set('0', '10000000000000000000000000000000000');

        // The buffer is the expected value with excess equity
        const expected = await this.feiMinter.buffer();

        await this.feiMinter.connect(impersonatedSigners[secondUserAddress]).mint();

        // timer reset
        expectApprox(await this.feiMinter.remainingTime(), this.frequency);

        // mint sent
        expectApprox(await this.fei.balanceOf(this.swapper.address), expected);

        // incentive for caller
        expect(await this.fei.balanceOf(secondUserAddress)).to.be.equal(this.incentive);
        expect(await this.swapper.swapped()).to.be.true;
      });
    });
  });

  describe('Set Collateralization Oracle', function () {
    it('governor succeeds', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).setCollateralizationOracle(secondUserAddress);
      expect(await this.feiMinter.collateralizationOracle()).to.be.equal(secondUserAddress);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[userAddress]).setCollateralizationOracle(secondUserAddress),
        'CoreRef: Caller is not a governor'
      );
    });

    it('zero address reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setCollateralizationOracle(ZERO_ADDRESS),
        'PCVEquityMinter: zero address'
      );
    });
  });

  describe('Set APR Basis Points', function () {
    it('governor succeeds', async function () {
      await this.feiMinter.connect(impersonatedSigners[governorAddress]).setAPRBasisPoints('1000');
      expect(await this.feiMinter.aprBasisPoints()).to.be.equal('1000');
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[userAddress]).setAPRBasisPoints('1000'),
        'CoreRef: Caller is not a governor'
      );
    });

    it('zero reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setAPRBasisPoints('0'),
        'PCVEquityMinter: zero APR'
      );
    });

    it('above max reverts', async function () {
      await expectRevert(
        this.feiMinter.connect(impersonatedSigners[governorAddress]).setAPRBasisPoints('6000'),
        'PCVEquityMinter: APR above max'
      );
    });
  });
});
