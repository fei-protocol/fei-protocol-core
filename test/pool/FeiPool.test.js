const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Core = contract.fromArtifact('Core');
const FeiPool = contract.fromArtifact('FeiPool');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');

describe('Pool', function () {
  const [ userAddress, minterAddress, governorAddress, genesisGroup, secondUserAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    await this.core.init({from: governorAddress});

    this.window = new BN(2 * 365 * 24 * 60 * 60);
    this.tribe = await Tribe.at(await this.core.tribe());
    this.fei = await Fei.at(await this.core.fei());

    // Using FEI instead of LP tokens as same effect
    this.pool = await FeiPool.new(this.core.address, this.fei.address, this.window);

    this.core.grantMinter(minterAddress, {from: governorAddress});
    this.fei.mint(userAddress, 100, {from: minterAddress});
    this.fei.approve(this.pool.address, 10000, {from: userAddress});
    this.fei.mint(secondUserAddress, 100, {from: minterAddress});
    this.fei.approve(this.pool.address, 10000, {from: secondUserAddress});
    await this.core.allocateTribe(this.pool.address, 100000, {from: governorAddress});
  });

  describe('Governor Withdraw', function() {
    it('non-governor reverts', async function() {
      await expectRevert(this.pool.governorWithdraw(10000, {from: userAddress}), "CoreRef: Caller is not a governor");
    });

    it('governor succeeds', async function() {
      await this.pool.governorWithdraw(10000, {from: governorAddress});
      expect(await this.tribe.balanceOf(this.pool.address)).to.be.bignumber.equal('90000');
    });
  });

  describe('Before Init', function() {
    it('deposit reverts', async function() {
      await expectRevert(this.pool.deposit(userAddress, 10000, {from: userAddress}), "Pool: Uninitialized");
    });

    it('init reverts', async function() {
      await expectRevert(this.pool.init({from: userAddress}), "CoreRef: Still in Genesis Period");
    });
  });

  describe('Initialized', function() {
    beforeEach(async function() {
      await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
      await this.core.completeGenesisGroup({from: genesisGroup});
      await this.pool.init();
      this.end = (await this.pool.startTime()).add(await this.window);
    });

    it('cant init again', async function() {
      await expectRevert(this.pool.init({from: userAddress}), "Pool: Already initialized");
    });

    describe('Immediately', function() {
      it('none released', async function() {
        expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(100000));
        expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
      });
      describe('Deposit To', function() {
        beforeEach(async function() {
          expectEvent(
            await this.pool.deposit(secondUserAddress, 100, {from: userAddress}),
            'Deposit',
            {
              _from: userAddress,
              _to: secondUserAddress,
              _amountStaked: '100'
            }
          );
          this.latest = await time.latest();
          this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
        });
        it('updates balances', async function() {
          expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
          expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(100));
        });
      });
      describe('With Deposit', function() {
        beforeEach(async function() {
          expectEvent(
            await this.pool.deposit(userAddress, 100, {from: userAddress}),
            'Deposit',
            {
              _from: userAddress,
              _to: userAddress,
              _amountStaked: '100'
            }
          );
          this.latest = await time.latest();
          this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
        });

        it('too much deposit reverts', async function() {
          let amount = await this.fei.balanceOf(userAddress);
          await expectRevert(this.pool.deposit(userAddress, amount.add(new BN('1')), {from: userAddress}), "Pool: Balance too low to stake");
        });

        it('updates balances', async function() {
          expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiFirst);
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
          expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
          expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(100));
        });
        describe('Halfway', function() {
          beforeEach(async function() {
            await time.increase(this.window.div(new BN(2)));
          });
          it('some released', async function() {
            expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(24999));
            expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(75001));
          });
          describe('Another Deposit', function() {
            beforeEach(async function() {
              await this.pool.deposit(secondUserAddress, 100, {from: secondUserAddress});
              this.latest = await time.latest();
              this.expectedPoolFeiSecond = this.end.sub(this.latest).mul(new BN(100));
            });

            it('updates balances', async function() {
              expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(this.expectedPoolFeiSecond);
              expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
              expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
              expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(100));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw(userAddress, {from: userAddress});
                  await this.pool.withdraw(secondUserAddress, {from: secondUserAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(100000));
                  expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(66666));
                  expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(33334));
                });
              });
            });
            describe('Withdraw', function() {
              beforeEach(async function() {
                this.withdraw = await this.pool.withdraw(userAddress, {from: userAddress}); 

              });

              it('has event', async function() {
                expectEvent(
                  this.withdraw,
                  'Withdraw',
                  {
                    _from: userAddress,
                    _to: userAddress,
                    _amountStaked: '100',
                    _amountReward: '75001'
                  }
                );
              });

              it('updates balances', async function() {
                expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond);
                expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
                expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(75001));
                expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(75001));
              });
              describe('Complete', function() {
                beforeEach(async function() {
                  await time.increase(this.window.div(new BN(2)));
                });
                it('remainder released', async function() {
                  expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(24999));
                });
                describe('Withdraw', function() {
                  beforeEach(async function() {
                    await this.pool.withdraw(secondUserAddress, {from: secondUserAddress});
                  });
                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(100000));
                    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(24999));
                  });
                });
              });
            });
            describe('Withdraw To', function() {
              beforeEach(async function() {
                this.withdraw = await this.pool.withdraw(secondUserAddress, {from: userAddress})
              });

              it('has event', async function() {
                expectEvent(
                  this.withdraw,
                  'Withdraw',
                  {
                    _from: userAddress,
                    _to: secondUserAddress,
                    _amountStaked: '100',
                    _amountReward: '75001'
                  }
                );
              });

              it('updates balances', async function() {
                expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond);
                expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));

                expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
                expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(75001));
                expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(75001));
              });
            });
            describe('Claim', function() {
              beforeEach(async function() {
                this.claim = await this.pool.claim(userAddress, userAddress, {from: userAddress});
                this.latest = await time.latest();
                this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
              });

              it('has event', async function() {
                expectEvent(this.claim,
                  'Claim',
                  {
                    _from: userAddress,
                    _to: userAddress,
                    _amountReward: '75001'
                  }
                );
              });
              it('updates balances', async function() {
                expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
                expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
                expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
                expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(100));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(75001));
                expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(75001));
              });
              describe('Complete', function() {
                beforeEach(async function() {
                  await time.increase(this.window.div(new BN(2)));
                });
                it('remainder released', async function() {
                  expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(24999));
                });
                describe('Withdraw', function() {
                  beforeEach(async function() {
                    await this.pool.withdraw(userAddress, {from: userAddress});
                    await this.pool.withdraw(secondUserAddress, {from: secondUserAddress});
                  });
                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(100000));
                    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(87500));
                    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(12500));
                  });
                });
              });
            });
            describe('External Claim', function() {
              describe('Claim For', function() {
                describe('Approved', function() {
                  beforeEach(async function() {
                    let balance = await this.pool.balanceOf(userAddress);
                    await this.pool.approve(secondUserAddress, balance, {from: userAddress});
                    this.claim = await this.pool.claim(userAddress, userAddress, {from: secondUserAddress});
                    this.latest = await time.latest();
                    this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
                  });

                  it('has event', async function() {
                    expectEvent(
                      this.claim,
                      'Claim',
                      {
                        _from: userAddress,
                        _to: userAddress,
                        _amountReward: '75001'
                      }
                    );
                  });

                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
                    expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(75001));
                    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(75001));
                  });
                });
                describe('Not Approved', function() {
                  it('reverts', async function() {
                    await expectRevert(
                      this.pool.claim(userAddress, userAddress, {from: secondUserAddress}),
                      'ERC20: burn amount exceeds allowance'
                    );
                  });
                });
              });

              describe('Claim To', function() {
                describe('Approved', function() {
                  beforeEach(async function() {
                    let balance = await this.pool.balanceOf(userAddress);
                    await this.pool.approve(secondUserAddress, balance, {from: userAddress});
                    this.claim = await this.pool.claim(userAddress, secondUserAddress, {from: secondUserAddress});
                    this.latest = await time.latest();
                    this.expectedPoolFeiFirst = this.end.sub(this.latest).mul(new BN(100));
                  });

                  it('has event', async function() {
                    expectEvent(
                      this.claim,
                      'Claim',
                      {
                        _from: userAddress,
                        _to: secondUserAddress,
                        _amountReward: '75001'
                      }
                    );
                  });

                  it('second claim reverts', async function() {
                    await expectRevert(this.pool.claim(userAddress, secondUserAddress, {from: secondUserAddress}), "Pool: User has no redeemable pool tokens");
                  });

                  it('updates balances', async function() {
                    expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFeiFirst);
                    expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFeiSecond.add(this.expectedPoolFeiFirst));
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(200));
                    expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(100));
                    expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                    expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(75001));
                    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(75001));
                  });
                });
                describe('Not Approved', function() {
                  it('reverts', async function() {
                    await expectRevert(
                      this.pool.claim(userAddress, secondUserAddress, {from: secondUserAddress}),
                      'ERC20: burn amount exceeds allowance'
                    );
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
              expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(50));
              expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(50));
              expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(75001));
              expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(0));
              expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw(userAddress, {from: userAddress});
                  await this.pool.withdraw(secondUserAddress, {from: secondUserAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(50));
                  expect(await this.fei.balanceOf(secondUserAddress)).to.be.bignumber.equal(new BN(150));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.stakedBalance(secondUserAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(100000));
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
            expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(24999));
            expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(75001));
          });
          describe('With Deposit', function() {
            beforeEach(async function() {
              await this.pool.deposit(userAddress, 100, {from: userAddress});
              this.latest = await time.latest();
              this.expectedPoolFei = this.end.sub(this.latest).mul(new BN(100));
            });

            it('updates balances', async function() {
              expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(this.expectedPoolFei);
              expect(await this.pool.totalSupply()).to.be.bignumber.equal(this.expectedPoolFei);
              expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
              expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(100));
              expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(100));
            });
            describe('Complete', function() {
              beforeEach(async function() {
                await time.increase(this.window.div(new BN(2)));
              });
              it('remainder released', async function() {
                expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(100000));
              });
              describe('Withdraw', function() {
                beforeEach(async function() {
                  await this.pool.withdraw(userAddress, {from: userAddress});
                });
                it('updates balances', async function() {
                  expect(await this.pool.balanceOf(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.totalSupply()).to.be.bignumber.equal(new BN(0));
                  expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100));
                  expect(await this.fei.balanceOf(this.pool.address)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.stakedBalance(userAddress)).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(0));
                  expect(await this.pool.claimedRewards()).to.be.bignumber.equal(new BN(100000));
                  expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN(100000));
                });
              });
              describe('Deposit', function() {
                it('reverts', async function() {
                  await this.fei.mint(userAddress, '100', {from: minterAddress});
                  await expectRevert(this.pool.deposit(userAddress, '100', {from: userAddress}), "Pool: Window has ended");
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
                expect(await this.pool.unreleasedReward()).to.be.bignumber.equal(new BN(0));
                expect(await this.pool.releasedReward()).to.be.bignumber.equal(new BN(100000));
              });
            });
          });
        });
      });
    });
  });
});