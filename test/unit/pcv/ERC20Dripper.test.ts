/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { time, getCore, expectRevert, getAddresses, expectApprox } from '../../helpers';
import { expect } from 'chai';
import hre, { artifacts, ethers } from 'hardhat';
import { Signer } from 'ethers'

const toBN = ethers.BigNumber.from

const Tribe = artifacts.readArtifactSync('MockTribe');
const MockCoreRef = artifacts.readArtifactSync('MockCoreRef');
const TribalChief = artifacts.readArtifactSync('TribalChief');
const ERC20Dripper = artifacts.readArtifactSync('ERC20Dripper');
const TransparentUpgradeableProxy = artifacts.readArtifactSync('TransparentUpgradeableProxy');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// We will drip 4 million tribe per week
const dripAmount = toBN(4000000).mul(toBN(10).pow(toBN(18)));
// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

let userAddress: string
let secondUserAddress: string
let thirdUserAddress: string
let fourthUserAddress: string
let fifthUserAddress: string
let sixthUserAddress: string
let seventhUserAddress: string
let eigthUserAddress: string
let ninthUserAddress: string
let tenthUserAddress: string

let beneficiaryAddress1: string
let beneficiaryAddress2: string
let minterAddress: string
let burnerAddress: string
let pcvControllerAddress: string
let governorAddress: string
let genesisGroup: string
let guardianAddress: string

describe('ERC20Dripper', () => {
  before(async () => {
    const addresses = await getAddresses()

    userAddress = addresses.userAddress;
    secondUserAddress = addresses.secondUserAddress;
    thirdUserAddress = addresses.beneficiaryAddress1;
    fourthUserAddress = addresses.minterAddress;
    fifthUserAddress = addresses.burnerAddress;
    sixthUserAddress = addresses.pcvControllerAddress;
    seventhUserAddress = addresses.governorAddress;
    eigthUserAddress = addresses.genesisGroup;
    ninthUserAddress = addresses.guardianAddress;
    tenthUserAddress = addresses.beneficiaryAddress2;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
    beneficiaryAddress1 = addresses.beneficiaryAddress1;
    beneficiaryAddress2 = addresses.beneficiaryAddress2;
    minterAddress = addresses.minterAddress;
    burnerAddress = addresses.burnerAddress;
    genesisGroup = addresses.genesisGroup;
    guardianAddress = addresses.guardianAddress;

  });

  beforeEach(async function () {
    this.core = await getCore();

    const tribeFactory = await ethers.getContractFactory(Tribe.abi, Tribe.bytecode)
    this.tribe = await tribeFactory.deploy();

    const coreRefFactory = await ethers.getContractFactory(MockCoreRef.abi, MockCoreRef.bytecode)
    this.coreRef = await coreRefFactory.deploy(this.core.address);

    // spin up the logic contract by hand
    const tribalChiefFactory = await ethers.getContractFactory(TribalChief.abi, TribalChief.bytecode)
    const tribalChief = await tribalChiefFactory.deploy(this.core.address);
    // create a new proxy contract
    
    hre.network.provider.request({
      'method': 'hardhat_impersonateAccount',
      'params': [userAddress]
    });

    const userSigner = await ethers.getSigner(userAddress)

    const proxyContractFactory = await ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode, userSigner)
    const proxyContract = await proxyContractFactory.deploy(tribalChief.address, tribalChief.address, '0x');

    hre.network.provider.request({
      'method': 'hardhat_stopImpersonatingAccount',
      'params': [userAddress]
    })

    // instantiate the tribalchief pointed at the proxy contract
    this.tribalChief = await ethers.getContractAt(TribalChief.abi, proxyContract.address)

    // initialize the tribalchief by hand
    await this.tribalChief.initialize(this.core.address, this.tribe.address);

    const dripperFactory = await ethers.getContractFactory(ERC20Dripper.abi, ERC20Dripper.bytecode)
    this.dripper = await dripperFactory.deploy(
      this.core.address,
      this.tribalChief.address,
      dripFrequency,
      dripAmount,
      this.tribe.address
    );

    // 11 if max times we call drip in any given test
    await this.tribe.mint(this.dripper.address, dripAmount.mul(toBN(11)));
  });

  describe('security suite', () => {
    it('should not be able to withdraw as non PCV controller', async function () {
      const totalLockedTribe = await this.dripper.balance();

      await hre.network.provider.request({method: 'hardhat_impersonateAccount', params: [thirdUserAddress]});

      await expectRevert(
        this.dripper.connect(await ethers.getSigner(thirdUserAddress)).withdraw(
          this.tribalChief.address, totalLockedTribe
        ),
        'CoreRef: Caller is not a PCV controller'
      );
    });

    it('should be able to withdraw as PCV controller', async function () {
      const totalLockedTribe = await this.dripper.balance();
      const dripperStartingBalance = await this.tribe.balanceOf(this.dripper.address);

      hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [pcvControllerAddress]
      })

      const pcvControllerAddressSigner = await ethers.getSigner(pcvControllerAddress)

      await this.dripper.connect(pcvControllerAddressSigner).withdraw(
        this.tribalChief.address, totalLockedTribe
      );

      hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [pcvControllerAddress]
      })

      const dripperEndingBalance = await this.tribe.balanceOf(this.dripper.address);

      expect(dripperEndingBalance).to.be.equal(toBN(0));
      expect(dripperStartingBalance).to.be.equal(totalLockedTribe);
    });

    it('should not be able to call drip before the timer is up', async function () {
      expect((await this.dripper.isTimeEnded())).to.be.false;
      await expectRevert(
        this.dripper.drip(),
        'Timed: time not ended'
      );
    });
  });

  describe('construction suite', () => {
    it('should not be able to construct with an invalid target address', async function () {
      const dripperFactory = await ethers.getContractFactory(ERC20Dripper.abi, ERC20Dripper.bytecode)
      await expectRevert(
        dripperFactory.deploy(
          this.core.address,
          ZERO_ADDRESS,
          dripFrequency,
          dripAmount,
          this.tribe.address
        ),
        'ERC20Dripper: invalid address'
      );
    });

    it('should not be able to construct with an invalid token address', async function () {
      const dripperFactory = await ethers.getContractFactory(ERC20Dripper.abi, ERC20Dripper.bytecode)
      await expectRevert(
        dripperFactory.deploy(
          this.core.address,
          this.tribe.address,
          dripFrequency,
          dripAmount,
          ZERO_ADDRESS,
        ),
        'ERC20Dripper: invalid token address'
      );
    });

    it('should not be able to construct with an invalid frequency', async function () {
      const dripperFactory = await ethers.getContractFactory(ERC20Dripper.abi, ERC20Dripper.bytecode)
      await expectRevert(
        dripperFactory.deploy(
          this.core.address,
          this.tribalChief.address,
          0,
          dripAmount,
          this.tribe.address
        ),
        'Timed: zero duration'
      );
    });

    it('should not be able to construct with an invalid drip amount', async function () {
      const dripperFactory = await ethers.getContractFactory(ERC20Dripper.abi, ERC20Dripper.bytecode)
      await expectRevert(
        dripperFactory.deploy(
          this.core.address,
          this.tribalChief.address,
          dripFrequency,
          0,
          this.tribe.address
        ),
        'ERC20Dripper: invalid drip amount'
      );
    });
  });

  describe('first suite', () => {
    it('should be able to call drip as any role while not paused', async function () {
      await time.increase(dripFrequency);

      expect(await this.dripper.isTimeEnded()).to.be.true;

      const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
      await this.dripper.drip();
      const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

      expect(await this.dripper.isTimeEnded()).to.be.false;
      expect(tribalChiefStartingBalance.add(dripAmount)).to.be.equal(tribalChiefEndingBalance);
    });

    it('should not be able to call drip as any role while the contracts are paused', async function () {
      await time.increase(dripFrequency);

      expect(await this.dripper.isTimeEnded()).to.be.true;
      expect(await this.dripper.paused()).to.be.false;

      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [governorAddress]
      })

      const governorSigner = await ethers.getSigner(governorAddress)

      await this.dripper.connect(governorSigner).pause();

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [governorAddress]
      })

      expect(await this.dripper.paused()).to.be.true;

      await expectRevert(
        this.dripper.drip(),
        'Pausable: paused'
      );
      // still waiting to go as the contract is paused
      expect(await this.dripper.isTimeEnded()).to.be.true;
    });

    it('should not be able to call drip as any role while the contracts are paused, then unpause and drip', async function () {
      await time.increase(dripFrequency);

      expect(await this.dripper.isTimeEnded()).to.be.true;
      expect(await this.dripper.paused()).to.be.false;

      await hre.network.provider.request({
        'method': 'hardhat_impersonateAccount',
        'params': [governorAddress]
      })

      const governorSigner = await ethers.getSigner(governorAddress)

      await this.dripper.connect(governorSigner).pause();

      await hre.network.provider.request({
        'method': 'hardhat_stopImpersonatingAccount',
        'params': [governorAddress]
      })

      expect(await this.dripper.paused()).to.be.true;

      await expectRevert(
        this.dripper.drip(),
        'Pausable: paused'
      );
      // still waiting to go as the contract is paused
      expect(await this.dripper.isTimeEnded()).to.be.true;

      await hre.network.provider.request({method: 'hardhat_impersonateAccount', params: [governorAddress]})
      await this.dripper.connect(await ethers.getSigner(governorAddress)).unpause();

      expect(await this.dripper.paused()).to.be.false;

      const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
      await this.dripper.drip();
      const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

      expect(await this.dripper.isTimeEnded()).to.be.false;
      expect(tribalChiefStartingBalance.add(dripAmount)).to.be.equal(tribalChiefEndingBalance);
    });

    it('should be able to call drip when enough time has passed through multiple periods', async function () {
      for (let i = 0; i < 11; i++) {
        await time.increase(dripFrequency.toString());

        expect(await this.dripper.isTimeEnded()).to.be.true;

        const tribalChiefStartingBalance = await this.tribe.balanceOf(this.tribalChief.address);
        await this.dripper.drip();
        const tribalChiefEndingBalance = await this.tribe.balanceOf(this.tribalChief.address);

        expect(await this.dripper.isTimeEnded()).to.be.false;
        expect(tribalChiefStartingBalance.add(dripAmount)).to.be.equal(tribalChiefEndingBalance);
      }
    });
  });
});
