const {
  userAddress,
  secondUserAddress,
  beneficiaryAddress1,
  beneficiaryAddress2,
  governorAddress,
  keeperAddress,
  BN,
  expectEvent,
  expectRevert,
  balance,
  time,
  expect,
  MockEthPCVDeposit,
  Fei,
  MockOracle, 
  EthBondingCurve,
  getCore
} = require('../helpers');

describe('EthBondingCurve', function () {

  beforeEach(async function () {
    
    this.core = await getCore(true);
    await this.core.init({from: governorAddress});

    this.fei = await Fei.at(await this.core.fei());
    
    this.oracle = await MockOracle.new(500); // 500 USD per ETH exchange rate 
    this.pcvDeposit1 = await MockEthPCVDeposit.new(beneficiaryAddress1);
    this.pcvDeposit2 = await MockEthPCVDeposit.new(beneficiaryAddress2);

    this.scale = new BN('100000000000');
    this.buffer = new BN('100');
    this.incentiveAmount = new BN('100');
    this.incentiveDuration = new BN('10');
    this.bondingCurve = await EthBondingCurve.new(this.scale, this.core.address, [this.pcvDeposit1.address, this.pcvDeposit2.address], [9000, 1000], this.oracle.address, this.incentiveDuration, this.incentiveAmount);
    await this.core.grantMinter(this.bondingCurve.address, {from: governorAddress});
  });

  describe('Init', function() {
    it('average price', async function() {
      expect((await this.bondingCurve.getAveragePrice('50000000'))[0]).to.be.equal('628090883348720719'); // about .63c
    });

    it('current price', async function() {
      expect((await this.bondingCurve.getCurrentPrice())[0]).to.be.equal('1000000000000000000000'); // .50c
    });

    it('getAmountOut', async function() {
      expect(await this.bondingCurve.getAmountOut('50000000')).to.be.bignumber.equal(new BN('39803156936'));
    });

    it('scale', async function() {
        expect(await this.bondingCurve.scale()).to.be.bignumber.equal(this.scale);
        expect(await this.bondingCurve.atScale()).to.be.equal(false);
    });

    it('getTotalPCVHeld', async function() {
      expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(new BN('0'));
    });

    it('totalPurchased', async function() {
      expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN('0'));
    });

    it('buffer', async function() {
      expect(await this.bondingCurve.buffer()).to.be.bignumber.equal(this.buffer);
      expect(await this.bondingCurve.BUFFER_GRANULARITY()).to.be.bignumber.equal('10000');
    });

    it('incentive amount', async function() {
      expect(await this.bondingCurve.incentiveAmount()).to.be.bignumber.equal(this.incentiveAmount);
    });
  });

  describe('Purchase', function() {
    beforeEach(async function() {
      this.purchaseAmount = new BN("50000000");
    });

    describe('Incorrect ETH sent', function() {
      it('Too little ETH', async function() {
        await expectRevert(this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: "100"}), "Bonding Curve: Sent value does not equal input");
      });
      it('Too much ETH', async function() {
        await expectRevert(this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: "1000000000000000000"}), "Bonding Curve: Sent value does not equal input");
      });
    });
    describe('Correct ETH sent', function() {

      describe('Invalid Oracle', function() {
        it('reverts', async function() {
          this.oracle.setValid(false);
          await expectRevert(this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}), "OracleRef: oracle invalid");     
        })
      });

      describe('Pre Scale', function() {
        beforeEach(async function() {
          this.expectedFei1 = new BN("39803156936");
          expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei1);
          expectEvent(
            await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
            'Purchase',
            {
              _to: userAddress,
              _amountIn: this.purchaseAmount,
              _amountOut: this.expectedFei1
            }
          );
        });

        it('correct FEI sent', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedFei1);
        });

        it('totalPurchased', async function() {
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.expectedFei1);
        });

        it('not at Scale', async function() {
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
        });
        
        it('current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("675107326290411445459");
        });

        it('total PCV held', async function() {
          expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount);
        });

        describe('Second Purchase', function() {
          beforeEach(async function() {
            this.expectedFei2 = new BN("30724780139");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: userAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });

          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('not at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("566516174074936002475");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('Purchase To', function() {
          beforeEach(async function() {
            this.expectedFei2 = new BN("30724780139");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(secondUserAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: secondUserAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });

          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedFei1);
            expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedFei2);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('not at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("566516174074936002475");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('Oracle Price Change', function() {
          beforeEach(async function() {
            // 20% reduction in exchange rate
            await this.oracle.setExchangeRate(400);
            this.expectedFei2 = new BN("24979417811");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: userAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });

          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('not at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("466294208163864714813");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });
      });

      describe('Crossing Scale Beyond Buffer', function() {
        beforeEach(async function() {
          expect((await this.bondingCurve.getAveragePrice("2000000000")).value).to.be.equal("1010101010101010101");
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
          await this.bondingCurve.purchase(userAddress, "2000000000", {value: "2000000000"});
        });

        it('registers scale cross', async function() {
          // Uses bonding curve for entire trade
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(990000000000));
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN(990000000000));
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
        });

        it('Correct current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("495000000000000000000");
        });
      });
      
      describe('Crossing Scale', function() {
        beforeEach(async function() {
          this.expectedFei1 = new BN("121386199964");
          this.purchaseAmount =  new BN("200000000");
          expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei1);
          expectEvent(
            await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
            'Purchase',
            {
              _to: userAddress,
              _amountIn: this.purchaseAmount,
              _amountOut: this.expectedFei1
            }
          );
        });

        it('correct FEI sent', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedFei1);
        });

        it('totalPurchased', async function() {
          expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.expectedFei1);
        });

        it('At Scale', async function() {
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
        });
        
        it('current price', async function() {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("495000000000000000000");
        });

        it('total PCV held', async function() {
          expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount);
        });

        describe('Post Scale', function() {
          beforeEach(async function() {
            this.expectedFei2 = new BN("99000000000");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: userAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });
  
          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("495000000000000000000");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('Buffer Change', function() {
          beforeEach(async function() {
            // 5% buffer
            await this.bondingCurve.setBuffer(500, {from: governorAddress});
            this.expectedFei2 = new BN("95000000000");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: userAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });
  
          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("475000000000000000000");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('Oracle Price Change', function() {
          beforeEach(async function() {
            // 20% decrease
            await this.oracle.setExchangeRate(600);
            this.expectedFei2 = new BN("118800000000");
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.bignumber.equal(this.expectedFei2);
            expectEvent(
              await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount}),
              'Purchase',
              {
                _to: userAddress,
                _amountIn: this.purchaseAmount,
                _amountOut: this.expectedFei2
              }
            );
          });
  
          it('correct FEI sent', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('totalPurchased', async function() {
            expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(this.totalExpected);
          });
  
          it('at Scale', async function() {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });
          
          it('current price', async function() {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal("594000000000000000000");
          });
  
          it('total PCV held', async function() {
            expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });
      });
    });
  });

  describe('Allocate', function() {

    describe('Pre Launch', function() {
      beforeEach(async function() {
        this.core = await getCore(false);
        await this.core.init({from: governorAddress});
        await this.bondingCurve.setCore(this.core.address, {from: governorAddress});
      });

      it('reverts', async function() {
        await expectRevert(this.bondingCurve.allocate({from: keeperAddress}), "CoreRef: Still in Genesis Period"); 
      });
    });

    describe('No Purchase', function() {
      it('reverts', async function() {
        await expectRevert(this.bondingCurve.allocate({from: keeperAddress}), "BondingCurve: No PCV held"); 
      });
    });

    describe('With Purchase', function() {
      beforeEach(async function () {
        this.purchaseAmount = new BN("1000000000000000000")
        this.beneficiaryBalance1 = await balance.current(beneficiaryAddress1);
        this.beneficiaryBalance2 = await balance.current(beneficiaryAddress2);

        this.keeperFei = await this.fei.balanceOf(keeperAddress);

        await time.increase(this.incentiveDuration);

        await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount});
        expectEvent(await this.bondingCurve.allocate({from: keeperAddress}),
          'Allocate',
          {
            _caller: keeperAddress,
            _amount: this.purchaseAmount
          }
        ); 
      });

      it('splits funds', async function() {
        expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("900000000000000000")));
        expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("100000000000000000")));
      });
        
      it('incentivizes', async function() {
        expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal(this.keeperFei.add(this.incentiveAmount));
      });

      describe('Second Allocate', async function() {
        describe('No Purchase', function() {
          it('reverts', async function() {
            await expectRevert(this.bondingCurve.allocate({from: keeperAddress}), "BondingCurve: No PCV held"); 
          });
        });

        describe('With Purchase Before Window', function() {
          beforeEach(async function () {
            this.beneficiaryBalance1 = await balance.current(beneficiaryAddress1);
            this.beneficiaryBalance2 = await balance.current(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);

            await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount});
            expectEvent(await this.bondingCurve.allocate({from: keeperAddress}),
              'Allocate',
              {
                _caller: keeperAddress,
                _amount: this.purchaseAmount
              }
            ); 
          });
    
          it('splits funds', async function() {
            expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("900000000000000000")));
            expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("100000000000000000")));
          });
            
          it('no incentives', async function() {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal(this.keeperFei);
          });
        });

        describe('With Purchase After Window', function() {
          beforeEach(async function () {
            this.beneficiaryBalance1 = await balance.current(beneficiaryAddress1);
            this.beneficiaryBalance2 = await balance.current(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);

            await time.increase(this.incentiveDuration);
            await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount});
            expectEvent(await this.bondingCurve.allocate({from: keeperAddress}),
              'Allocate',
              {
                _caller: keeperAddress,
                _amount: this.purchaseAmount
              }
            ); 
          });
    
    
          it('splits funds', async function() {
            expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("900000000000000000")));
            expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("100000000000000000")));
          });
            
          it('incentivizes', async function() {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal(this.keeperFei.add(this.incentiveAmount));
          });
        });

        describe('Updated Allocation', function() {
          beforeEach(async function() {
            this.beneficiaryBalance1 = await balance.current(beneficiaryAddress1);
            this.beneficiaryBalance2 = await balance.current(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);

            await time.increase(this.incentiveDuration);
            await this.bondingCurve.setAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000], {from: governorAddress});
            await this.bondingCurve.purchase(userAddress, this.purchaseAmount, {value: this.purchaseAmount});
            expectEvent(await this.bondingCurve.allocate({from: keeperAddress}),
              'Allocate',
              {
                _caller: keeperAddress,
                _amount: this.purchaseAmount
              }
            ); 
          });
  
          it('splits funds', async function() {
            expect(await balance.current(beneficiaryAddress1)).to.be.bignumber.equal(this.beneficiaryBalance1.add(new BN("500000000000000000")));
            expect(await balance.current(beneficiaryAddress2)).to.be.bignumber.equal(this.beneficiaryBalance2.add(new BN("500000000000000000")));
          });
          
          it('incentivizes', async function() {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.bignumber.equal(this.keeperFei.add(this.incentiveAmount));
          });
        });
      });
    });
  });

  describe('PCV Allocation', function() {
    it('Mismatched lengths revert', async function() {
      await expectRevert(this.bondingCurve.checkAllocation([this.pcvDeposit1.address], [9000, 1000]), "PCVSplitter: PCV Deposits and ratios are different lengths");
    });

    it('Incomplete allocation rule reverts', async function() {
      await expectRevert(this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [9000, 2000]), "PCVSplitter: ratios do not total 100%");
    });

    it('Correct allocation rule succeeds', async function() {
      expect(await this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000])).to.be.equal(true);
    });

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