const UniswapPCVController = artifacts.require('UniswapPCVController');
const Core = artifacts.require('Core');

const { getAddresses } = require('../utils/helpers');

// The DAO steps for FIP-3, these must be done with Governor access control privileges
async function main() {
  const { 
    ethUniswapPCVControllerAddress, 
    oldEthUniswapPCVControllerAddress,
    ethUniswapPCVDepositAddress
  } = getAddresses();

  const newController = await UniswapPCVController.at(ethUniswapPCVControllerAddress);
  const oldController = await UniswapPCVController.at(oldEthUniswapPCVControllerAddress);
  const core = await Core.at(process.env.MAINNET_CORE);

  console.log('Granting PCV Controller to new EthUniswapPCVController');
  await core.grantPCVController(newController.address);

  console.log('Granting Minter to new EthUniswapPCVController');
  await core.grantMinter(newController.address);

  console.log('Revoking PCV Controller from the old EthUniswapPCVController');
  await core.revokePCVController(oldController.address);

  console.log('Revoking Minter from the old EthUniswapPCVController');
  await core.revokeMinter(oldController.address);

  console.log('Updating EthUniswapPCVDeposit on the new EthUniswapPCVController');
  await newController.setPCVDeposit(ethUniswapPCVDepositAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
