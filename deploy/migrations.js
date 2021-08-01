import mainnetAddressesV1 from '../contract-addresses/mainnetAddresses.json';
import proposals from '../proposals/config.json';

const { web3 } = require('hardhat');

// Run the deployments flagged as deploy=true in '../proposals/config.json'
async function main() {
  const deployAddress = (await web3.eth.getAccounts())[0];

  const mainnetAddresses = {};
  Object.keys(mainnetAddressesV1).map((key) => {
    mainnetAddresses[key] = mainnetAddressesV1[key].address;
    return true;
  });

  const proposalNames = Object.keys(proposals);
  for (let i = 0; i < proposalNames.length; i += 1) {
    const proposalName = proposalNames[i];
    const config = proposals[proposalNames[i]];
    if (config.deploy) {
      const { deploy } = await import(`./${proposalName}`);
      await deploy(deployAddress, mainnetAddresses, true);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
