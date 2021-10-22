import { time, getCore, getAddresses } from '../../helpers';
import chai, { expect } from 'chai';
import hre, { artifacts, ethers, network } from 'hardhat';
import { Signer } from 'ethers';

const BondingCurve = artifacts.readArtifactSync('BondingCurve');
const Fei = artifacts.readArtifactSync('Fei');
const MockERC20PCVDeposit = artifacts.readArtifactSync('MockERC20PCVDeposit');
const MockERC20 = artifacts.readArtifactSync('MockERC20');
const MockOracle = artifacts.readArtifactSync('MockOracle');

const toBN = ethers.BigNumber.from;

chai.config.includeStack = true;

describe('BondingCurve', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let governorAddress: string;
  let beneficiaryAddress1: string;
  let beneficiaryAddress2: string;
  let keeperAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.keeperAddress
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
    ({ userAddress, governorAddress, secondUserAddress, keeperAddress, beneficiaryAddress1, beneficiaryAddress2 } =
      await getAddresses());

    await network.provider.request({
      method: 'hardhat_reset',
      params: []
    });

    this.core = await getCore();

    this.fei = await ethers.getContractAt(Fei.abi, await this.core.fei());

    const oracleDeployer = await ethers.getContractFactory(MockOracle.abi, MockOracle.bytecode);
    this.oracle = await oracleDeployer.deploy(500); // 500 USD per ETH exchange rate

    const erc20Deployer = await ethers.getContractFactory(MockERC20.abi, MockERC20.bytecode);
    this.token = await erc20Deployer.deploy();

    const mockERC20PCVDepositFactory = await ethers.getContractFactory(
      MockERC20PCVDeposit.abi,
      MockERC20PCVDeposit.bytecode
    );

    this.pcvDeposit1 = await mockERC20PCVDepositFactory.deploy(beneficiaryAddress1, this.token.address);
    this.pcvDeposit2 = await mockERC20PCVDepositFactory.deploy(beneficiaryAddress2, this.token.address);

    this.scale = toBN('100000000000');
    this.buffer = toBN('100');
    this.incentiveAmount = toBN('100');
    this.incentiveDuration = toBN('10');

    const bondingCurveFactory = await ethers.getContractFactory(BondingCurve.abi, BondingCurve.bytecode);
    this.bondingCurve = await bondingCurveFactory.deploy(
      this.core.address,
      this.oracle.address,
      this.oracle.address,
      this.scale,
      [this.pcvDeposit1.address, this.pcvDeposit2.address],
      [9000, 1000],
      this.incentiveDuration,
      this.incentiveAmount,
      this.token.address,
      100,
      100
    );

    await this.token.mint(userAddress, '1000000000000000000000000');
    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.bondingCurve.address);
    await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setMintCap(this.scale.mul(toBN('10')));
  });

  describe('Buffer', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setBuffer(1000))
        .to.emit(this.bondingCurve, 'BufferUpdate')
        .withArgs(this.buffer, toBN(1000));

      expect(await this.bondingCurve.buffer()).to.be.equal(toBN(1000));
    });

    it('Governor set outside range reverts', async function () {
      await expect(this.bondingCurve.connect(impersonatedSigners[governorAddress]).setBuffer(10000)).to.be.revertedWith(
        'BondingCurve: Buffer exceeds or matches granularity'
      );
    });

    it('Non-governor set reverts', async function () {
      await expect(this.bondingCurve.connect(impersonatedSigners[userAddress]).setBuffer(1000)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Discount', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setDiscount(1000))
        .to.emit(this.bondingCurve, 'DiscountUpdate')
        .withArgs('100', toBN(1000));

      expect(await this.bondingCurve.discount()).to.be.equal(toBN(1000));
    });

    it('Governor set outside range reverts', async function () {
      await expect(
        this.bondingCurve.connect(impersonatedSigners[governorAddress]).setDiscount(10000)
      ).to.be.revertedWith('BondingCurve: Buffer exceeds or matches granularity');
    });

    it('Non-governor set reverts', async function () {
      await expect(this.bondingCurve.connect(impersonatedSigners[userAddress]).setDiscount(1000)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Core', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setCore(userAddress))
        .to.emit(this.bondingCurve, 'CoreUpdate')
        .withArgs(this.core.address, userAddress);

      expect(await this.bondingCurve.core()).to.be.equal(userAddress);
    });

    it('Non-governor set reverts', async function () {
      await expect(this.bondingCurve.connect(impersonatedSigners[userAddress]).setCore(userAddress)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Incentive Amount', function () {
    it('Governor set succeeds', async function () {
      this.incentiveAmount = toBN('10');
      await expect(
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setIncentiveAmount(this.incentiveAmount)
      )
        .to.emit(this.bondingCurve, 'IncentiveUpdate')
        .withArgs(toBN('100'), this.incentiveAmount);

      expect(await this.bondingCurve.incentiveAmount()).to.be.equal(this.incentiveAmount);
    });

    it('Non-governor set reverts', async function () {
      await expect(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setIncentiveAmount(toBN('10'))
      ).to.be.revertedWith('CoreRef: Caller is not a governor');
    });
  });

  describe('Incentive Frequency', function () {
    it('Governor set succeeds', async function () {
      this.incentiveFrequency = toBN('70');
      await expect(
        await this.bondingCurve
          .connect(impersonatedSigners[governorAddress])
          .setIncentiveFrequency(this.incentiveFrequency)
      )
        .to.emit(this.bondingCurve, 'DurationUpdate')
        .withArgs(this.incentiveDuration, this.incentiveFrequency);

      expect(await this.bondingCurve.duration()).to.be.equal(this.incentiveFrequency);
    });

    it('Non-governor set reverts', async function () {
      await expect(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setIncentiveFrequency(toBN('10'))
      ).to.be.revertedWith('CoreRef: Caller is not a governor');
    });
  });

  describe('Pausable', function () {
    it('init', async function () {
      expect(await this.bondingCurve.paused()).to.be.equal(false);
    });

    describe('Pause', function () {
      it('Governor succeeds', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        expect(await this.bondingCurve.paused()).to.be.equal(true);
      });

      it('Non-governor reverts', async function () {
        await expect(this.bondingCurve.connect(impersonatedSigners[userAddress]).pause()).to.be.revertedWith(
          'CoreRef: Caller is not a guardian or governor'
        );
      });
    });

    describe('Unpause', function () {
      beforeEach(async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        expect(await this.bondingCurve.paused()).to.be.equal(true);
      });

      it('Governor succeeds', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).unpause();
        expect(await this.bondingCurve.paused()).to.be.equal(false);
      });

      it('Non-governor reverts', async function () {
        await expect(this.bondingCurve.connect(impersonatedSigners[userAddress]).unpause()).to.be.revertedWith(
          'CoreRef: Caller is not a guardian or governor'
        );
      });
    });
  });
});
