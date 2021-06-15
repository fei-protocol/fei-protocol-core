const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
} = require('../helpers');

const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');

describe('MasterChief', function () {
  let userAddress;
  let minterAddress;
  let burnerAddress;
  let pcvControllerAddress;
  let governorAddress;
  let genesisGroup;
  let guardianAddress;
  let LPToken;
  const allocationPoints = 100;

  beforeEach(async function () {
    ({
      userAddress,
      minterAddress,
      burnerAddress,
      pcvControllerAddress,
      governorAddress,
      genesisGroup,
      guardianAddress,
    } = await getAddresses());
    this.core = await getCore(false);
    
    this.tribe = await Tribe.new();
    this.coreRef = await MockCoreRef.new(this.core.address);

    this.masterChief = await MasterChief.new(this.core.address, this.tribe.address);

    // mint LP tokens
    this.LPToken = await MockERC20.new();
    await this.LPToken.mint(userAddress, '1000000000000000000000000000000000000000000000');
    await this.tribe.mint(this.masterChief.address, '1000000000000000', { from: minterAddress });
    // create new reward stream
    await this.masterChief.add(allocationPoints, this.LPToken.address, this.tribe.address, { from: governorAddress });

    this.minterRole = await this.core.MINTER_ROLE();
    this.burnerRole = await this.core.BURNER_ROLE();
    this.governorRole = await this.core.GOVERN_ROLE();
    this.pcvControllerRole = await this.core.PCV_CONTROLLER_ROLE();
    this.guardianRole = await this.core.GUARDIAN_ROLE();
  });

  describe('Test Security', function() {
    it('should not be able to add rewards stream as non governor', async function() {
        await expectRevert(
            this.masterChief.add(allocationPoints, this.LPToken.address, this.tribe.address, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should not be able to set rewards stream as non governor', async function() {
        await expectRevert(
            this.masterChief.set(0, allocationPoints, this.LPToken.address, true, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should not be able to setMigrator as non governor', async function() {
        await expectRevert(
            this.masterChief.setMigrator(this.LPToken.address, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should not be able to governorWithdrawTribe as non governor', async function() {
        await expectRevert(
            this.masterChief.governorWithdrawTribe('100000000', { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should not be able to updateBlockReward as non governor', async function() {
        await expectRevert(
            this.masterChief.updateBlockReward('100000000', { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });
  });

//   describe('Fei Update', function() {
//     it('updates', async function() {
//       expectEvent(
//         await this.core.setFei(userAddress, {from: governorAddress}),
//         'FeiUpdate',
//         {
//           _fei: userAddress
//         }
//       );
//       expect(await this.core.fei()).to.be.equal(userAddress);
//     });
	
//     it('non governor reverts', async function() {
//       await expectRevert(this.core.setFei(userAddress, {from: userAddress}), 'Permissions: Caller is not a governor');
//     });
//   });

});
