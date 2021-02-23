const { contract } = require('@openzeppelin/test-environment');

const FlashGenesis = contract.fromArtifact("FlashGenesis");

const {
  userAddress,
  secondUserAddress,
  governorAddress,
  minterAddress,
  BN,
  expectEvent,
  expectRevert,
  balance,
  time,
  expect,
  Tribe,
  Fei,
  MockIDO,
  MockBondingCurve,
  GenesisGroup,
  MockBondingCurveOracle,
  getCore,
  forceEth
} = require('../helpers');


describe('GenesisGroup', function () {

  beforeEach(async function () {
    this.core = await getCore(false);
    
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());
    this.bc = await MockBondingCurve.new(false, 10);
    this.ido = await MockIDO.new(this.tribe.address, 10, this.fei.address);
    this.bo = await MockBondingCurveOracle.new();

    this.duration = new BN('1000');
    this.exchangeRateDiscount = new BN('10');
    this.genesisGroup = await GenesisGroup.new(this.core.address, this.bc.address, this.ido.address, this.bo.address, this.duration, this.exchangeRateDiscount);

    this.tribeGenesisAmount = new BN('10000');
    await this.core.allocateTribe(this.genesisGroup.address, this.tribeGenesisAmount, {from: governorAddress});
    await this.core.allocateTribe(this.ido.address, 10000000, {from: governorAddress});

    await this.core.setGenesisGroup(this.genesisGroup.address, {from: governorAddress});
    // 5:1 FEI to TRIBE ratio

    this.genesisFeiAmount = new BN('50000');
    this.fei.mint(this.genesisGroup.address, this.genesisFeiAmount, {from: minterAddress});
    this.flashGenesis = await FlashGenesis.new(this.genesisGroup.address);
  });

  describe('Init', function() {
    it('totalCommittedFGEN', async function() {
      expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN(0));
    });

    it('isTimeEnded', async function() {
      expect(await this.genesisGroup.isTimeEnded()).to.be.equal(false);
    });

    describe('getAmountOut', function() {  
      describe('Inclusive', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.getAmountOut(1000, true), "GenesisGroup: Not enough supply");
        });
      });

      describe('Exclusive', function() {
        it('succeeds', async function() {
          let result = await this.genesisGroup.getAmountOut(500, false);
          expect(result[0]).to.be.bignumber.equal(new BN(5000));
          expect(result[1]).to.be.bignumber.equal(new BN(10000));
        });
      });
    });

    describe('getAmountsToRedeem', function() {
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.getAmountsToRedeem(userAddress), "CoreRef: Still in Genesis Period");
      });
    });
  });

  describe('Purchase', function() {
    describe('During Genesis Period', function() {
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
          this.purchaseAmount = new BN('1000');
          expectEvent(
            await this.genesisGroup.purchase(userAddress, this.purchaseAmount, {from: userAddress, value: this.purchaseAmount}),
            'Purchase',
            {
              _to: userAddress,
              _value: "1000"
            }
          );
        });

        it('updates user balances', async function() {
          expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(this.purchaseAmount);
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.purchaseAmount);
        });

        it('updates totals', async function() {
          expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(this.purchaseAmount);
        });

        describe('Second Purchase', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(userAddress, this.purchaseAmount, {from: userAddress, value: this.purchaseAmount});
          });
          it('updates user balances', async function() {
            expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });

          it('updates totals', async function() {
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('Purchase To', function() {
          beforeEach(async function() {
            await this.genesisGroup.purchase(secondUserAddress, this.purchaseAmount, {from: userAddress, value: this.purchaseAmount});
          });

          it('updates user balances', async function() {
            expect(await balance.current(this.genesisGroup.address)).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
            expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.purchaseAmount);
          });

          it('updates totals', async function() {
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(this.purchaseAmount.mul(new BN(2)));
          });
        });

        describe('getAmountOut', function() {  
          describe('Inclusive', function() {
            it('succeeds', async function() {
              let result = await this.genesisGroup.getAmountOut(500, true);
              expect(result[0]).to.be.bignumber.equal(new BN(5000));
              expect(result[1]).to.be.bignumber.equal(new BN(5000));
            });
          });

          describe('Exclusive', function() {
            it('succeeds', async function() {
              let result = await this.genesisGroup.getAmountOut(1000, false);
              expect(result[0]).to.be.bignumber.equal(new BN(10000));
              expect(result[1]).to.be.bignumber.equal(new BN(5000));
            });
          });
        });
      });
    });

    describe('Post Genesis Period', function() {
      beforeEach(async function() {
        await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
        await this.genesisGroup.purchase(secondUserAddress, 250, {from: secondUserAddress, value: 250});
        await time.increase('2000');
      });
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.purchase(userAddress, 100, {from: userAddress, value: 100}), "GenesisGroup: Not in Genesis Period");
      });
    });
  });

  describe('Flash Launch', function() {
    beforeEach(async function() {
      await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
      await time.increase('2000');
    });

    it('reverts', async function() {
      await this.genesisGroup.approve(this.flashGenesis.address, '750', {from: userAddress});
      await expectRevert(this.flashGenesis.zap(userAddress), "GenesisGroup: No redeeming in launch block");
    });
  });
  describe('Launch', function() {
    describe('During Genesis Period', function() {
      beforeEach(async function() {
        await this.genesisGroup.purchase(userAddress, 1000, {from: userAddress, value: 1000});
      });

      it('reverts', async function() {
        await expectRevert(this.genesisGroup.launch(), "GenesisGroup: Still in Genesis Period");
      });
    });
    
    describe('Post Genesis Period', function() {
      describe('Without Pre-Commits', function() {
        beforeEach(async function() {
          await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
          await this.genesisGroup.purchase(secondUserAddress, 250, {from: secondUserAddress, value: 250});
          await time.increase('2000');
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
    
        it('allocates bonding curve', async function() {
          expect(await this.bc.allocated()).to.be.equal(true);
        });
    
        it('deploys IDO', async function() {
          expect(await this.ido.ratio()).to.be.bignumber.equal(new BN('5000000000000000000').div(new BN(10)));
        });

        it('no swaps', async function() {
          expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.genesisFeiAmount);
        });
  
        it('inits Bonding Curve Oracle', async function() {
          expect(await this.bo.initPrice()).to.be.bignumber.equal(new BN('100000000000000000'));
        });
    
        describe('Second Launch', function() {
          it('reverts', async function() {
            await expectRevert(this.genesisGroup.launch(), "Core: Genesis Group already complete");
          });
        });
      });
      describe('With Pre-Commits', function() {
        beforeEach(async function() {
          await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
          await this.genesisGroup.commit(userAddress, userAddress, '500', {from: userAddress});
          await this.genesisGroup.purchase(secondUserAddress, 250, {from: secondUserAddress, value: 250});
          await time.increase('2000');
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
    
        it('allocates bonding curve', async function() {
          expect(await this.bc.allocated()).to.be.equal(true);
        });
    
        it('deploys IDO', async function() {
          expect(await this.ido.ratio()).to.be.bignumber.equal(new BN('5000000000000000000').div(new BN(10)));
        });

        it('swaps', async function() {
          expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.genesisFeiAmount.div(new BN('2')));
        });
  
        it('inits Bonding Curve Oracle', async function() {
          expect(await this.bo.initPrice()).to.be.bignumber.equal(new BN('100000000000000000'));
        });
      });
    });
  });

  describe('Redeem', function() {
    describe('During Genesis Period', function() {
      it('reverts', async function() {
        await expectRevert(this.genesisGroup.redeem(userAddress, {from: userAddress}), "CoreRef: Still in Genesis Period");
      });
    });

    describe('Post Genesis Period', function() {
      describe('Without Commit', function() {
        beforeEach(async function() {
          this.userFGEN = new BN('750');
          this.secondUserFGEN = new BN('250');
          await this.genesisGroup.purchase(userAddress, this.userFGEN, {from: userAddress, value: this.userFGEN});
          await this.genesisGroup.purchase(secondUserAddress, this.secondUserFGEN, {from: secondUserAddress, value: this.secondUserFGEN});
          await time.increase(this.duration);
          expectEvent(
            await this.genesisGroup.launch(),
            'Launch',
            {}
          );
        });

        describe('External Redeem', function() {
          describe('Approved', function() {
            beforeEach(async function() {
              await this.genesisGroup.approve(secondUserAddress, this.userFGEN, {from: userAddress});
              this.expectedUserFei = new BN('37500');
              this.expectedUserTribe = new BN('7500');
              let redeemedAmounts = await this.genesisGroup.getAmountsToRedeem(userAddress);
              expect(redeemedAmounts[0]).to.be.bignumber.equal(this.expectedUserFei);
              expect(redeemedAmounts[1]).to.be.bignumber.equal(this.expectedUserTribe);
              expect(redeemedAmounts[2]).to.be.bignumber.equal(new BN('0'));
              expectEvent(
                await this.genesisGroup.redeem(userAddress, {from: secondUserAddress}),
                'Redeem',
                {
                  _to: userAddress,
                  _amountFei: this.expectedUserFei,
                  _amountTribe: this.expectedUserTribe
                }
              );
            });

            it('updates user balances', async function() {
              expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedUserFei);
              expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedUserTribe);
              expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN(0));
            });

            it('updates totals', async function() {
              expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(250));
              expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.genesisFeiAmount.sub(this.expectedUserFei));
              expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.tribeGenesisAmount.sub(this.expectedUserTribe));
              expect(await this.genesisGroup.totalCommittedTribe()).to.be.bignumber.equal(new BN('0'));
              expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
            });
          });

          describe('Not Approved', function() {
            it('reverts', async function() {
              await expectRevert(
                this.genesisGroup.redeem(userAddress, {from: secondUserAddress}),
                'GenesisGroup: burn amount exceeds allowance'
              );
            });
          });
        });

        describe('Single Redeem', function() {
          beforeEach(async function() {
            this.expectedUserFei = new BN('37500');
            this.expectedUserTribe = new BN('7500');
            let redeemedAmounts = await this.genesisGroup.getAmountsToRedeem(userAddress);
            expect(redeemedAmounts[0]).to.be.bignumber.equal(this.expectedUserFei);
            expect(redeemedAmounts[1]).to.be.bignumber.equal(this.expectedUserTribe);
            expect(redeemedAmounts[2]).to.be.bignumber.equal(new BN('0'));
            expectEvent(
              await this.genesisGroup.redeem(userAddress, {from: userAddress}),
              'Redeem',
              {
                _to: userAddress,
                _amountFei: this.expectedUserFei,
                _amountTribe: this.expectedUserTribe
              }
            );
          });

          it('updates user balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedUserFei);
            expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedUserTribe);
            expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN(0));
          });

          it('updates totals', async function() {
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(250));
            expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.genesisFeiAmount.sub(this.expectedUserFei));
            expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.tribeGenesisAmount.sub(this.expectedUserTribe));
            expect(await this.genesisGroup.totalCommittedTribe()).to.be.bignumber.equal(new BN('0'));
            expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
          });

          it('nothing left to redeem', async function() {
            let remaining = await this.genesisGroup.getAmountsToRedeem(userAddress);
            expect(remaining.feiAmount).to.be.bignumber.equal(new BN('0'));
            expect(remaining.genesisTribe).to.be.bignumber.equal(new BN('0'));
            expect(remaining.idoTribe).to.be.bignumber.equal(new BN('0'));
          });

          describe('Second redeem', function() {
            it('reverts', async function() {
              await expectRevert(this.genesisGroup.redeem(userAddress, {from: userAddress}), "GenesisGroup: No redeemable TRIBE");
            });
          });

          describe('Other redeem', function() {
            beforeEach(async function() {
              this.expectedUserFei = new BN('12500');
              this.expectedUserTribe = new BN('2500');
              let redeemedAmounts = await this.genesisGroup.getAmountsToRedeem(secondUserAddress);
              expect(redeemedAmounts[0]).to.be.bignumber.equal(this.expectedUserFei);
              expect(redeemedAmounts[1]).to.be.bignumber.equal(this.expectedUserTribe);
              expect(redeemedAmounts[2]).to.be.bignumber.equal(new BN('0'));
              expectEvent(
                await this.genesisGroup.redeem(secondUserAddress, {from: secondUserAddress}),
                'Redeem',
                {
                  _to: secondUserAddress,
                  _amountFei: this.expectedUserFei,
                  _amountTribe: this.expectedUserTribe
                }
              );
            });

            it('updates user balances', async function() {
              expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedUserFei);
              expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedUserTribe);
              expect(await this.genesisGroup.committedFGEN(secondUserAddress)).to.be.bignumber.equal(new BN(0));
            });
    
            it('updates totals', async function() {
              expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN('0'));
              expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN('0'));
              expect(await this.genesisGroup.totalCommittedTribe()).to.be.bignumber.equal(new BN('0'));
              expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
            });
          });
        });
      });
      describe('With Commit', function() {
        beforeEach(async function() {
          this.userFGEN = new BN('750');
          this.secondUserFGEN = new BN('250');
          await this.genesisGroup.purchase(userAddress, this.userFGEN, {from: userAddress, value: this.userFGEN});
          await this.genesisGroup.commit(userAddress, userAddress, '500', {from: userAddress});
          await this.genesisGroup.purchase(secondUserAddress, this.secondUserFGEN, {from: secondUserAddress, value: this.secondUserFGEN});
          await this.genesisGroup.commit(secondUserAddress, secondUserAddress, this.secondUserFGEN, {from: secondUserAddress});

          await time.increase(this.duration);
          expectEvent(
            await this.genesisGroup.launch(),
            'Launch',
            {}
          );
        });

        describe('Single Redeem', function() {
          beforeEach(async function() {
            this.expectedUserFei = new BN('12500');
            this.expectedIDOFei = new BN('25000');
            this.expectedUserTribe = new BN('7500');
            this.expectedUserCommittedTribe = new BN('250000');
            this.expectedSecondUserCommittedTribe = new BN('125000');
            this.totalGenesisTribe = this.tribeGenesisAmount.add(this.expectedUserCommittedTribe).add(this.expectedSecondUserCommittedTribe);
            this.totalExpectedUserTribe = this.expectedUserTribe.add(this.expectedUserCommittedTribe);
            let redeemedAmounts = await this.genesisGroup.getAmountsToRedeem(userAddress);
            expect(redeemedAmounts[0]).to.be.bignumber.equal(this.expectedUserFei);
            expect(redeemedAmounts[1]).to.be.bignumber.equal(this.expectedUserTribe);
            expect(redeemedAmounts[2]).to.be.bignumber.equal(this.expectedUserCommittedTribe);
            expectEvent(
              await this.genesisGroup.redeem(userAddress, {from: userAddress}),
              'Redeem',
              {
                _to: userAddress,
                _amountFei: this.expectedUserFei,
                _amountTribe: this.totalExpectedUserTribe
              }
            );
          });

          it('updates user balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedUserFei);
            expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.totalExpectedUserTribe);
            expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN(0));
          });

          it('updates totals', async function() {
            expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(0));
            expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(this.totalGenesisTribe.sub(this.totalExpectedUserTribe));
            expect(await this.genesisGroup.totalCommittedTribe()).to.be.bignumber.equal(this.expectedSecondUserCommittedTribe);
            expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.secondUserFGEN);
          });

          it('nothing left to redeem', async function() {
            let remaining = await this.genesisGroup.getAmountsToRedeem(userAddress);
            expect(remaining.feiAmount).to.be.bignumber.equal(new BN('0'));
            expect(remaining.genesisTribe).to.be.bignumber.equal(new BN('0'));
            expect(remaining.idoTribe).to.be.bignumber.equal(new BN('0'));
          });

          describe('Second redeem', function() {
            it('reverts', async function() {
              await expectRevert(this.genesisGroup.redeem(userAddress, {from: userAddress}), "GenesisGroup: No redeemable TRIBE");
            });
          });

          describe('Other redeem', function() {
            beforeEach(async function() {
              this.expectedUserFei = new BN('0');
              this.expectedUserTribe = new BN('2500');
              this.expectedUserCommittedTribe = new BN('125000');
              this.totalExpectedUserTribe = this.expectedUserTribe.add(this.expectedUserCommittedTribe);
              let redeemedAmounts = await this.genesisGroup.getAmountsToRedeem(secondUserAddress);
              expect(redeemedAmounts[0]).to.be.bignumber.equal(this.expectedUserFei);
              expect(redeemedAmounts[1]).to.be.bignumber.equal(this.expectedUserTribe);
              expect(redeemedAmounts[2]).to.be.bignumber.equal(this.expectedUserCommittedTribe);
              expectEvent(
                await this.genesisGroup.redeem(secondUserAddress, {from: secondUserAddress}),
                'Redeem',
                {
                  _to: secondUserAddress,
                  _amountFei: this.expectedUserFei,
                  _amountTribe: this.totalExpectedUserTribe
                }
              );
            });

            it('updates user balances', async function() {
              expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedUserFei);
              expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.totalExpectedUserTribe);
              expect(await this.genesisGroup.committedFGEN(secondUserAddress)).to.be.bignumber.equal(new BN(0));
            });
    
            it('updates totals', async function() {
              expect(await this.genesisGroup.totalSupply()).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN('0'));
              expect(await this.tribe.balanceOf(this.genesisGroup.address)).to.be.bignumber.equal(new BN('0'));
              expect(await this.genesisGroup.totalCommittedTribe()).to.be.bignumber.equal(new BN('0'));
              expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
            });

            it('nothing left to redeem', async function() {
              let remaining = await this.genesisGroup.getAmountsToRedeem(userAddress);
              expect(remaining.feiAmount).to.be.bignumber.equal(new BN('0'));
              expect(remaining.genesisTribe).to.be.bignumber.equal(new BN('0'));
              expect(remaining.idoTribe).to.be.bignumber.equal(new BN('0'));
            });
          });
        });
      });
    });
  });

  describe('Pre-Commit', function() {
    beforeEach(async function() {
      this.userFGEN = new BN('750');
      this.secondUserFGEN = new BN('250');
      await this.genesisGroup.purchase(userAddress, this.userFGEN, {from: userAddress, value: this.userFGEN});
      await this.genesisGroup.purchase(secondUserAddress, this.secondUserFGEN, {from: secondUserAddress, value: this.secondUserFGEN});
    });

    describe('Single Commit', function() {
      describe('Self commit', function() {
        beforeEach(async function() {
          this.userCommittedFGEN = new BN('500');
          await this.genesisGroup.commit(userAddress, userAddress, this.userCommittedFGEN, {from: userAddress});
        });

        it('updates user balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.userFGEN.sub(this.userCommittedFGEN));
          expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(this.userCommittedFGEN);
        });

        it('updates totals', async function() {
          expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.userCommittedFGEN);
        });

        describe('Second commit', function() {
          describe('Enough', function() {
            beforeEach(async function() {
              await this.genesisGroup.commit(userAddress, userAddress, '250', {from: userAddress});
            });
  
            it('updates user balances', async function() {
              expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal('0');
              expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(this.userFGEN);
            });

            it('updates totals', async function() {
              expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.userFGEN);
            });
          });

          describe('Not enough', function() {
            it('reverts', async function() {
              await expectRevert(this.genesisGroup.commit(userAddress, userAddress, '500', {from: userAddress}), "ERC20: burn amount exceeds balance");
            });
          });
        });
      });

      describe('Commit to', async function() {
        beforeEach(async function() {
          this.userCommittedFGEN = new BN('500');
          await this.genesisGroup.commit(userAddress, secondUserAddress, this.userCommittedFGEN, {from: userAddress});
        });

        it('updates user balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.userFGEN.sub(this.userCommittedFGEN));
          expect(await this.genesisGroup.committedFGEN(secondUserAddress)).to.be.bignumber.equal(this.userCommittedFGEN);
          expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal('0');
        });

        it('updates totals', async function() {
          expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.userCommittedFGEN);
        });
      });

      describe('Approved commit', function() {
        beforeEach(async function() {
          await this.genesisGroup.approve(secondUserAddress, this.userFGEN, {from: userAddress});
          this.userCommittedFGEN = new BN('500');
          await this.genesisGroup.commit(userAddress, userAddress, this.userCommittedFGEN, {from: secondUserAddress});
        });
        it('updates user balances', async function() {
          expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.userFGEN.sub(this.userCommittedFGEN));
          expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(this.userCommittedFGEN);
          expect(await this.genesisGroup.committedFGEN(secondUserAddress)).to.be.bignumber.equal('0');
          expect(await this.genesisGroup.allowance(userAddress, secondUserAddress)).to.be.bignumber.equal(this.userFGEN.sub(this.userCommittedFGEN));
        });

        it('updates totals', async function() {
          expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.userCommittedFGEN);
        });
      });

      describe('Unapproved commit', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.commit(userAddress, userAddress, '500', {from: secondUserAddress}), "GenesisGroup: burn amount exceeds allowance");
        });
      });
    });

    describe('Double Commit', function() {

      beforeEach(async function() {
        this.userCommittedFGEN = new BN('500');
        this.secondUserCommittedFGEN = new BN('250');
        await this.genesisGroup.commit(userAddress, userAddress, this.userCommittedFGEN , {from: userAddress});
        await this.genesisGroup.commit(secondUserAddress, secondUserAddress, this.secondUserCommittedFGEN, {from: secondUserAddress});
      });

      it('updates user balances', async function() {
        expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal(this.userFGEN.sub(this.userCommittedFGEN));
        expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(this.userCommittedFGEN);

        expect(await this.genesisGroup.balanceOf(secondUserAddress)).to.be.bignumber.equal('0');
        expect(await this.genesisGroup.committedFGEN(secondUserAddress)).to.be.bignumber.equal(this.secondUserCommittedFGEN);
      });

      it('updates totals', async function() {
        expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(this.secondUserCommittedFGEN.add(this.userCommittedFGEN));
      });
     
      describe('Redeem', function() {
        beforeEach(async function() {
          await time.increase(this.duration);
          await this.genesisGroup.launch();
          await this.genesisGroup.redeem(userAddress, {from: userAddress});
          await this.genesisGroup.redeem(secondUserAddress, {from: secondUserAddress});
        })

        it('updates user balances', async function() {
          expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal('257500');
          expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal('127500');        
        });

        it('updates totals', async function() {
          expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal('0');
        });
      });
    });

    describe('Post Genesis Period', function() {
      beforeEach(async function() {
        await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
        await time.increase(this.duration);
      });

      it('reverts', async function() {
        await expectRevert(this.genesisGroup.commit(userAddress, userAddress, 100, {from: userAddress}), "GenesisGroup: Not in Genesis Period");
      });
    });
  });

  describe('Exit', function() {
    describe('During Genesis Period', function() {
      it('reverts', async function() {
        await this.genesisGroup.purchase(userAddress, 750, {from: userAddress, value: 750});
        await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: userAddress}), "GenesisGroup: Not in exit window");
      });
    });

    describe('Post Genesis Period', function() {
      beforeEach(async function() {
        this.userFGEN = new BN('750');
        this.userCommittedFGEN = new BN('500');
        this.secondUserFGEN = new BN('250');
        await this.genesisGroup.purchase(userAddress, this.userFGEN, {from: userAddress, value: this.userFGEN});
        await this.genesisGroup.commit(userAddress, userAddress, this.userCommittedFGEN, {from: userAddress});
        await this.genesisGroup.purchase(secondUserAddress, this.secondUserFGEN, {from: secondUserAddress, value: this.secondUserFGEN});
        await time.increase(this.duration);
      });

      describe('Before window', function() {
        it('reverts', async function() {
          await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: userAddress}), "GenesisGroup: Not in exit window");
        });
      }); 

      describe('After window', function() {
        beforeEach(async function() {
          await time.increase('300000'); // over escape window
        });

        describe('With Launch', function() {
          beforeEach(async function() {
            expectEvent(
              await this.genesisGroup.launch(),
              'Launch',
              {}
            );
          });

          it('no ETH in contract reverts', async function() {
            await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: userAddress}), "GenesisGroup: Launch already happened");
          });
      
          it('forced ETH in contract reverts', async function() {
            await forceEth(this.genesisGroup.address, new BN('100000000000'));
            await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: userAddress}), "GenesisGroup: Launch already happened");
          });
        });

        describe('Self exit', async function() {
          beforeEach(async function() {
            this.genesisEthBefore = await balance.current(this.genesisGroup.address);
            await this.genesisGroup.emergencyExit(userAddress, userAddress, {from: userAddress});
          });

          it('updates user balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal('0');
            expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN('0'));
          });

          it('updates genesis balances', async function() {
            let genesisEthAfter = await balance.current(this.genesisGroup.address);
            expect(this.genesisEthBefore.sub(genesisEthAfter)).to.be.bignumber.equal(this.userFGEN);
            expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
          });

          describe('Second exit', function() {
            it('reverts', async function() {
              await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: secondUserAddress}), "GenesisGroup: No FGEN or committed balance");
            });
          });
        });

        describe('Exit to', async function() {
          beforeEach(async function() {
            this.genesisEthBefore = await balance.current(this.genesisGroup.address);
            this.secondUserEthBefore = await balance.current(secondUserAddress);
            await this.genesisGroup.emergencyExit(userAddress, secondUserAddress, {from: userAddress});
          });

          it('updates user balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal('0');
            let secondUserEthAfter = await balance.current(secondUserAddress);
            expect(secondUserEthAfter.sub(this.secondUserEthBefore)).to.be.bignumber.equal(this.userFGEN);
            expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN('0'));
          });

          it('updates genesis balances', async function() {
            let genesisEthAfter = await balance.current(this.genesisGroup.address);
            expect(this.genesisEthBefore.sub(genesisEthAfter)).to.be.bignumber.equal(this.userFGEN);
            expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
          });
        });

        describe('Approved exit', function() {
          beforeEach(async function() {
            this.genesisEthBefore = await balance.current(this.genesisGroup.address);
            await this.genesisGroup.approve(secondUserAddress, this.userFGEN, {from: userAddress});
            this.userEthBefore = await balance.current(userAddress);
            await this.genesisGroup.emergencyExit(userAddress, userAddress, {from: secondUserAddress});
          });

          it('updates user balances', async function() {
            expect(await this.genesisGroup.balanceOf(userAddress)).to.be.bignumber.equal('0');
            let userEthAfter = await balance.current(userAddress);
            expect(userEthAfter.sub(this.userEthBefore)).to.be.bignumber.equal(this.userFGEN);
            expect(await this.genesisGroup.allowance(userAddress, secondUserAddress)).to.be.bignumber.equal('500');
            expect(await this.genesisGroup.committedFGEN(userAddress)).to.be.bignumber.equal(new BN('0'));
          });

          it('updates genesis balances', async function() {
            let genesisEthAfter = await balance.current(this.genesisGroup.address);
            expect(this.genesisEthBefore.sub(genesisEthAfter)).to.be.bignumber.equal(this.userFGEN);
            expect(await this.genesisGroup.totalCommittedFGEN()).to.be.bignumber.equal(new BN('0'));
          });

          describe('Second exit', function() {
            it('reverts', async function() {
              await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: secondUserAddress}), "GenesisGroup: No FGEN or committed balance");
            });
          });
        });

        describe('Unapproved exit', function() {
          it('reverts', async function() {
            await expectRevert(this.genesisGroup.emergencyExit(userAddress, userAddress, {from: secondUserAddress}), "GenesisGroup: Not approved for emergency withdrawal");
          });
        });
      });
    });
  });
});