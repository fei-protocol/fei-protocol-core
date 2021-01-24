const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockOracle = contract.fromArtifact('MockOracle');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');

describe('EthBondingCurve', function () {
  const [ userAddress, beneficiaryAddress1, beneficiaryAddress2, governorAddress, genesisGroup, keeperAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    await this.core.completeGenesisGroup({from: genesisGroup});

    this.fei = await Fei.at(await this.core.fei());
    this.oracle = await MockOracle.new(500); // 500 USD per ETH exchange rate 
    this.pcvDeposit1 = await MockEthPCVDeposit.new(beneficiaryAddress1);
    this.pcvDeposit2 = await MockEthPCVDeposit.new(beneficiaryAddress2);
    this.bondingCurve = await EthBondingCurve.new('100000000000', this.core.address, [this.pcvDeposit1.address, this.pcvDeposit2.address], [9000, 1000], this.oracle.address, 10, '100');
    await this.core.grantMinter(this.bondingCurve.address, {from: governorAddress});
  });

  describe('Purchase', function() {
    describe('Average Price', function() {
      it('is accurate', async function() {
        expect((await this.bondingCurve.getAveragePrice('50000000'))[0]).to.be.equal('628095921919610746'); // about .48
      });
    });
    describe('Incorrect ETH sent', function() {
      it('Too little ETH', async function() {
        await expectRevert(this.bondingCurve.purchase(userAddress, "1000000000000000000", {value: "100"}), "Bonding Curve: Sent value does not equal input");
      });
      it('Too much ETH', async function() {
        await expectRevert(this.bondingCurve.purchase(userAddress, "100", {value: "1000000000000000000"}), "Bonding Curve: Sent value does not equal input");
      });
    });
    describe('Correct ETH sent', function() {

      describe('Invalid Oracle', function() {
        it('reverts', async function() {
          this.oracle.setValid(false);
          await expectRevert(this.bondingCurve.purchase(userAddress, "50000000", {value: "50000000"}), "OracleRef: oracle invalid");     
        })
      });

      describe('Pre Scale', function() {
        beforeEach(async function() {
          expectEvent(
            await this.bondingCurve.purchase(userAddress, "50000000", {value: "50000000"}),
            'Purchase',
            {
              _to: userAddress,
              _amountIn: "50000000",
              _amountOut: "39802837636"
            }
          );
        });

        it('Correct FEI sent', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(39802837636));
        });

        it('Updates total purchased', async function() {
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(39802837636));
        });

        it('stays pre-scale', async function() {
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
        });

        it('Second purchase moves along curve', async function() {
          await this.bondingCurve.purchase(beneficiaryAddress1, "50000000", {value: "50000000"});
          expect(await this.fei.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(30724360107));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(70527197743));
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
        });

        it('Changes in oracle price', async function() {
          // 20% reduction in exchange rate
          await this.oracle.setExchangeRate(400);
          await this.bondingCurve.purchase(beneficiaryAddress1, "50000000", {value: "50000000"});
          expect(await this.fei.balanceOf(beneficiaryAddress1)).to.be.bignumber.equal(new BN(24979367787));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(64782205423));
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
        });

        it('Correct current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("675107326290411445459");
        });
      });
      describe('Crossing Scale', function() {
        beforeEach(async function() {
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
          await this.bondingCurve.purchase(userAddress, "200000000", {value: "200000000"});
        });

        it('registers scale cross', async function() {
          // Uses bonding curve for entire trade
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(121385382316));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(121385382316));
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
        });

        it('Correct current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("495000000000000000000");
        });
      });
      describe('Post Scale', function() {
        beforeEach(async function() {
           // First reach scale
          await this.bondingCurve.purchase(beneficiaryAddress1, "180000000", {value: "180000000"});
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(111957235567));
          // Then buy 100 more
          await this.bondingCurve.purchase(userAddress, "100000000", {value: "100000000"});
        });

        it('Correct FEI sent', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(49500000000));
        });

        it('Updates total supply', async function() {
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(161457235567));
        });

        it('stays post-scale', async function() {
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
        });

        it('Changes in buffer', async function() {
          // 5% buffer
          await this.bondingCurve.setBuffer(500, {from: governorAddress});
          await this.bondingCurve.purchase(beneficiaryAddress2, "100000000", {value: "100000000"});
          expect(await this.fei.balanceOf(beneficiaryAddress2)).to.be.bignumber.equal(new BN(47500000000));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(208957235567));
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("475000000000000000000");
        });

        it('Changes in oracle price', async function() {
          await this.oracle.setExchangeRate(600);
          await this.bondingCurve.purchase(beneficiaryAddress2, "100000000", {value: "100000000"});
          expect(await this.fei.balanceOf(beneficiaryAddress2)).to.be.bignumber.equal(new BN(59400000000));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(220857235567));
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("594000000000000000000");
        });

        it('Correct current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("495000000000000000000");
        });
      });
    });
  });

  describe('PCV Splitter', function() {
    it('Mismatched lengths revert', async function() {
      await expectRevert(this.bondingCurve.checkAllocation([this.pcvDeposit1.address], [9000, 1000]), "PCVSplitter: PCV Deposits and ratios are different lengths");
    });

    it('Incomplete allocation rule reverts', async function() {
      await expectRevert(this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [9000, 2000]), "PCVSplitter: ratios do not total 100%");
    });

    it('Correct allocation rule succeeds', async function() {
      expect(await this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000])).to.be.equal(true);
    });

    describe('With Purchase', function() {
      beforeEach(async function () {
        this.beneficiaryBalance1 = await balance.current(beneficiaryAddress1);
        this.beneficiaryBalance2 = await balance.current(beneficiaryAddress2);
        await this.bondingCurve.purchase(userAddress, "1000000000000000000", {value: "1000000000000000000"});
      });

      describe('And Allocation', function() {
        beforeEach(async function() {
          await this.bondingCurve.allocate({from: keeperAddress}); 
        });

        it('splits funds accurately', async function() {
          expect(await this.pcvDeposit1.totalValue()).to.be.bignumber.equal(new BN("900000000000000000"));
          expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("900000000000000000")));
          expect(await this.pcvDeposit2.totalValue()).to.be.bignumber.equal(new BN("100000000000000000"));
          expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("100000000000000000")));
        });
        
        it('incentivizes', async function() {
          expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal('100');
        });

        describe('Second Allocation', async function() {
          it('no pcv reverts', async function() {
            await expectRevert(this.bondingCurve.allocate({from: keeperAddress}), "BondingCurve: No PCV held"); 
          });

          it('with pcv before period has no incentives', async function() {
            await this.bondingCurve.purchase(userAddress, "1000000000000000000", {value: "1000000000000000000"});
            await this.bondingCurve.allocate({from: keeperAddress});
            expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal('100');
          });

          it('with pcv after period has incentives', async function() {
            await time.increase('10');
            await this.bondingCurve.purchase(userAddress, "1000000000000000000", {value: "1000000000000000000"});
            await this.bondingCurve.allocate({from: keeperAddress});
            expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal('200');
          });
        });
      })

      describe('Updated Allocation', function() {
        beforeEach(async function() {
          await this.bondingCurve.setAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000], {from: governorAddress});
          await this.bondingCurve.allocate({from: keeperAddress}); 
        });

        it('splits funds accurately', async function() {
          expect(await this.pcvDeposit1.totalValue()).to.be.bignumber.equal(new BN("500000000000000000"));
          expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("500000000000000000")));
          expect(await this.pcvDeposit2.totalValue()).to.be.bignumber.equal(new BN("500000000000000000"));
          expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("500000000000000000")));
        });
        
        it('incentivizes', async function() {
          expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal('100');
        });
      })
    });
  });

  describe('Access', function() {
    describe('Oracle', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.bondingCurve.setOracle(userAddress, {from: governorAddress}),
          'OracleUpdate',
          {_oracle: userAddress}
        );
        expect(await this.bondingCurve.oracle()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.bondingCurve.setOracle(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Scale', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.bondingCurve.setScale(100, {from: governorAddress}),
          'ScaleUpdate',
          {_scale: new BN(100)}
        );
        expect(await this.bondingCurve.scale()).to.be.bignumber.equal(new BN(100));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.bondingCurve.setScale(100, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Buffer', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.bondingCurve.setBuffer(1000, {from: governorAddress}),
          'BufferUpdate',
          {_buffer: new BN(1000)}
        );
        expect(await this.bondingCurve.buffer()).to.be.bignumber.equal(new BN(1000));
      });

      it('Governor set outside range reverts', async function() {
        await expectRevert(this.bondingCurve.setBuffer(10000, {from: governorAddress}), "BondingCurve: Buffer exceeds or matches granularity");
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.bondingCurve.setBuffer(1000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('PCV Splitter', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.bondingCurve.setAllocation([this.pcvDeposit1.address], [10000], {from: governorAddress}), 
          'AllocationUpdate', 
          { _pcvDeposits : [this.pcvDeposit1.address] }
        );

        var result = await this.bondingCurve.getAllocation();
        expect(result[0].length).to.be.equal(1);
        expect(result[0][0]).to.be.equal(this.pcvDeposit1.address);
        expect(result[1].length).to.be.equal(1);
        expect(result[1][0]).to.be.bignumber.equal(new BN(10000));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.bondingCurve.setAllocation([this.pcvDeposit1.address], [10000], {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Core', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.bondingCurve.setCore(userAddress, {from: governorAddress}), 
          'CoreUpdate', 
          { _core : userAddress }
        );

        expect(await this.bondingCurve.core()).to.be.equal(userAddress);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.bondingCurve.setCore(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});