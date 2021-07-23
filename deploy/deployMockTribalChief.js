/* eslint-disable no-undef */
const Fei = artifacts.require('Fei');
const TribalChief = artifacts.require('TribalChief');
const MockCore = artifacts.require('MockCore');
const MockConfigurableERC20 = artifacts.require('MockConfigurableERC20');

const mintAmount = '10000000000000000000000000000';
const allocationPoints = 100;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const shortRewardSchedule = [
  {
    lockLength: 23,
    rewardMultiplier: `${15e17}`,
  },
  {
    lockLength: 46,
    rewardMultiplier: `${2e18}`,
  },
];

const longRewardSchedule = [
  {
    lockLength: 1080000,
    rewardMultiplier: `${15e17}`,
  },
  {
    lockLength: 1620000,
    rewardMultiplier: `${17e17}`,
  },
  {
    lockLength: 2160000,
    rewardMultiplier: `${2e18}`,
  },
  {
    lockLength: 3240000,
    rewardMultiplier: `${3e18}`,
  },
  {
    lockLength: 4320000,
    rewardMultiplier: `${4e18}`,
  },
];

// Create a mock deployment of the tribalchief, tribe and LP tokens
async function main() {
  const governorAlphaAddress = process.env.RINKEBY_GOVERNOR_ALPHA;
  const receiver = process.env.FEI_RECEIVER;
  if (!receiver || receiver === undefined || receiver.length !== 42) {
    throw new Error('must specify receiver address');
  }
  if (
    !governorAlphaAddress
    || governorAlphaAddress === undefined
    || governorAlphaAddress.length !== 42
  ) {
    throw new Error('must specify receiver address');
  }

  const core = await MockCore.new({ from: governorAlphaAddress });
  await core.grantMinter(core.address, { from: governorAlphaAddress });

  const fei = await Fei.at(await core.fei());
  const tribe = await Fei.at(await core.tribe());

  console.log(`Core address: ${core.address}`);
  console.log(`Fei address: ${fei.address}`);
  console.log(`Tribe address: ${tribe.address}`);

  const LPTokenA = await MockConfigurableERC20.new('LP Token A', 'LP_A');
  const LPTokenB = await MockConfigurableERC20.new('LP Token B', 'LP_B');
  console.log(`LP Token A: ${LPTokenA.address}`);
  console.log(`LP Token B: ${LPTokenB.address}`);

  await core.mintFEI(receiver, mintAmount, { from: governorAlphaAddress });
  await LPTokenA.mint(receiver, mintAmount);
  await LPTokenB.mint(receiver, mintAmount);

  const tribalChief = await TribalChief.new(core.address, tribe.address);
  console.log(`TribalChief: ${tribalChief.address}`);
  await tribe.mint(tribalChief.address, mintAmount, { from: governorAlphaAddress });

  // LP Token A has a short lockup period
  await tribalChief.add(
    allocationPoints,
    LPTokenA.address,
    ZERO_ADDRESS,
    shortRewardSchedule,
    { from: governorAlphaAddress },
  );

  // LP Token B has the long lockup period
  await tribalChief.add(
    allocationPoints,
    LPTokenB.address,
    ZERO_ADDRESS,
    longRewardSchedule,
    { from: governorAlphaAddress },
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
