const { ethers } = require("hardhat");

/* eslint-disable no-undef */
const Fei = artifacts.readArtifactSync('Fei');
const TribalChief = artifacts.readArtifactSync('TribalChief');
const MockCore = artifacts.readArtifactSync('MockCore');
const MockConfigurableERC20 = artifacts.readArtifactSync('MockConfigurableERC20');

const mintAmount = '10000000000000000000000000000';
const allocationPoints = 1000;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const shortRewardSchedule = [
  {
    lockLength: 0,
    rewardMultiplier: `${1e4}`
  },
  {
    lockLength: 23,
    rewardMultiplier: `${15e3}`
  },
  {
    lockLength: 46,
    rewardMultiplier: `${2e4}`
  }
];

const longRewardSchedule = [
  {
    lockLength: 0,
    rewardMultiplier: `${1e4}`
  },
  {
    lockLength: 1080000,
    rewardMultiplier: `${15e3}`
  },
  {
    lockLength: 1620000,
    rewardMultiplier: `${17e3}`
  },
  {
    lockLength: 2160000,
    rewardMultiplier: `${2e4}`
  },
  {
    lockLength: 3240000,
    rewardMultiplier: `${3e4}`
  },
  {
    lockLength: 4320000,
    rewardMultiplier: `${4e4}`
  }
];

// Create a mock deployment of the tribalchief, tribe and LP tokens
async function main() {
  const governorAlphaAddress = process.env.RINKEBY_GOVERNOR_ALPHA;
  const receiver = process.env.FEI_RECEIVER;
  if (!receiver || receiver === undefined || receiver.length !== 42) {
    throw new Error('must specify receiver address');
  }
  if (!governorAlphaAddress || governorAlphaAddress.length !== 42) {
    throw new Error('must specify governor alpha address');
  }
  const accounts = await ethers.getSigners()

  const core = await MockCore.new({ from: accounts[0], gasPrice: 2000000008, gasLimit: 20000000 });
  await core.init({ from: accounts[0], gasPrice: 2000000008, gasLimit: 20000000 });
  await core.grantMinter(core.address, { from: accounts[0], gasPrice: 2000000008, gasLimit: 20000000 });

  const fei = await Fei.at(await core.fei());
  const tribe = await Fei.at(await core.tribe());

  console.log(`Core address: ${core.address}`);
  console.log(`Fei address: ${fei.address}`);
  console.log(`Tribe address: ${tribe.address}`);

  const LPTokenA = await MockConfigurableERC20.new('LP Token A', 'LP_A');
  const LPTokenB = await MockConfigurableERC20.new('LP Token B', 'LP_B');
  console.log(`LP Token A: ${LPTokenA.address}`);
  console.log(`LP Token B: ${LPTokenB.address}`);

  await LPTokenA.mint(receiver, mintAmount);
  await LPTokenB.mint(receiver, mintAmount);

  const tribalChief = await TribalChief.new(core.address, tribe.address, {
    from: accounts[0],
    gasPrice: 2000000008,
    gasLimit: 20000000
  });
  console.log(`TribalChief: ${tribalChief.address}`);

  await tribe.transfer(tribalChief.address, await tribe.balanceOf(accounts[0]), {
    from: accounts[0],
    gasPrice: 2000000008,
    gasLimit: 20000000
  });

  // LP Token A has a short lockup period
  await tribalChief.add(allocationPoints, LPTokenA.address, ZERO_ADDRESS, shortRewardSchedule, {
    from: accounts[0],
    gasPrice: 2000000008,
    gasLimit: 20000000
  });

  // LP Token B has the long lockup period
  await tribalChief.add(allocationPoints, LPTokenB.address, ZERO_ADDRESS, longRewardSchedule, {
    from: accounts[0],
    gasPrice: 2000000008,
    gasLimit: 20000000
  });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
