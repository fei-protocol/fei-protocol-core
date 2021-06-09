const EthUniswapPCVController = artifacts.require('EthUniswapPCVController');
const Core = artifacts.require('Core');

// The DAO steps for FIP-3, these must be done with Governor access control privileges
async function main() {
  // eslint-disable-next-line global-require
  require('dotenv').config();

  const newController = await EthUniswapPCVController.at(process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER);
  const oldController = await EthUniswapPCVController.at(process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER_01);
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
  await newController.setPCVDeposit(process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
