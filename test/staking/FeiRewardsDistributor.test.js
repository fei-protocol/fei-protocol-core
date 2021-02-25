const {
    userAddress,
    governorAddress,
    BN,
    expectEvent,
    expectRevert,
    time,
    expect,
    Fei,
    Tribe,
    MockStakingRewards,
    FeiRewardsDistributor,
    MockERC20,
    getCore,
    expectApprox
  } = require('../helpers');

  describe('FeiRewardsDistributor', function () {

    beforeEach(async function () {
      
      this.core = await getCore(true);
      await this.core.init({from: governorAddress});
  
      this.fei = await Fei.at(await this.core.fei());
      this.tribe = await Tribe.at(await this.core.tribe());
  
      this.decimals = new BN('1000000000000000000');
      this.frequency = new BN('100000000000');
      this.window = new BN('10000000000000'); // 100x frequency

      this.rewardAmount = new BN('100000').mul(this.decimals);
      this.incentiveAmount = new BN('100').mul(this.decimals);

      this.staking = await MockStakingRewards.new();

      this.distributor = await FeiRewardsDistributor.new(
          this.core.address,
          this.staking.address,
          this.window,
          this.frequency,
          this.incentiveAmount
      );
      
      await this.core.grantMinter(this.distributor.address, {from: governorAddress});
      await this.core.allocateTribe(this.distributor.address, this.rewardAmount, {from: governorAddress});
    });
  
    describe('Init', function() {
      it('paused', async function() {
        expect(await this.distributor.paused()).to.be.equal(false);
      });

      it('stakingContract', async function() {
        expect(await this.distributor.stakingContract()).to.be.equal(this.staking.address);
      });
  
      it('distributedRewards', async function() {
        expect(await this.distributor.distributedRewards()).to.be.bignumber.equal(new BN('0'));
      });
  
      it('dripFrequency', async function() {
        expect(await this.distributor.dripFrequency()).to.be.bignumber.equal(this.frequency);
      });
  
      it('duration', async function() {
        expect(await this.distributor.duration()).to.be.bignumber.equal(this.window);
      });
  
      it('incentiveAmount', async function() {
        expect(await this.distributor.incentiveAmount()).to.be.bignumber.equal(this.incentiveAmount);
      });
  
      it('releasedReward', async function() {
        await expectApprox(await this.distributor.releasedReward(), new BN('0'));
      });

      it('totalReward', async function() {
        expect(await this.distributor.totalReward()).to.be.bignumber.equal(this.rewardAmount);
      });

      it('rewardBalance', async function() {
        expect(await this.distributor.rewardBalance()).to.be.bignumber.equal(this.rewardAmount);
      });

      it('unreleasedReward', async function() {
        await expectApprox(await this.distributor.unreleasedReward(), this.rewardAmount);
      });
    });

    describe('governorWithdrawTribe', function() {
        describe('Non-governor', function() {
            it('reverts', async function() {
                await expectRevert(this.distributor.governorWithdrawTribe(this.rewardAmount, {from: userAddress}), "CoreRef: Caller is not a governor");
            });
        });

        describe('Governor', function() {
            beforeEach(async function() {
                expectEvent(
                    await this.distributor.governorWithdrawTribe(this.rewardAmount, {from: governorAddress}),
                    'TribeWithdraw',
                    {
                        _amount: this.rewardAmount
                    }
                );
            });
            it('updates balances', async function() {
               expect(await this.distributor.tribeBalance()).to.be.bignumber.equal(new BN('0'));
            });
        });
    });

    describe('governorRecover', function() {
        beforeEach(async function() {
            this.token = await MockERC20.new();
            this.recoverAmount = new BN('5555');
            this.token.mint(this.staking.address, this.recoverAmount);
        });

        describe('Non-governor', function() {
            it('reverts', async function() {
                await expectRevert(this.distributor.governorRecover(this.token.address, userAddress, this.recoverAmount, {from: userAddress}), "CoreRef: Caller is not a governor");
            });
        });

        describe('Governor', function() {
            beforeEach(async function() {
                await this.distributor.governorRecover(this.token.address, userAddress, this.recoverAmount, {from: governorAddress})
            });

            it('updates balances', async function() {
               expect(await this.token.balanceOf(this.staking.address)).to.be.bignumber.equal(new BN('0'));
               expect(await this.token.balanceOf(userAddress)).to.be.bignumber.equal(this.recoverAmount);
            });
        });
    });

    describe('setDripFrequency', function() {
        describe('Non-governor', function() {
            it('reverts', async function() {
                await expectRevert(this.distributor.setDripFrequency(this.frequency, {from: userAddress}), "CoreRef: Caller is not a governor");
            });
        });

        describe('Governor', function() {
            beforeEach(async function() {
                expectEvent(
                    await this.distributor.setDripFrequency(this.frequency.div(new BN('2')), {from: governorAddress}),
                    'FrequencyUpdate',
                    {
                        _frequency: this.frequency.div(new BN('2'))
                    }
                );
            });
            it('updates frequency', async function() {
               expect(await this.distributor.dripFrequency()).to.be.bignumber.equal(this.frequency.div(new BN('2')));
            });
        });
    });

    describe('setIncentiveAmount', function() {
        describe('Non-governor', function() {
            it('reverts', async function() {
                await expectRevert(this.distributor.setIncentiveAmount(this.incentiveAmount, {from: userAddress}), "CoreRef: Caller is not a governor");
            });
        });

        describe('Governor', function() {
            beforeEach(async function() {
                expectEvent(
                    await this.distributor.setIncentiveAmount(this.incentiveAmount.div(new BN('2')), {from: governorAddress}),
                    'IncentiveUpdate',
                    {
                        _incentiveAmount: this.incentiveAmount.div(new BN('2'))
                    }
                );
            });
            it('updates incentive amount', async function() {
               expect(await this.distributor.incentiveAmount()).to.be.bignumber.equal(this.incentiveAmount.div(new BN('2')));
            });
        });
    });

    describe('setStakingContract', function() {
        describe('Non-governor', function() {
            it('reverts', async function() {
                await expectRevert(this.distributor.setStakingContract(userAddress, {from: userAddress}), "CoreRef: Caller is not a governor");
            });
        });

        describe('Governor', function() {
            beforeEach(async function() {
                expectEvent(
                    await this.distributor.setStakingContract(userAddress, {from: governorAddress}),
                    'StakingContractUpdate',
                    {
                        _stakingContract: userAddress
                    }
                );
            });
            it('updates incentive amount', async function() {
               expect(await this.distributor.stakingContract()).to.be.equal(userAddress);
            });
        });
    });

    describe('drip', function() {

        describe('Paused', function() {
            it('reverts', async function() {
              await this.distributor.pause({from: governorAddress});
              await expectRevert(this.distributor.drip(), "Pausable: paused");
            });
        });

        describe('immediate', function() {
            describe('before frequency', function() {
                it('reverts', async function() {
                    await expectRevert(this.distributor.drip({from: userAddress}), "FeiRewardsDistributor: Not passed drip frequency");
                });
            });
            describe('after frequency', function() {
                beforeEach(async function() {
                    await time.increase(this.frequency);

                    this.expectedDrip = this.rewardAmount.mul(new BN('199')).div(new BN('10000'));
                    this.tribeBefore = await this.distributor.tribeBalance();
                    expectEvent(
                        await this.distributor.drip({from: userAddress}),
                        'Drip',
                        {
                            _caller: userAddress                        
                        }
                    );
                });
                it('updates balances', async function() {
                    await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.expectedDrip));
                    await expectApprox(await this.tribe.balanceOf(this.staking.address), this.expectedDrip);
                    await expectApprox(await this.distributor.distributedRewards(), this.expectedDrip);
                    await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                    await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                    await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.expectedDrip));
                });
    
                it('incentivizes', async function() {
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount);
                });

                describe('second', function() {
                    beforeEach(async function() {
                        await time.increase(this.frequency.mul(new BN('1')));

                        this.secondExpectedDrip = this.rewardAmount.mul(new BN('197')).div(new BN('10000'));
                        this.totalDrip = this.expectedDrip.add(this.secondExpectedDrip);
                        this.tribeBefore = await this.distributor.tribeBalance();
                        expectEvent(
                            await this.distributor.drip({from: userAddress}),
                            'Drip',
                            {
                                _caller: userAddress                            
                            }
                        );
                    });
                    it('updates balances', async function() {
                        await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.secondExpectedDrip));
                        await expectApprox(await this.tribe.balanceOf(this.staking.address), this.totalDrip);
                        await expectApprox(await this.distributor.distributedRewards(), this.totalDrip);
                        await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                        await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                        await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.secondExpectedDrip));
                    });

                    it('incentivizes', async function() {
                        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount.mul(new BN('2')));
                    });
                });
            });
        });

        describe('10%', function() {
            describe('after frequency', function() {
                beforeEach(async function() {
                    await time.increase(this.frequency.mul(new BN('10')));

                    this.expectedDrip = this.rewardAmount.mul(new BN('19')).div(new BN('100'));
                    this.tribeBefore = await this.distributor.tribeBalance();
                    expectEvent(
                        await this.distributor.drip({from: userAddress}),
                        'Drip',
                        {
                            _caller: userAddress                        
                        }
                    );
                });
                it('updates balances', async function() {
                    await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.expectedDrip));
                    await expectApprox(await this.tribe.balanceOf(this.staking.address), this.expectedDrip);
                    await expectApprox(await this.distributor.distributedRewards(), this.expectedDrip);
                    await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                    await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                    await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.expectedDrip));
                });
    
                it('incentivizes', async function() {
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount);
                });

                describe('second', function() {
                    beforeEach(async function() {
                        await time.increase(this.frequency.mul(new BN('10')));

                        this.secondExpectedDrip = this.rewardAmount.mul(new BN('17')).div(new BN('100'));
                        this.totalDrip = this.expectedDrip.add(this.secondExpectedDrip);
                        this.tribeBefore = await this.distributor.tribeBalance();
                        expectEvent(
                            await this.distributor.drip({from: userAddress}),
                            'Drip',
                            {
                                _caller: userAddress                            
                            }
                        );
                    });
                    it('updates balances', async function() {
                        await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.secondExpectedDrip));
                        await expectApprox(await this.tribe.balanceOf(this.staking.address), this.totalDrip);
                        await expectApprox(await this.distributor.distributedRewards(), this.totalDrip);
                        await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                        await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                        await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.secondExpectedDrip));
                    });

                    it('incentivizes', async function() {
                        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount.mul(new BN('2')));
                    });
                });
            });
        });

        describe('25%', function() {
            describe('after frequency', function() {
                beforeEach(async function() {
                    await time.increase(this.frequency.mul(new BN('25')));

                    this.expectedDrip = this.rewardAmount.mul(new BN('4375')).div(new BN('10000'));
                    this.tribeBefore = await this.distributor.tribeBalance();
                    expectEvent(
                        await this.distributor.drip({from: userAddress}),
                        'Drip',
                        {
                            _caller: userAddress                        
                        }
                    );
                });
                it('updates balances', async function() {
                    await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.expectedDrip));
                    await expectApprox(await this.tribe.balanceOf(this.staking.address), this.expectedDrip);
                    await expectApprox(await this.distributor.distributedRewards(), this.expectedDrip);
                    await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                    await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                    await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.expectedDrip));
                });
    
                it('incentivizes', async function() {
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount);
                });

                describe('second', function() {
                    beforeEach(async function() {
                        await time.increase(this.frequency.mul(new BN('25')));

                        this.secondExpectedDrip = this.rewardAmount.mul(new BN('3125')).div(new BN('10000'));
                        this.totalDrip = this.expectedDrip.add(this.secondExpectedDrip);
                        this.tribeBefore = await this.distributor.tribeBalance();
                        expectEvent(
                            await this.distributor.drip({from: userAddress}),
                            'Drip',
                            {
                                _caller: userAddress                            
                            }
                        );
                    });
                    it('updates balances', async function() {
                        await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.secondExpectedDrip));
                        await expectApprox(await this.tribe.balanceOf(this.staking.address), this.totalDrip);
                        await expectApprox(await this.distributor.distributedRewards(), this.totalDrip);
                        await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                        await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                        await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.secondExpectedDrip));
                    });

                    it('incentivizes', async function() {
                        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount.mul(new BN('2')));
                    });
                });
            });
        });

        describe('50%', function() {
            describe('after frequency', function() {
                beforeEach(async function() {
                    await time.increase(this.frequency.mul(new BN('50')));

                    this.expectedDrip = this.rewardAmount.mul(new BN('7500')).div(new BN('10000'));
                    this.tribeBefore = await this.distributor.tribeBalance();
                    expectEvent(
                        await this.distributor.drip({from: userAddress}),
                        'Drip',
                        {
                            _caller: userAddress                        
                        }
                    );
                });
                it('updates balances', async function() {
                    await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.expectedDrip));
                    await expectApprox(await this.tribe.balanceOf(this.staking.address), this.expectedDrip);
                    await expectApprox(await this.distributor.distributedRewards(), this.expectedDrip);
                    await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                    await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                    await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.expectedDrip));
                });
    
                it('incentivizes', async function() {
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount);
                });

                describe('second', function() {
                    beforeEach(async function() {
                        await time.increase(this.frequency.mul(new BN('50')));

                        this.secondExpectedDrip = this.rewardAmount.mul(new BN('2500')).div(new BN('10000'));
                        this.totalDrip = this.expectedDrip.add(this.secondExpectedDrip);
                        this.tribeBefore = await this.distributor.tribeBalance();
                        expectEvent(
                            await this.distributor.drip({from: userAddress}),
                            'Drip',
                            {
                                _caller: userAddress                            
                            }
                        );
                    });
                    it('updates balances', async function() {
                        await expectApprox(await this.distributor.rewardBalance(), new BN('0'));
                        await expectApprox(await this.tribe.balanceOf(this.staking.address), this.totalDrip);
                        await expectApprox(await this.distributor.distributedRewards(), this.totalDrip);
                        await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                        await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                        await expectApprox(await this.distributor.unreleasedReward(), new BN('0'));
                    });

                    it('incentivizes', async function() {
                        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount.mul(new BN('2')));
                    });
                });
            });
        });

        describe('100%', function() {
            describe('after frequency', function() {
                beforeEach(async function() {
                    await time.increase(this.window);

                    this.expectedDrip = this.rewardAmount;
                    this.tribeBefore = await this.distributor.tribeBalance();
                    expectEvent(
                        await this.distributor.drip({from: userAddress}),
                        'Drip',
                        {
                            _caller: userAddress                        
                        }
                    );
                });
                it('updates balances', async function() {
                    await expectApprox(await this.distributor.rewardBalance(), this.tribeBefore.sub(this.expectedDrip));
                    await expectApprox(await this.tribe.balanceOf(this.staking.address), this.expectedDrip);
                    await expectApprox(await this.distributor.distributedRewards(), this.expectedDrip);
                    await expectApprox(await this.distributor.totalReward(), this.rewardAmount);
                    await expectApprox(await this.distributor.releasedReward(), new BN('0'));
                    await expectApprox(await this.distributor.unreleasedReward(), this.tribeBefore.sub(this.expectedDrip));
                });
    
                it('incentivizes', async function() {
                    expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.incentiveAmount);
                });

                describe('second', function() {
                    it('reverts', async function() {
                        await time.increase(this.window);
                        await expectRevert(this.distributor.drip({from: userAddress}), "FeiRewardsDistributor: no rewards");
                    });
                });
            });
        });
    });
});
  