const { BN, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('hardhat');

const TribalChief = artifacts.require('TribalChief');
const MockCore = artifacts.require('MockCore');
const MockConfigurableERC20 = artifacts.require('MockConfigurableERC20');
const { getAddresses } = require('../scripts/utils/helpers');

const { governorAlphaAddress } = getAddresses();
const mintAmount = '1000000000000000000000000000000000000000000000000000000';

// Create a mock deployment of the tribalchief, tribe and LP tokens
// Key changes include: Adding ERC20 support, updated reweight algorithm, Chainlink support, and a TRIBE backstop
async function main() {
  const receiver = process.env.FEI_RECEIVER;
  if (!receiver || receiver === undefined || receiver.length !== 42) {
    throw new Error('must specify receiver address');
  }

  const core = await MockCore.new({ from: governorAlphaAddress });
  const fei = await core.fei();
  await fei.mint(receiver, mintAmount);
  const tribe = await MockConfigurableERC20.new('Tribe', 'TRIBE');
  const LPTokenA = await MockConfigurableERC20.new('LP Token A', 'LP_A');
  const LPTokenB = await MockConfigurableERC20.new('LP Token B', 'LP_B');

  await LPTokenA.mint(receiver, mintAmount);
  await LPTokenB.mint(receiver, mintAmount);

  const tribalChief = await TribalChief.new(core.address, tribe.address);
  await tribe.mint(tribalChief.address, mintAmount);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
