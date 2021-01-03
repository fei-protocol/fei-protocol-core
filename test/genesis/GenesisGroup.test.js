const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockIDO = contract.fromArtifact('MockIDO');
const MockBondingCurve = contract.fromArtifact('MockBondingCurve');
const Core = contract.fromArtifact('Core');
const GenesisGroup = contract.fromArtifact('GenesisGroup');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');
const MockBondingCurveOracle = contract.fromArtifact('MockBCO');
const MockPool = contract.fromArtifact('MockPool');

describe('GenesisGroup', function () {
  const [ userAddress, secondUserAddress, governorAddress, minterAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());
    this.bc = await MockBondingCurve.new(false, 10);
    this.ido = await MockIDO.new();
    this.bo = await MockBondingCurveOracle.new();
    this.pool = await MockPool.new();
    this.genesisGroup = await GenesisGroup.new(this.core.address, this.bc.address, this.ido.address, this.bo.address, this.pool.address, '1000', '9000', '10');

    await this.core.allocateTribe(this.genesisGroup.address, 10000, {from: governorAddress});
    await this.core.setGenesisGroup(this.genesisGroup.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    // 5:1 FEI to TRIBE ratio
    this.fei.mint(this.genesisGroup.address, 50000, {from: minterAddress});
  });

  describe('During Genesis Period', function() {
    it('is during', async function() {
      expect(await this.genesisGroup.isTimeEnded()).to.be.equal(false);
    });
    describe('Purchase', function() {
      describe('No value', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.purchase(userAddress, 0, {from: userAddress, value: 0}), "GenesisGroup: no value sent");
        });
      });
      describe('Wrong value', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.purchase(userAddress, 100, {from: userAddress, value: 1000}), "GenesisGroup: value mismatch");
        });
      });
      describe('With value', function() {
        beforeEach(async function() {
          expectEvent(
            await this.genesisGroup.purchase(userAddress, 1000, {from: userAddress, value: 1000}),
            'Purchase',
            {
              _to: userAddress,
              _value: "1000"
            }
          );
        });
        it('Updates balances', async function() {
          expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(1000));
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(1000));
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(1000));
        });
        describe('Second Purchase', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(secondUserAddress, 1000, {from: secondUserAddress, value: 1000});
          });
          it('Updates balances', async function() {
            expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(2000));
            expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(1000));
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(2000));
          });
        });
      });
    });

    describe('Get Amount Out', function() {  
      describe('Inclusive', function() {
        describe('No existing', function() {
          it('reverts', async function() {
            await expectRevert(this.genesisGroup.getAmountOut(1000, true), "GenesisGroup: Not enough supply");
          });
        });

        describe('Existing', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(userAddress, 1000, {from: userAddress, value: 1000});
          });

          it('succeeds', async function() {
            let result = await this.genesisGroup.getAmountOut(500, true);
            expect(result[0]).to.be.bignumber.equal(new BN(5000));
            expect(result[1]).to.be.bignumber.equal(new BN(5000));
          });
        });
      });

      describe('Exclusive', function() {
        describe('No existing', function() {
          it('succeeds', async function() {
            let result = await this.genesisGroup.getAmountOut(500, false);
            expect(result[0]).to.be.bignumber.equal(new BN(5000));
            expect(result[1]).to.be.bignumber.equal(new BN(10000));
          });
        });

        describe('Existing', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(userAddress, 1000, {from: userAddress, value: 1000});
          });

          it('succeeds', async function() {
            let result = await this.genesisGroup.getAmountOut(1000, false);
            expect(result[0]).to.be.bignumber.equal(new BN(10000));
            expect(result[1]).to.be.bignumber.equal(new BN(5000));
          });
        });
      });
    });

    describe('Launch', function() {
      beforeEach(async function() {
        await this.genesisGroup.purchase(userAddress, 1000, {from: userAddress, value: 1000});
      });

      describe('Below max price', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.launch(), "GenesisGroup: Still in Genesis Period");
        });
      });
      describe('Above max price', function() {
        beforeEach(async function() {
          await this.bc.setCurrentPrice(95);
          expectEvent(
            await this.genesisGroup.launch(),
            'Launch',
            {}
          );
        });
        it('purchases on bondingCurve', async function() {
          expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(0));
          expect(await balance.current(this.bc.address)).to.be.bignumber.equal(new BN(1000));
        });

        it('deploys IDO', async function() {
          expect(await this.ido.ratio()).to.be.bignumber.equal(new BN('5000000000000000000').div(new BN(10)));
        });

        it('inits Bonding Curve Oracle', async function() {
          expect(await this.bo.initPrice()).to.be.bignumber.equal(new BN('950000000000000000'));
        });
      });

    });

    describe('Redeem', function() {
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.redeem(userAddress, {from: userAddress}), "CoreRef: Still in Genesis Period");
      });
    });
  });

  describe('Post Genesis Period', function() {
    beforeEach(async function() {
      await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
      await this.genesisGroup.purchase(secondUserAddress, 250, {from: secondUserAddress, value: 250});
      await time.increase('2000');
    });

    it('is post', async function() {
      expect(await this.genesisGroup.isTimeEnded()).to.be.equal(true);
    });

    describe('Purchase', function() {
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.purchase(userAddress, 100, {from: userAddress, value: 100}), "GenesisGroup: Not in Genesis Period");
      });
    });

    describe('Launch', function() {
      beforeEach(async function() {
        expectEvent(
          await this.genesisGroup.launch(),
          'Launch',
          {}
        );
      });

      it('purchases on bondingCurve', async function() {
        expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(0));
        expect(await balance.current(this.bc.address)).to.be.bignumber.equal(new BN(1000));
      });

      it('deploys IDO', async function() {
        expect(await this.ido.ratio()).to.be.bignumber.equal(new BN('5000000000000000000').div(new BN(10)));
      });

      it('second launch reverts', async function() {
        await expectRevert(this.genesisGroup.launch(), "Core: Genesis Group already complete");
      });
      it('inits Bonding Curve Oracle', async function() {
        expect(await this.bo.initPrice()).to.be.bignumber.equal(new BN('100000000000000000'));
      });
    });

    describe('Redeem', function() {
      beforeEach(async function() {
        expectEvent(
          await this.genesisGroup.launch(),
          'Launch',
          {}
        );
      });

      describe('External Redeem', function() {
        describe('Approved', function() {
          beforeEach(async function() {
            let balance = await this.genesisGroup.balanceOf(userAddress);
            await this.genesisGroup.approve(secondUserAddress, balance, {from: userAddress});
            expectEvent(
              await this.genesisGroup.redeem(userAddress, {from: secondUserAddress}),
              'Redeem',
              {
                _to: userAddress,
                _amountFei: "37500",
                _amountTribe: "7500"
              }
            );
          });

          it('updates balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(250));
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(37500));
            expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(7500));
            expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(12500));
            expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(2500));
          });
        });

        describe('Not Approved', function() {
          it('reverts', async function() {
            await expectRevert(
               this.genesisGroup.redeem(userAddress, {from: secondUserAddress}),
              'ERC20: burn amount exceeds allowance'
            );
          });
        });
      });

      describe('Single Redeem', function() {
        beforeEach(async function() {
          expectEvent(
            await this.genesisGroup.redeem(userAddress, {from: userAddress}),
            'Redeem',
            {
              _to: userAddress,
              _amountFei: "37500",
              _amountTribe: "7500"
            }
          );
        });

        it('updates balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(250));
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(37500));
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(7500));
          expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(12500));
          expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(2500));
        });
      });

      describe('Both Redeem', function() {
        beforeEach(async function() {
          await this.genesisGroup.redeem(userAddress, {from: userAddress});
          await this.genesisGroup.redeem(secondUserAddress, {from: secondUserAddress});
        });

        it('updates balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(0));
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(37500));
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(7500));
          expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(12500));
          expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(2500));
          expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(0));
          expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN(0));
        });
      });
    });
  });
});