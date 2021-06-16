const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
} = require('../helpers');
const { time } = require('@openzeppelin/test-helpers');

const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('MasterChief', function () {
  let userAddress;
  let minterAddress;
  let governorAddress;
  const allocationPoints = 100;
  const totalStaked = '100000000000000000000';
  const perBlockReward = Number(100000000000000000000);
  let pid;

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
    const tx = await this.masterChief.add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, { from: governorAddress });
    
    pid = Number(tx.logs[0].args.pid);
    // console.log("pid: ", pid)
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

  describe('Test Staking', function() {
    it('should be able to stake LP Tokens', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress })
    });

    it('should be able to get pending sushi', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress })

        const advanceBlockAmount = 100;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);
    });

    it('should be able to get pending sushi after one block with a single pool and user staking', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress })

        await time.advanceBlock();

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward);
    });

    it('should be able to get pending sushi 2x', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress })

        const advanceBlockAmount = 200;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);
    });

    it('should be able to assert poolLength', async function() {
        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
    });
  });
});
