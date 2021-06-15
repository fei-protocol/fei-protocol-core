const EthPCVDripper = artifacts.require('EthPCVDripper');
const Timelock = artifacts.require('Timelock');
const Lido = artifacts.require('Lido');
const e18 = '000000000000000000';

module.exports = async function(cb) {
  require('dotenv').config();

  const timelock = await Timelock.at(process.env.MAINNET_TIMELOCK);
  const dripper = await EthPCVDripper.at(process.env.MAINNET_ETH_PCV_DRIPPER);
  const lido = await Lido.at('0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'); // stETH token
  const lidoReferralAddress = '0x0000000000000000000000000000000000000000';

  console.log('Initial state');
  console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18);
  console.log(' > Timelock ETH balance :', (await web3.eth.getBalance(timelock.address)) / 1e18);
  console.log(' > Timelock stETH balance :', (await lido.balanceOf(timelock.address)) / 1e18);

  console.log('Move 10,000 ETH from EthPCVDripper to Timelock');
  await dripper.withdrawETH(timelock.address, '10000'+e18);

  console.log('From Timelock, send ETH to Lido to get stETH');
  await lido.submit(lidoReferralAddress, {
    value: '10000'+e18,
    from: timelock.address
  });

  console.log('Ending state');
  console.log(' > Dripper ETH balance :', (await web3.eth.getBalance(dripper.address)) / 1e18);
  console.log(' > Timelock ETH balance :', (await web3.eth.getBalance(timelock.address)) / 1e18);
  console.log(' > Timelock stETH balance :', (await lido.balanceOf(timelock.address)) / 1e18)

  console.log('Done');
  cb && cb();
}
