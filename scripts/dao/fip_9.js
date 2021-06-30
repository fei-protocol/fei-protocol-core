const hre = require('hardhat');

const IPCVSwapper = artifacts.require('IPCVSwapper');
const EthLidoPCVDeposit = artifacts.require('EthLidoPCVDeposit');
const ERC20 = artifacts.require('ERC20');

const { web3 } = hre;
const e18 = '000000000000000000';

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function main() {
  const accounts = await web3.eth.getAccounts();

  // The old EthPCVDripper contract does not exist anymore, but the
  // IPCVSwapper interface also has a withdrawETH(to, amount) function
  const dripper = await IPCVSwapper.at('0xDa079A280FC3e33Eb11A78708B369D5Ca2da54fE');
  const steth = await ERC20.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84');
  const deposit = await EthLidoPCVDeposit.at('0xac38ee05c0204a1e119c625d0a560d6731478880');

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
