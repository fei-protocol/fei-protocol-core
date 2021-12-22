import { expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('OracleRef', () => {
  let userAddress;
  let governorAddress;

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

    this.core = await getCore();

    this.token = await (await ethers.getContractFactory('MockERC20')).deploy();

    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(500); // 500 USD per ETH exchange rate
    this.backupOracle = await (await ethers.getContractFactory('MockOracle')).deploy(505); // 505 USD per ETH exchange rate

    this.oracleRef = await (
      await ethers.getContractFactory('ReserveStabilizer')
    ).deploy(this.core.address, this.oracle.address, this.backupOracle.address, this.token.address, 10000);
  });

  describe('Init', () => {
    it('oracle', async function () {
      expect(await this.oracleRef.oracle()).to.be.equal(this.oracle.address);
    });

    it('backup oracle', async function () {
      expect(await this.oracleRef.backupOracle()).to.be.equal(this.backupOracle.address);
    });

    it('do invert', async function () {
      expect(await this.oracleRef.doInvert()).to.be.equal(true);
    });

    it('decimals normalizer', async function () {
      expect(await this.oracleRef.decimalsNormalizer()).to.be.equal(toBN('0'));
    });
  });
  describe('Access', () => {
    describe('Set Backup Oracle', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.backupOracle()).to.be.equal(this.backupOracle.address);
        /*await expect(*/
        await this.oracleRef.connect(impersonatedSigners[governorAddress]).setBackupOracle(userAddress);
        /*'BackupOracleUpdate',
          {
            oldBackupOracle: this.backupOracle.address,
            newBackupOracle: userAddress,
          },
        );*/
        expect(await this.oracleRef.backupOracle()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.oracleRef.connect(impersonatedSigners[userAddress]).setBackupOracle(userAddress),
          'CoreRef: Caller is not a governor'
        );
      });
    });

    describe('Set Do Invert', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.doInvert()).to.be.equal(true);
        /*await expect(*/
        await this.oracleRef.connect(impersonatedSigners[governorAddress]).setDoInvert(false);
        /*'InvertUpdate',
          {
            oldDoInvert: true,
            newDoInvert: false,
          },
        );*/
        expect(await this.oracleRef.doInvert()).to.be.equal(false);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.oracleRef.connect(impersonatedSigners[userAddress]).setDoInvert(false),
          'CoreRef: Caller is not a governor'
        );
      });
    });

    describe('Set Decimals Normalizer', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.decimalsNormalizer()).to.be.equal(toBN('0'));
        /*await expect(*/
        await this.oracleRef.connect(impersonatedSigners[governorAddress]).setDecimalsNormalizer(4);
        /*'DecimalsNormalizerUpdate',
          {
            oldDecimalsNormalizer: '0',
            newDecimalsNormalizer: '4',
          },
        );*/
        expect(await this.oracleRef.decimalsNormalizer()).to.be.equal(toBN('4'));
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.oracleRef.connect(impersonatedSigners[userAddress]).setDecimalsNormalizer(4),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });
  describe('Update', () => {
    it('succeeds', async function () {
      await this.oracleRef.updateOracle();
      expect(await this.oracle.updated()).to.be.equal(true);
    });
  });

  describe('Invert', () => {
    it('succeeds', async function () {
      expect((await this.oracleRef.invert(['500000000000000000000']))[0]).to.be.equal('2000000000000000');
    });
  });

  describe('Read', () => {
    describe('Invalid Oracle', () => {
      it('falls back to backup', async function () {
        await this.oracle.setValid(false);
        expect((await this.oracleRef.connect(impersonatedSigners[userAddress]).readOracle())[0]).to.be.equal(
          '1980198019801980'
        );
      });
    });

    describe('Invalid Oracle and Backup', () => {
      it('reverts', async function () {
        await this.oracle.setValid(false);
        await this.backupOracle.setValid(false);
        await expectRevert(
          this.oracleRef.connect(impersonatedSigners[userAddress]).readOracle(),
          'OracleRef: oracle invalid'
        );
      });
    });

    describe('Valid Oracle', () => {
      it('succeeds', async function () {
        expect((await this.oracleRef.connect(impersonatedSigners[userAddress]).readOracle())[0]).to.be.equal(
          '2000000000000000'
        );
      });

      it('positive decimal normalizer scales down', async function () {
        await this.oracleRef.connect(impersonatedSigners[governorAddress]).setDecimalsNormalizer(4),
          expect((await this.oracleRef.connect(impersonatedSigners[userAddress]).readOracle())[0]).to.be.equal(
            '200000000000'
          );
      });

      it('negative decimal normalizer scales up', async function () {
        await this.oracleRef.connect(impersonatedSigners[governorAddress]).setDecimalsNormalizer(-4),
          expect((await this.oracleRef.connect(impersonatedSigners[userAddress]).readOracle())[0]).to.be.equal(
            '20000000000000000000'
          );
      });
    });
  });
});
