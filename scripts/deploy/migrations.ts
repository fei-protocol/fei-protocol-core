import { DeployUpgradeFunc, NamedAddresses } from '@custom-types/types';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { ethers } from 'hardhat';

// Run the deployment for DEPLOY_FILE
async function main() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const deployAddress = (await ethers.getSigners())[0].address;

  const mainnetAddresses: NamedAddresses = {};
  for (const keyName of Object.keys(MainnetContractsConfig)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mainnetAddresses[keyName] = MainnetContractsConfig[keyName as keyof typeof MainnetContractsConfig].address;
  }

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
