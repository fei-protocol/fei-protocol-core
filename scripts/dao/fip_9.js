const hre = require('hardhat');
const { getAddresses } = require('../utils/helpers');

const IPCVSwapper = artifacts.require('IPCVSwapper');
const EthLidoPCVDeposit = artifacts.require('EthLidoPCVDeposit');
const ERC20 = artifacts.require('ERC20');

const { web3 } = hre;
const e18 = '000000000000000000';

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function main() {
  const accounts = await web3.eth.getAccounts();
  const { coreAddress } = getAddresses();
  // The old EthPCVDripper contract does not exist anymore, but the
  // IPCVSwapper interface also has a withdrawETH(to, amount) function
  const dripper = await IPCVSwapper.at('0xDa079A280FC3e33Eb11A78708B369D5Ca2da54fE');
  const steth = await ERC20.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84');
  // The actual proposal will have the EthLidoPCVDeposit contract deployed already
  const deposit = await EthLidoPCVDeposit.new(
    coreAddress, // core
    '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // stETH token
    '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022', // Curve's stETH-ETH StableSwap pool
    '100' // 1% maximum slippage
  );
  console.log('EthLidoPCVDeposit deployed at', deposit.address);

  console.log('Initial state');
  console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18);
  console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18);
  console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(deposit.address)) / 1e18);

  console.log('Move 10,000 ETH from EthPCVDripper to EthLidoPCVDeposit');
  await dripper.withdrawETH(deposit.address, `10000${e18}`, {from: accounts[0]});
  console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18);
  console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18);

  console.log('Deposit EthPCVDripper\'s ETH to stETH');
  await deposit.deposit();
  console.log(' > EthLidoPCVDeposit ETH balance :', (await web3.eth.getBalance(deposit.address)) / 1e18);
  console.log(' > EthLidoPCVDeposit stETH balance :', (await steth.balanceOf(deposit.address)) / 1e18);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
