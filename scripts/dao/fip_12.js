const { getAddresses } = require('../utils/helpers');
const { sudo } = require('../utils/sudo');

const Core = artifacts.require('Core');

const e18 = '000000000000000000';
const communalFarmAddress = '0x0';

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function main() {
  await sudo();

  const {
    coreAddress
  } = getAddresses();

  const core = await Core.at(coreAddress);

  console.log('Transferring TRIBE to Communal Farm');
  await core.allocateTribe(communalFarmAddress, `2000000${e18}`); // 2M TRIBE
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
