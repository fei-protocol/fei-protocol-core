const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Mint 11.333m FEI
 2. Transfer FEI to CREAM deposit
 3. Transfer FEI to Pool party deposit
 4. Approve Bentobox 5M FEI 
 5. Transfer FEI to 
 6. Transfer Kashi fei
 7. Transfer Kashi fei
 10. Transfer fFEI to deposit
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { timelockAddress, bentoBoxAddress, masterKashiAddress } = addresses;
  const {
    bentoBox,
    rariPool8Fei,
    rariPool8FeiPCVDeposit,
    fei,
    kashiFeiTribe,
    kashiFeiEth,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit
  } = contracts;
  const pool8Fei = await rariPool8Fei.balanceOf(timelockAddress);
  await contracts.rariPool8Fei.transfer(rariPool8FeiPCVDeposit.address, pool8Fei, {from: timelockAddress});  

  await fei.mint(timelockAddress, `11333333${e18}`);

  await fei.transfer(creamFeiPCVDeposit.address, `5000000${e18}`);
  await fei.transfer(poolPartyFeiPCVDeposit.address, `1333333${e18}`);
  await fei.transfer(indexCoopFusePoolFeiPCVDeposit.address, `1000000${e18}`);

  const accounts = await web3.eth.getAccounts();

  await fei.approve(bentoBoxAddress, `5000000${e18}`);
  await bentoBox.setMasterContractApproval(accounts[0], masterKashiAddress, true, 0, '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000');

  await fei.approve(masterKashiAddress, `5000000${e18}`);

  const sender = accounts[0].slice(2);

  const datas =     [
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 
    `0x000000000000000000000000956f47f50a910163d8bf957cf5846d573e7f87ca000000000000000000000000${sender}00000000000000000000000000000000000000000002116545850052128000000000000000000000000000000000000000000000000000000000000000000000`,
    `0x0000000000000000000000000000000000000000000211654585005212800000000000000000000000000000${sender}0000000000000000000000000000000000000000000000000000000000000000`
  ];

  await kashiFeiEth.cook([11, 20, 1], [0, 0, 0], datas);
  await kashiFeiTribe.cook([11, 20, 1], [0, 0, 0], datas);
}

// Deposit FEI CREAM
// Deposit FEI pool party
// Deposit FEI Index Coop Fuse
async function teardown(addresses, oldContracts, contracts, logging) {
  const {
    indexCoopFusePoolFeiPCVDeposit,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit
  } = contracts;

  creamFeiPCVDeposit.deposit();
  poolPartyFeiPCVDeposit.deposit();
  indexCoopFusePoolFeiPCVDeposit.deposit();
}

async function validate(addresses, oldContracts, contracts, logging) {

}
module.exports = {
  setup, run, teardown, validate
};
