import mainnetAddressesV1 from '../contract-addresses/mainnetAddresses.json';

const { web3 } = require('hardhat');
const { deploy } = require('./upgrade');

// Upgrade the Fei system to v1.1, as according to the OpenZeppelin audit done in June 2021
// Key changes include: Adding ERC20 support, updated reweight algorithm, Chainlink support, and a TRIBE backstop
async function main() {
  const deployAddress = (await web3.eth.getAccounts())[0];
  await deploy(deployAddress, { ...mainnetAddressesV1.contracts, ...mainnetAddressesV1.external }, true);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
