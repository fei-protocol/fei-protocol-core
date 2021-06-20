const { sudo } = require('./sudo');

const { getAddresses } = require('./helpers');

const { coreAddress, feiAddress, timelockAddress } = getAddresses(); 

async function main() {
  const addresses = {
    coreAddress,
    feiAddress,
    timelockAddress
  };

  await sudo(addresses, true);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
