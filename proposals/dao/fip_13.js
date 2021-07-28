const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function validate(addresses, oldContracts, contracts, logging) {
  const accounts = await web3.eth.getAccounts();

  const {
    rariPool8FeiPCVDeposit,
    kashiFeiTribe,
    kashiFeiEth,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit
  } = contracts;
  
  const balances = {
    kashiFeiEth: (await kashiFeiEth.balanceOf(accounts[0])).toString() === `2500000${e18}`,
    kashiFeiTribe: (await kashiFeiTribe.balanceOf(accounts[0])).toString() === `2500000${e18}`,
    rariPool8FeiPCVDeposit: (await rariPool8FeiPCVDeposit.balance()).toString() > `10000000${e18}`,
    creamFeiPCVDeposit: (await creamFeiPCVDeposit.balance()).toString() === `5000000${e18}`,
    poolPartyFeiPCVDeposit: (await poolPartyFeiPCVDeposit.balance()).toString() === `1333333${e18}`,
    indexCoopFusePoolFeiPCVDeposit: (await indexCoopFusePoolFeiPCVDeposit.balance()).toString() === `1000000${e18}`
  };
  
  console.log(balances);
}

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Mint 12.333m FEI
 2. Approve multisend FEI
 3a. Transfer 5M FEI to CREAM deposit
 3b. Transfer 1.333M FEI to Pool party deposit
 3c. Transfer 1M FEI to Index Coop Fuse deposit
 4. Transfer fFEI to deposit
 5. Approve Bentobox 5M FEI 
 6. Approve masterKashi contract for bentoBox
 7. Transfer 2.5M Kashi fei
 8. Transfer 2.5M Kashi fei
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { 
    ethPCVDripperAddress, 
    timelockAddress, 
    bentoBoxAddress, 
    masterKashiAddress 
  } = addresses;
  const {
    bentoBox,
    rariPool8Fei,
    rariPool8FeiPCVDeposit,
    fei,
    kashiFeiTribe,
    kashiFeiEth,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit,
    multisend
  } = contracts;

  // 1. Mint 12.333M FEI, enough to do all of the transfers
  const totalFei = `12333333${e18}`;
  await fei.mint(timelockAddress, totalFei);

  // 2. Approve Multisend
  await fei.approve(multisend.address, totalFei);

  // 3. Transfer to Fuse Deposits
  const multisendFee = await multisend.pricePerTx();
  const multisendAddresses = [
    creamFeiPCVDeposit.address,
    poolPartyFeiPCVDeposit.address,
    indexCoopFusePoolFeiPCVDeposit.address,
  ];
  const multisendAmounts = [
    `5000000${e18}`,
    `1333333${e18}`,
    `1000000${e18}`
  ];
  await multisend.transfer(
    fei.address, 
    ethPCVDripperAddress, 
    multisendAddresses,
    multisendAmounts,
    {value: multisendFee}
  );

  // 4. Transfer fFEI from FeiRari to a custom deposit
  const pool8Fei = await rariPool8Fei.balanceOf(timelockAddress);
  await contracts.rariPool8Fei.transfer(rariPool8FeiPCVDeposit.address, pool8Fei, {from: timelockAddress});  

  // Kashi deployments
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0].slice(2);

  // 5. Approve BentoBox FEI
  await fei.approve(bentoBoxAddress, `5000000${e18}`);
  // 6. Approve Master Kashi contract BentoBox
  await bentoBox.setMasterContractApproval(accounts[0], masterKashiAddress, true, 0, '0x0000000000000000000000000000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000000000000000000000000000');

  // Construct calldata for cook transactions
  const datas = [
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 
    `0x000000000000000000000000956f47f50a910163d8bf957cf5846d573e7f87ca000000000000000000000000${sender}00000000000000000000000000000000000000000002116545850052128000000000000000000000000000000000000000000000000000000000000000000000`,
    `0x0000000000000000000000000000000000000000000211654585005212800000000000000000000000000000${sender}0000000000000000000000000000000000000000000000000000000000000000`
  ];

  // 7. Cook FEI-TRIBE Kashi deposit
  await kashiFeiEth.cook([11, 20, 1], [0, 0, 0], datas);

  // 8. Cook FEI-ETH Kashi deposit
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
  await validate(addresses, oldContracts, contracts, logging);
}

module.exports = {
  setup, run, teardown, validate
};
