const EthUniswapPCVDeposit = artifacts.require("EthUniswapPCVDeposit");
const EthPCVDepositAdapter = artifacts.require("EthPCVDepositAdapter");
const EthBondingCurve = artifacts.require("EthBondingCurve");
const RatioPCVController = artifacts.require("RatioPCVController");
const Core = artifacts.require("Core");

// The DAO steps for FIP-5, these must be done with Governor access control privileges
module.exports = async function(callback) {
  require('dotenv').config();

  let newDeposit = await EthUniswapPCVDeposit.at(process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT);
  let oldDeposit = await EthUniswapPCVDeposit.at(process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT_01);
  let ratioController = await RatioPCVController.at(process.env.MAINNET_RATIO_PCV_CONTROLLER);
  let adapter = await EthPCVDepositAdapter.at(process.env.MAINNET_ETH_PCV_ADAPTER);
  let adapterToDeposit = await EthPCVDepositAdapter.at(process.env.MAINNET_ETH_PCV_ADAPTER_TO_DEPOSIT);
  let bc = await EthBondingCurve.at(process.env.MAINNET_ETH_BONDING_CURVE);
  let core = await Core.at(process.env.MAINNET_CORE);

  console.log('Granting PCV Controller to RatioPCVController');
  await core.grantPCVController(ratioController.address);

  console.log('Granting Minter to new EthUniswapPCVDeposit');
  await core.grantMinter(newDeposit.address);

  console.log('Revoking Minter from the old EthUniswapPCVDeposit');
  await core.revokeMinter(oldDeposit.address);
    
  console.log('Unpausing old EthUniswapPCVDeposit');
  await oldDeposit.unpause();

  console.log('Withdrawing from the old to the new EthUniswapPCVDeposit');
  await ratioController.withdrawRatio(oldDeposit.address, adapterToDeposit.address, 10000);

  console.log('Updating slippage param on new EthUniswapPCVDeposit');
  await newDeposit.setMaxBasisPointsFromPegLP(100);

  console.log('Setting allocation on bonding curve');
  await bc.setAllocation([adapter.address], [10000]);

  callback();
}
