const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time, balance } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockIDO = contract.fromArtifact('MockIDO');
const MockBondingCurve = contract.fromArtifact('MockBondingCurve');
const Core = contract.fromArtifact('Core');
const GenesisGroup = contract.fromArtifact('GenesisGroup');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');

describe('GenesisGroup', function () {
  const [ userAddress, secondUserAddress, governorAddress, minterAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());
    this.bc = await MockBondingCurve.new(false, 10);
    this.ido = await MockIDO.new();
    this.genesisGroup = await GenesisGroup.new(this.core.address, this.bc.address, this.ido.address);

    this.core.allocateTribe(this.genesisGroup.address, 10000, {from: governorAddress});
    this.core.setGenesisGroup(this.genesisGroup.address, {from: governorAddress});
    this.core.grantMinter(minterAddress, {from: governorAddress});
    // 5:1 FEI to TRIBE ratio
    this.fei.mint(this.genesisGroup.address, 50000, {from: minterAddress});
  });

  describe('Purchase', function() {
    describe('During Genesis Period', function() {
      beforeEach(async function() {
        let latest = await time.latest();
        await this.core.setGenesisPeriodEnd(latest.add(new BN(1000)), {from: governorAddress});
      });
      describe('No value', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.purchase(userAddress, {from: userAddress, value: 0}), "GenesisGroup: no value sent");
        });
      });
      describe('With value', function() {
        beforeEach(async function() {
          await this.genesisGroup.purchase(userAddress, {from: userAddress, value: 1000});
        });
        it('Updates balances', async function() {
          expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(1000));
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(1000));
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(1000));
        });
        describe('Second Purchase', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(secondUserAddress, {from: secondUserAddress, value: 1000});
          });
          it('Updates balances', async function() {
            expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(new BN(2000));
            expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(1000));
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(2000));
          });
        });
      });
    });
  });

  describe('Redeem', function() {
    beforeEach(async function() {
      let latest = await time.latest();
      await this.core.setGenesisPeriodEnd(latest.add(new BN(1000)), {from: governorAddress});
      // 3/4 first user
      await this.genesisGroup.purchase(userAddress, {from: userAddress, value: 3000});
      await this.genesisGroup.purchase(secondUserAddress, {from: secondUserAddress, value: 1000});
    });
    describe('During Genesis Period', function() {
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.redeem(userAddress, {from: userAddress}), "CoreRef: Still in Genesis Period");
      });
    });

    describe('After Genesis Period', function() {
      beforeEach(async function() {
        let latest = await time.latest();
        await this.core.setGenesisPeriodEnd(latest.sub(new BN(1000)), {from: governorAddress});
        await this.genesisGroup.launch();
      });
      describe('Single Redeem', function() {
        beforeEach(async function() {
          await this.genesisGroup.redeem(userAddress, {from: userAddress});
        });

        it('updates balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(1000));
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

  describe('Get Amount Out', function() {
    beforeEach(async function() {
      let latest = await time.latest();
      await this.core.setGenesisPeriodEnd(latest.add(new BN(1000)), {from: governorAddress});
    });    
    describe('Inclusive', function() {
      describe('No existing', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.getAmountOut(1000, true), "GenesisGroup: Not enough supply");
        });
      });

      describe('Existing', function() {
        beforeEach(async function() {
          await this.genesisGroup.purchase(userAddress, {from: userAddress, value: 1000});
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
          await this.genesisGroup.purchase(userAddress, {from: userAddress, value: 1000});
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
    describe('During Genesis Period', function() {
      beforeEach(async function() {
        let latest = await time.latest();
        await this.core.setGenesisPeriodEnd(latest.add(new BN(1000)), {from: governorAddress});
      });

      it('reverts', async function() {
        await expectRevert(this.genesisGroup.launch(), "Core: Still in Genesis Period or caller is not Genesis Group");
      });
    });

    describe('After Genesis Period', function() {
      beforeEach(async function() {
        let latest = await time.latest();
        await this.core.setGenesisPeriodEnd(latest.add(new BN(1000)), {from: governorAddress});
        await this.genesisGroup.purchase(userAddress, {from: userAddress, value: 1000});
        await this.core.setGenesisPeriodEnd(latest.sub(new BN(1000)), {from: governorAddress});
        await this.genesisGroup.launch();
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
      })
    });
  });
});