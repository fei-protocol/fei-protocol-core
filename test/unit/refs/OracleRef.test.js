const {
  expectEvent,
  expectRevert,
  expect,
  BN,
  getAddresses,
  getCore,
} = require('../../helpers');

const ReserveStabilizer = artifacts.readArtifactSync('ReserveStabilizer');
const MockOracle = artifacts.readArtifactSync('MockOracle');
const MockERC20 = artifacts.readArtifactSync('MockERC20');

describe('OracleRef', () => {
  let userAddress;
  let governorAddress;

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());

    this.core = await getCore(true);

    this.token = await MockERC20.new();

    this.oracle = await MockOracle.new(500); // 500 USD per ETH exchange rate
    this.backupOracle = await MockOracle.new(505); // 505 USD per ETH exchange rate

    this.oracleRef = await ReserveStabilizer.new(
      this.core.address,
      this.oracle.address,
      this.backupOracle.address,
      this.token.address, 10000,
    );
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
      expect(await this.oracleRef.decimalsNormalizer()).to.be.bignumber.equal(toBN('0'));
    });
  });
  describe('Access', () => {
    describe('Set Backup Oracle', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.backupOracle()).to.be.equal(this.backupOracle.address);
        expectEvent(
          await this.oracleRef.setBackupOracle(userAddress, { from: governorAddress }),
          'BackupOracleUpdate',
          {
            oldBackupOracle: this.backupOracle.address,
            newBackupOracle: userAddress,
          },
        );
        expect(await this.oracleRef.backupOracle()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(this.oracleRef.setBackupOracle(userAddress, { from: userAddress }), 'CoreRef: Caller is not a governor');
      });
    });

    describe('Set Do Invert', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.doInvert()).to.be.equal(true);
        expectEvent(
          await this.oracleRef.setDoInvert(false, { from: governorAddress }),
          'InvertUpdate',
          {
            oldDoInvert: true,
            newDoInvert: false,
          },
        );
        expect(await this.oracleRef.doInvert()).to.be.equal(false);
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(this.oracleRef.setDoInvert(false, { from: userAddress }), 'CoreRef: Caller is not a governor');
      });
    });

    describe('Set Decimals Normalizer', () => {
      it('Governor set succeeds', async function () {
        expect(await this.oracleRef.decimalsNormalizer()).to.be.bignumber.equal(toBN('0'));
        expectEvent(
          await this.oracleRef.setDecimalsNormalizer(4, { from: governorAddress }),
          'DecimalsNormalizerUpdate',
          {
            oldDecimalsNormalizer: '0',
            newDecimalsNormalizer: '4',
          },
        );
        expect(await this.oracleRef.decimalsNormalizer()).to.be.bignumber.equal(toBN('4'));
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(this.oracleRef.setDecimalsNormalizer(4, { from: userAddress }), 'CoreRef: Caller is not a governor');
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
        expect((await this.oracleRef.readOracle({ from: userAddress }))[0]).to.be.equal('1980198019801980');
      });
    });

    describe('Invalid Oracle and Backup', () => {
      it('reverts', async function () {
        await this.oracle.setValid(false);
        await this.backupOracle.setValid(false);
        await expectRevert(this.oracleRef.readOracle({ from: userAddress }), 'OracleRef: oracle invalid');
      });
    });

    describe('Valid Oracle', () => {
      it('succeeds', async function () {
        expect((await this.oracleRef.readOracle({ from: userAddress }))[0]).to.be.equal('2000000000000000');
      });

      it('positive decimal normalizer scales down', async function () {
        await this.oracleRef.setDecimalsNormalizer(4, { from: governorAddress }),
        expect((await this.oracleRef.readOracle({ from: userAddress }))[0]).to.be.equal('200000000000');
      });

      it('negative decimal normalizer scales up', async function () {
        await this.oracleRef.setDecimalsNormalizer(-4, { from: governorAddress }),
        expect((await this.oracleRef.readOracle({ from: userAddress }))[0]).to.be.equal('20000000000000000000');
      });
    });
  });
});
