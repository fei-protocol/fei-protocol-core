const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Core = contract.fromArtifact('Core');
const Pool = contract.fromArtifact('Pool');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');

describe('Pool', function () {
  const [ userAddress, minterAddress, governorAddress, genesisGroup, secondUserAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    this.pool = await Pool.new(this.core.address);
    this.core.grantMinter(minterAddress, {from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());
    this.fei.mint(userAddress, 100, {from: minterAddress});
    this.fei.approve(this.pool.address, 10000, {from: userAddress});
    this.fei.mint(secondUserAddress, 100, {from: minterAddress});
    this.fei.approve(this.pool.address, 10000, {from: secondUserAddress});
    await this.core.allocateTribe(this.pool.address, 100000, {from: governorAddress});
    this.window = await this.pool.DURATION();
  });

  describe('Before Init', function() {
    it('deposit reverts', async function() {
      await expectRevert(this.pool.deposit(10000, {from: userAddress}), "Pool: Uninitialized");
    });

    it('init reverts', async function() {
      await expectRevert(this.pool.init({from: userAddress}), "CoreRef: Still in Genesis Period");
    });
  });

  describe('Initialized', function() {
    beforeEach(async function() {
      await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
      await this.core.setGenesisPeriodEnd(0, {from: governorAddress});
      await this.core.completeGenesisGroup({from: genesisGroup});
      await this.pool.init();
      this.end = await this.pool.endTime();
    });

    it('cant init again', async function() {
      await expectRevert(this.pool.init({from: userAddress}), "Pool: Already initialized");
    });

    describe('Immediately', function() {
      it('none released', async function() {
        expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(100000));
        expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
      });
      describe('With Deposit', function() {
        beforeEach(async function() {
          expectEvent(
            await this.pool.deposit(100, {from: userAddress}),
            'Deposit',
            {
              _account: userAddress,
              _amountFei: '100'
            }
          );
          this.latest = await time.latest();
          this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
        });
        it('updates balances', async function() {
          expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
          expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(100));
        });
        describe('Halfway', function() {
          beforeEach(async function() {
            await time.increase(this.window.div(new BN(2)));
          });
          it('some released', async function() {
            expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(24999));
            expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(75001));
          });
          describe('Another Deposit', function() {
            beforeEach(async function() {
              await this.pool.deposit(100, {from: secondUserAddress});
              this.latest = await time.latest();
              this.expectedPoolFeiSecond = this.end.sub(this.latest).mul(new BN(100));
            });

            it('updates balances', async function() {
              expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedPoolFeiSecond);
              expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
              expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
              expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(100));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw({from: userAddress});
                  await this.pool.withdraw({from: secondUserAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(100000));
                  expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(66666));
                  expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(33334));
                });
              });
            });
            describe('Withdraw', function() {
              beforeEach(async function() {
                expectEvent(
                  await this.pool.withdraw({from: userAddress}),
                  'Withdraw',
                  {
                    _account: userAddress,
                    _amountFei: '100',
                    _amountTribe: '75001'
                  }
                );
              });
              it('updates balances', async function() {
                expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond);
                expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
                expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(75001));
                expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(75001));
              });
              describe('Complete', function() {
                beforeEach(async function() {
                  await time.increase(this.window.div(new BN(2)));
                });
                it('remainder released', async function() {
                  expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(24999));
                });
                describe('Withdraw', function() {
                  beforeEach(async function() {
                    await this.pool.withdraw({from: secondUserAddress});
                  });
                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(100000));
                    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(24999));
                  });
                });
              });
            });
            describe('Claim', function() {
              beforeEach(async function() {
                expectEvent(
                  await this.pool.claim(userAddress, {from: userAddress}),
                  'Claim',
                  {
                    _account: userAddress,
                    _amountTribe: '75001'
                  }
                );
                this.latest = await time.latest();
                this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
              });
              it('updates balances', async function() {
                expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
                expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
                expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
                expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(100));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(75001));
                expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(75001));
              });
              describe('Complete', function() {
                beforeEach(async function() {
                  await time.increase(this.window.div(new BN(2)));
                });
                it('remainder released', async function() {
                  expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(24999));
                });
                describe('Withdraw', function() {
                  beforeEach(async function() {
                    await this.pool.withdraw({from: userAddress});
                    await this.pool.withdraw({from: secondUserAddress});
                  });
                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(100000));
                    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(87500));
                    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(12500));
                  });
                });
              });
            });
          });

          describe('Transfer', function() {
            beforeEach(async function() {
              this.balance = await this.pool.balanceOf(userAddress);
              this.halfBalance = this.balance.div(new BN(2));
              await this.pool.transfer(secondUserAddress, this.halfBalance, {from: userAddress});
            });
            it('updates balances', async function() {
              expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.halfBalance);
              expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.halfBalance);
              expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.balance);
              expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
              expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(50));
              expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(50));
              expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(75001));
              expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(0));
              expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw({from: userAddress});
                  await this.pool.withdraw({from: secondUserAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(50));
                  expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(150));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.feiBalances(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(100000));
                  expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(50000));
                  expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(50000));
                });
              });
            });
          });
        });
      });
      describe('No Deposit', function() {
        describe('Halfway', function() {
          beforeEach(async function() {
            await time.increase(this.window.div(new BN(2)));
          });
          it('some released', async function() {
            expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(24999));
            expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(75001));
          });
          describe('With Deposit', function() {
            beforeEach(async function() {
              await this.pool.deposit(100, {from: userAddress});
              this.latest = await time.latest();
              this.expectedPoolFei = this.end.sub(this.latest).mul(new BN(100));
            });

            it('updates balances', async function() {
              expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFei);
              expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFei);
              expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
              expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(100));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw({from: userAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.feiBalances(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimed()).to.be.bignumber.equal(new BN(100000));
                  expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100000));
                });
              });
            });
          });
          describe('No Deposit', function() {
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window);
              });
              it('some released', async function() {
                expect(await this.pool.unreleasedTribe()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedTribe()).to.be.bignumber.equal(new BN(100000));
              });
            });
          });
        });
      });
    });
  });
});