const { check, getAddresses } = require('../utils/helpers');
const { sudo } = require('../utils/sudo');

const Tribe = artifacts.require('Tribe');

const e18 = '000000000000000000';
const communalFarmAddress = '0x0';

async function main() {
  await sudo();

  const {
    tribeAddress
  } = getAddresses();

  const tribe = await Tribe.at(tribeAddress);

  // Check Farm TRIBE balance
  const farmBalance = await tribe.balanceOf(communalFarmAddress);
  check(farmBalance.toString() === `2000000${e18}`, 'StakingRewards recieves 2M TRIBE');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
