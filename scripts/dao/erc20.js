const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const BondingCurve = artifacts.require('BondingCurve');
const Core = artifacts.require('Core');

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
async function main() {
  // eslint-disable-next-line global-require
  require('dotenv').config();

  const deposit = await UniswapPCVDeposit.deployed();
  const controller = await UniswapPCVController.deployed();
  const bc = await BondingCurve.deployed();
  const core = await Core.at(process.env.MAINNET_CORE);

  console.log('Granting Burner to new UniswapPCVController');
  await core.grantBurner(controller.address);

  console.log('Granting Minter to new UniswapPCVController');
  await core.grantMinter(controller.address);

  console.log('Granting Minter to new BondingCurve');
  await core.grantMinter(bc.address);

  console.log('Granting Minter to new UniswapPCVDeposit');
  await core.grantMinter(deposit.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
