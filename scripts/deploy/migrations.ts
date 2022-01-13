import { DeployUpgradeFunc } from '@custom-types/types';
import mainnetAddressesV1 from '../../protocol-configuration/mainnetAddresses';
import { ethers } from 'hardhat';

// Run the deployment for DEPLOY_FILE
async function main() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const deployAddress = (await ethers.getSigners())[0].address;

  const mainnetAddresses = {};
  Object.keys(mainnetAddressesV1).map((key) => {
    mainnetAddresses[key] = mainnetAddressesV1[key].address;
    return true;
  });

  let deploy: DeployUpgradeFunc;
  if (process.env.IS_FIP) {
    ({ deploy } = await import(`@proposals/dao/${proposalName}`));
  } else {
    ({ deploy } = await import(`./${proposalName}`));
  }

  await deploy(deployAddress, mainnetAddresses, true);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
