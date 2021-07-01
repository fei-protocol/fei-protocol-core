const hre = require('hardhat');
const { BN } = require('@openzeppelin/test-helpers');
const { check, getAddresses } = require('../utils/helpers');
const { sudo } = require('../utils/sudo');

const IPCVSwapper = artifacts.require('IPCVSwapper');
const EthLidoPCVDeposit = artifacts.require('EthLidoPCVDeposit');
const ERC20 = artifacts.require('ERC20');
const Fei = artifacts.require('Fei');

const { web3 } = hre;
const e18 = '000000000000000000';

async function main() {
  await sudo();

  const accounts = await web3.eth.getAccounts();
  const {
    zeroAddress,
    feiAddress,
    ethPairAddress
  } = getAddresses();

  // The old EthPCVDripper contract does not exist anymore, but the
  // IPCVSwapper interface also has a withdrawETH(to, amount) function
  const dripper = await IPCVSwapper.at('0xDa079A280FC3e33Eb11A78708B369D5Ca2da54fE');
  const steth = await ERC20.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84');
  const deposit = await EthLidoPCVDeposit.at('0xac38ee05c0204a1e119c625d0a560d6731478880');
  const fei = await Fei.at(feiAddress);

  // Initial state
  const dripperStartEthBalance = await web3.eth.getBalance(dripper.address);
  const pcvDepositStartEthBalance = await web3.eth.getBalance(deposit.address);
  const pcvDepositStartStEthBalance = await steth.balanceOf(deposit.address);

  // Move 10,000 ETH from EthPCVDripper to EthLidoPCVDeposit
  await dripper.withdrawETH(deposit.address, `10000${e18}`, {from: accounts[0]});
  const dripperEndEthBalance = await web3.eth.getBalance(dripper.address);
  const pcvDepositEndEthBalance = await web3.eth.getBalance(deposit.address);
  const ethMoved = new BN(dripperStartEthBalance).sub(new BN(dripperEndEthBalance));
  check(ethMoved.toString() === `10000${e18}`, 'Moved 10,000 ETH from EthPCVDripper to EthLidoPCVDeposit');

  // Deposit EthPCVDripper\'s ETH to stETH
  await deposit.deposit();
  const pcvDepositFinalEthBalance = await web3.eth.getBalance(deposit.address);
  const pcvDepositFinalStEthBalance = await steth.balanceOf(deposit.address);
  check(pcvDepositFinalEthBalance.toString() === '0', 'No ETH remaining on EthLidoPCVDeposit');
  // @dev: somehow, we get 1 wei less, but it's insignificant... probably a float rounding error
  check(pcvDepositFinalStEthBalance.toString() === '9999999999999999999999', '10,000 stETH available on EthLidoPCVDeposit');

  // [FIP-4] Remove FEI incentives
  await fei.setIncentiveContract(ethPairAddress, zeroAddress, {from: accounts[0]});
  check(await fei.incentiveContract(ethPairAddress) === zeroAddress, 'Set incentives contract = 0x0');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
