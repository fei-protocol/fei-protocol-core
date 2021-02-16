const {
	userAddress,
	minterAddress,
	burnerAddress,
	pcvControllerAddress,
	governorAddress,
	genesisGroup,
	guardianAddress,
	BN,
	expectEvent,
	expectRevert,
	expect,
	MockCoreRef,
	Tribe,
	getCore
  } = require('../helpers');

describe('Core', function () {

  beforeEach(async function () {
    this.core = await getCore(false);
    await this.core.init({from: governorAddress});
    
    this.tribe = await Tribe.at(await this.core.tribe());
    this.coreRef = await MockCoreRef.new(this.core.address);

    this.minterRole = await this.core.MINTER_ROLE();
    this.burnerRole = await this.core.BURNER_ROLE();
    this.governorRole = await this.core.GOVERN_ROLE();
    this.pcvControllerRole = await this.core.PCV_CONTROLLER_ROLE();
    this.guardianRole = await this.core.GUARDIAN_ROLE();
  });

  describe('Allocate Tribe', function() {
    it('updates', async function() {
      expectEvent(
        await this.core.allocateTribe(userAddress, 1000, {from: governorAddress}),
        'TribeAllocation',
        {
          _to : userAddress,
          _amount : '1000'
        }
      );
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal('1000');
    });

    it('not enough reverts', async function() {
      let amount = await this.tribe.balanceOf(this.core.address);
      await expectRevert(this.core.allocateTribe(userAddress, amount.add(new BN('1')), {from: governorAddress}), "Core: Not enough Tribe");
	});
	
	it('non governor reverts', async function() {
		await expectRevert(this.core.allocateTribe(userAddress, '1000', {from: userAddress}), "Permissions: Caller is not a governor");
	});
  });

  describe('Fei Update', function() {
    it('updates', async function() {
      expectEvent(
        await this.core.setFei(userAddress, {from: governorAddress}),
        'FeiUpdate',
        {
          _fei : userAddress
        }
      );
      expect(await this.core.fei()).to.be.equal(userAddress);
	});
	
	it('non governor reverts', async function() {
		await expectRevert(this.core.setFei(userAddress, {from: userAddress}), "Permissions: Caller is not a governor");
	});
  });

  describe('Tribe Update', function() {
    it('updates', async function() {
      expectEvent(
        await this.core.setTribe(userAddress, {from: governorAddress}),
        'TribeUpdate',
        {
          _tribe : userAddress
        }
      );
      expect(await this.core.tribe()).to.be.equal(userAddress);
	});
	
	it('non governor reverts', async function() {
		await expectRevert(this.core.setTribe(userAddress, {from: userAddress}), "Permissions: Caller is not a governor");
	});
  });

  describe('Genesis', function() {
    describe('Genesis Group', function() {
      it('governor set succeeds', async function() {
		expectEvent(
			await this.core.setGenesisGroup(genesisGroup, {from: governorAddress}),
			'GenesisGroupUpdate',
			{
			  _genesisGroup : genesisGroup
			}
		);
        expect(await this.core.genesisGroup()).to.be.equal(genesisGroup);
      });

      it('non-governor set reverts', async function() {
        await expectRevert(this.core.setGenesisGroup(genesisGroup, {from: userAddress}), "Permissions: Caller is not a governor");
      });
    });

    describe('Modifiers', function() {
      beforeEach(async function() {
        await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
      });

      describe('Pre Genesis Completion', function() {
        it('postGenesis reverts', async function() {
          await expectRevert(this.coreRef.testPostGenesis(), "CoreRef: Still in Genesis Period");
        });

        it('non genesis group complete fails', async function() {
          await expectRevert(this.core.completeGenesisGroup({from: userAddress}), "Core: Caller is not Genesis Group");
        });
      });

      describe('Post Genesis Completion', function() {
        beforeEach(async function() {
          expectEvent(
            await this.core.completeGenesisGroup({from: genesisGroup}),
            'GenesisPeriodComplete',
            {}
		  );
		  expect(await this.core.hasGenesisGroupCompleted()).to.be.equal(true);
        });
        it('postGenesis succeeds', async function() {
          await this.coreRef.testPostGenesis();
        });
        it('second complete reverts', async function() {
          await expectRevert(this.core.completeGenesisGroup({from: genesisGroup}), "Core: Genesis Group already complete");
        });
      });
    });
  });

  describe('Minter', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
  			it('is registered in core', async function() {
  				expect(await this.core.isMinter(minterAddress)).to.be.equal(true);
  			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeMinter(minterAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
  			});
  		});
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.minterRole, minterAddress, {from: minterAddress});
  			});

			it('is not registered in core', async function() {
				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.minterRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantMinter(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.minterRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.minterRole)).to.be.equal(this.governorRole);
  			});
  		});
  	});
  	describe('Access', function () {
  		it('onlyMinter succeeds', async function() {
  			await this.coreRef.testMinter({from: minterAddress});
  		});

  		it('onlyBurner reverts', async function() {
  			await expectRevert(this.coreRef.testBurner({from: minterAddress}), "CoreRef: Caller is not a burner");
  		});

  		it('onlyGovernor reverts', async function() {
  			await expectRevert(this.coreRef.testGovernor({from: minterAddress}), "CoreRef: Caller is not a governor");
  		});

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: minterAddress}), "CoreRef: Caller is not a PCV controller");
  		});
  	});
  });

  describe('Burner', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
  			it('is registered in core', async function() {
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(true);
  			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeBurner(burnerAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.burnerRole, burnerAddress, {from: burnerAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.burnerRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantBurner(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.burnerRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.burnerRole)).to.be.equal(this.governorRole);
  			});
  		});
  	});
  	describe('Access', function () {
  		it('onlyMinter reverts', async function() {
  			await expectRevert(this.coreRef.testMinter({from: burnerAddress}), "CoreRef: Caller is not a minter");
  		});

  		it('onlyBurner succeeds', async function() {
  			await this.coreRef.testBurner({from: burnerAddress});
  		});

  		it('onlyGovernor reverts', async function() {
  			await expectRevert(this.coreRef.testGovernor({from: burnerAddress}), "CoreRef: Caller is not a governor");
  		});

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: burnerAddress}), "CoreRef: Caller is not a PCV controller");
  		});
  	});
  });

  describe('PCV Controller', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
  			it('is registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(true);
  			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokePCVController(pcvControllerAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.pcvControllerRole, pcvControllerAddress, {from: pcvControllerAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.pcvControllerRole)).to.be.bignumber.equal(new BN(1));
  			});
  			it('updates to two', async function() {
  				await this.core.grantPCVController(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.pcvControllerRole)).to.be.bignumber.equal(new BN(2));
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.pcvControllerRole)).to.be.equal(this.governorRole);
  			});
  		});
  	});
  	describe('Access', function () {
  		it('onlyMinter reverts', async function() {
  			await expectRevert(this.coreRef.testMinter({from: pcvControllerAddress}), "CoreRef: Caller is not a minter");
  		});

  		it('onlyBurner reverts', async function() {
  			await expectRevert(this.coreRef.testBurner({from: pcvControllerAddress}), "CoreRef: Caller is not a burner");
  		});

  		it('onlyGovernor reverts', async function() {
  			await expectRevert(this.coreRef.testGovernor({from: pcvControllerAddress}), "CoreRef: Caller is not a governor");
  		});

  		it('onlyPCVController succeeds', async function() {
  			await this.coreRef.testPCVController({from: pcvControllerAddress});
  		});
  	});
  });

  describe('Governor', function () {
  	describe('Role', function () {
  		describe('Has access', function () {
  			it('is registered in core', async function() {
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(true);
  			});
  		});
  		describe('Access revoked', function () {
  			beforeEach(async function() {
  				await this.core.revokeGovernor(governorAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
  			});
  		});
  		describe('Access renounced', function() {
  			beforeEach(async function() {
  				await this.core.renounceRole(this.governorRole, governorAddress, {from: governorAddress});
  			});

  			it('is not registered in core', async function() {
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
  			});
  		});
  		describe('Member Count', function() {
  			it('is one', async function() {
  				expect(await this.core.getRoleMemberCount(this.governorRole)).to.be.bignumber.equal(new BN(2)); // gov and core
  			});
  			it('updates to two', async function() {
  				await this.core.grantGovernor(userAddress, {from: governorAddress});
  				expect(await this.core.getRoleMemberCount(this.governorRole)).to.be.bignumber.equal(new BN(3)); // gov, core, and user
  			});
  		});
  		describe('Admin', function() {
  			it('is governor', async function() {
  				expect(await this.core.getRoleAdmin(this.governorRole)).to.be.equal(this.governorRole);
  			});
  		});
  	});
  	describe('Access', function () {
  		it('onlyMinter reverts', async function() {
  			await expectRevert(this.coreRef.testMinter({from: governorAddress}), "CoreRef: Caller is not a minter");
  		});

  		it('onlyBurner reverts', async function() {
  			await expectRevert(this.coreRef.testBurner({from: governorAddress}), "CoreRef: Caller is not a burner");
  		});

  		it('onlyGovernor succeeds', async function() {
  			await this.coreRef.testGovernor({from: governorAddress});
  		});

  		it('onlyPCVController reverts', async function() {
  			await expectRevert(this.coreRef.testPCVController({from: governorAddress}), "CoreRef: Caller is not a PCV controller");
  		});
  	});

  	describe('Access Control', function () {
  		describe('Minter', function() {
  			it('can grant', async function() {
  				await this.core.grantMinter(userAddress, {from: governorAddress});
  				expect(await this.core.isMinter(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeMinter(minterAddress, {from: governorAddress});
  				expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
  			});
  		});
  		describe('Burner', function() {
  			it('can grant', async function() {
  				await this.core.grantBurner(userAddress, {from: governorAddress});
  				expect(await this.core.isBurner(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeBurner(burnerAddress, {from: governorAddress});
  				expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
  			});
  		});
  		describe('PCV Controller', function() {
  			it('can grant', async function() {
  				await this.core.grantPCVController(userAddress, {from: governorAddress});
  				expect(await this.core.isPCVController(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokePCVController(pcvControllerAddress, {from: governorAddress});
  				expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
  			});
  		});
  		describe('Governor', function() {
  			it('can grant', async function() {
  				await this.core.grantGovernor(userAddress, {from: governorAddress});
  				expect(await this.core.isGovernor(userAddress)).to.be.equal(true);
  			});
  			it('can revoke', async function() {
  				await this.core.revokeGovernor(governorAddress, {from: governorAddress});
  				expect(await this.core.isGovernor(governorAddress)).to.be.equal(false);
  			});
  		});
  	});
  });

  describe('Guardian', function () {
    describe('Role', function () {
      describe('Has access', function () {
        it('is registered in core', async function() {
          expect(await this.core.isGuardian(guardianAddress)).to.be.equal(true);
        });
      });
      describe('Access revoked', function () {
        beforeEach(async function() {
          await this.core.revokeGuardian(guardianAddress, {from: governorAddress});
        });

        it('is not registered in core', async function() {
          expect(await this.core.isGuardian(guardianAddress)).to.be.equal(false);
        });
      });
      describe('Access renounced', function() {
        beforeEach(async function() {
          await this.core.renounceRole(this.guardianRole, guardianAddress, {from: guardianAddress});
        });

        it('is not registered in core', async function() {
          expect(await this.core.isGuardian(guardianAddress)).to.be.equal(false);
        });
      });
      describe('Member Count', function() {
        it('is one', async function() {
          expect(await this.core.getRoleMemberCount(this.guardianRole)).to.be.bignumber.equal(new BN(1));
        });
        it('updates to two', async function() {
          await this.core.grantGuardian(userAddress, {from: governorAddress});
          expect(await this.core.getRoleMemberCount(this.guardianRole)).to.be.bignumber.equal(new BN(2));
        });
      });
      describe('Admin', function() {
        it('is governor', async function() {
          expect(await this.core.getRoleAdmin(this.guardianRole)).to.be.equal(this.governorRole);
        });
      });
    });
    describe('Access', function () {
      it('onlyMinter reverts', async function() {
        await expectRevert(this.coreRef.testMinter({from: guardianAddress}), "CoreRef: Caller is not a minter");
      });

      it('onlyBurner reverts', async function() {
        await expectRevert(this.coreRef.testBurner({from: guardianAddress}), "CoreRef: Caller is not a burner");
      });

      it('onlyGovernor reverts', async function() {
        await expectRevert(this.coreRef.testGovernor({from: guardianAddress}), "CoreRef: Caller is not a governor");
      });

      it('onlyPCVController reverts', async function() {
        await expectRevert(this.coreRef.testPCVController({from: guardianAddress}), "CoreRef: Caller is not a PCV controller");
      });
    });

    describe('Access Control', function () {
      describe('Non-Guardian', function() {
        it('cannot revoke', async function() {
          await expectRevert(this.core.revokeOverride(this.minterRole, minterAddress, {from: userAddress}), "Permissions: Caller is not a guardian");
        });
      });

      describe('Guardian', function() {
        it('can revoke minter', async function() {
          await this.core.revokeOverride(this.minterRole, minterAddress, {from: guardianAddress});
          expect(await this.core.isMinter(minterAddress)).to.be.equal(false);
        });

        it('can revoke burner', async function() {
          await this.core.revokeOverride(this.burnerRole, burnerAddress, {from: guardianAddress});
          expect(await this.core.isBurner(burnerAddress)).to.be.equal(false);
        });

        it('can revoke pcv controller', async function() {
          await this.core.revokeOverride(this.pcvControllerRole, pcvControllerAddress, {from: guardianAddress});
          expect(await this.core.isPCVController(pcvControllerAddress)).to.be.equal(false);
        });

        it('cannot revoke governor', async function() {
          await expectRevert(this.core.revokeOverride(this.governorRole, governorAddress, {from: guardianAddress}), "Permissions: Guardian cannot revoke governor");
          expect(await this.core.isGovernor(governorAddress)).to.be.equal(true);
        });
      });
    });
  });

  describe('Create Role', function() {
    beforeEach(async function() {
      this.role = "0x0000000000000000000000000000000000000000000000000000000000000001";
      this.adminRole = "0x0000000000000000000000000000000000000000000000000000000000000002";
    });

    it('governor succeeds', async function() {
      await this.core.createRole(this.role, this.adminRole, {from: governorAddress});
      expect(await this.core.getRoleAdmin(this.role)).to.be.equal(this.adminRole);
    });

    it('non-governor fails', async function() {
      await expectRevert(this.core.createRole(this.role, this.adminRole), "Permissions: Caller is not a governor");
    });
  });
});