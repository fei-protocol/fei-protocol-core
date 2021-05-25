const UniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");
const UniswapPCVController = artifacts.require("UniswapPCVController");
const BondingCurve = artifacts.require("BondingCurve");
const Core = artifacts.require("Core");

// The DAO steps for upgrading to ERC20 compatible versions, these must be done with Governor access control privileges
module.exports = async function(callback) {
  require('dotenv').config();

  let deposit = await UniswapPCVDeposit.deployed();
  let controller = await UniswapPCVController.deployed();
  let bc = await BondingCurve.deployed();
  let core = await Core.at(process.env.MAINNET_CORE);

  console.log('Granting Burner to new UniswapPCVController');
  await core.grantBurner(controller.address);

  console.log('Granting Minter to new UniswapPCVController');
  await core.grantMinter(controller.address);

  console.log('Granting Minter to new BondingCurve');
  await core.grantMinter(bc.address);

  console.log('Granting Minter to new UniswapPCVDeposit');
  await core.grantMinter(deposit.address);

  callback();
}
