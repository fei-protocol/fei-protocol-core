const {
    userAddress,
    governorAddress,
    BN,
    expectEvent,
    expectRevert,
    time,
    contract,
    expect,
    getCore
  } = require('../helpers');
  
  const ReserveStabilizer = artifacts.require('ReserveStabilizer');
  const MockOracle = artifacts.require('MockOracle');
  
  describe('OracleRef', function () {
  
    beforeEach(async function () {
      this.core = await getCore(true);
      
      this.oracle = await MockOracle.new(500); // 500 USD per ETH exchange rate 
      this.backupOracle = await MockOracle.new(505); // 505 USD per ETH exchange rate 

      this.oracleRef = await ReserveStabilizer.new(this.core.address, this.oracle.address, userAddress, 10000);
      await this.oracleRef.setBackupOracle(this.backupOracle.address, {from: governorAddress});
    });
  
    describe('Init', function() {
  
      it('oracle', async function() {
        expect(await this.oracleRef.oracle()).to.be.equal(this.oracle.address);
      });
  
      it('backup oracle', async function() {
        expect(await this.oracleRef.backupOracle()).to.be.equal(this.backupOracle.address);
      });
    });
    describe('Access', function() {
        describe('Set Backup Oracle', function() {
          it('Governor set succeeds', async function() {
            expect(await this.oracleRef.backupOracle()).to.be.equal(this.backupOracle.address);
            expectEvent(
                await this.oracleRef.setBackupOracle(userAddress, {from: governorAddress}),
                'BackupOracleUpdate',
                { 
                  oldBackupOracle: this.backupOracle.address,
                  newBackupOracle: userAddress 
                }
              );
            expect(await this.oracleRef.backupOracle()).to.be.equal(userAddress);
          });
    
          it('Non-governor set reverts', async function() {
            await expectRevert(this.oracleRef.setBackupOracle(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
          });
        });
    });
    describe('Update', function() {
        it('succeeds', async function() {
          await this.oracleRef.updateOracle();
          expect(await this.oracle.updated()).to.be.equal(true);
        });
    });

    describe('Invert', function() {
        it('succeeds', async function() {
          expect((await this.oracleRef.invert(['500000000000000000000']))[0]).to.be.equal('2000000000000000');
        });
    });

    describe('Read', function() {
        describe('Invalid Oracle', function() {
            it('falls back to backup', async function() {
                this.oracle.setValid(false);
                expect((await this.oracleRef.readOracle({from: userAddress}))[0]).to.be.equal('505000000000000000000');     
            });
        });

        describe('Invalid Oracle and Backup', function() {
            it('reverts', async function() {
              this.oracle.setValid(false);
              this.backupOracle.setValid(false);
              await expectRevert(this.oracleRef.readOracle({from: userAddress}), "OracleRef: oracle invalid");     
            });
        });

        describe('Valid Oracle', function() {
            it('succeeds', async function() {
                expect((await this.oracleRef.readOracle({from: userAddress}))[0]).to.be.equal('500000000000000000000');     
            });
        });
    });
  });