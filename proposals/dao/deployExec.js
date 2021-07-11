const { exec } = require('./exec');
const { getAddresses } = require('../../scripts/utils/helpers');

async function main() {
  const txData = '';

  const { 
    proposerAddress,
    voterAddress,
    governorAlphaAddress
  } = getAddresses();

  await exec(
    txData,
    {
      proposerAddress,
      voterAddress,
      governorAlphaAddress
    }
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
