const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Mint 18.833m FEI
 2. Approve multisend FEI
 3a. Transfer 5M FEI to CREAM deposit
 3b. Transfer 1.333M FEI to Pool party deposit
 3c. Transfer 1M FEI to Index Coop Fuse deposit
 3d. Transfer 1M FEI to Fuse Pool 6 deposit
 3e. Transfer 1M FEI to Fuse Pool 7 deposit
 3f. Transfer 1M FEI to Fuse Pool 24 deposit
 4. Transfer fFEI to deposit
 5. Approve Bentobox 5M FEI 
 6. Approve masterKashi contract for bentoBox
 7. Transfer 2.5M Kashi fei/eth
 8. Transfer 2.5M Kashi fei/tribe
 9. Transfer 2.5M Kashi fei/xSushi
 10. Transfer 1M Kashi fei/DPI
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { ethPCVDripperAddress, timelockAddress, bentoBoxAddress, masterKashiAddress } = addresses;
  const {
    bentoBox,
    rariPool8Fei,
    rariPool6FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool8FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    fei,
    kashiFeiTribe,
    kashiFeiEth,
    kashiFeiXSushi,
    kashiFeiDPI,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit,
    multisend
  } = contracts;

  // 1. Mint 18.833M FEI, enough to do all of the transfers
  const totalFei = `18833333${e18}`;
  await fei.mint(timelockAddress, totalFei);

  // 2. Approve Multisend
  await fei.approve(multisend.address, totalFei);

  // 3. Transfer to Fuse Deposits
  const multisendFee = await multisend.pricePerTx();
  const multisendAddresses = [
    creamFeiPCVDeposit.address,
    poolPartyFeiPCVDeposit.address,
    indexCoopFusePoolFeiPCVDeposit.address,
    rariPool6FeiPCVDeposit.address,
    rariPool7FeiPCVDeposit.address,
    rariPool24FeiPCVDeposit.address
  ];
  const multisendAmounts = [
    `5000000${e18}`,
    `1333333${e18}`,
    `1000000${e18}`,
    `1000000${e18}`,
    `1000000${e18}`,
    `1000000${e18}`
  ];
  await multisend.transfer(fei.address, ethPCVDripperAddress, multisendAddresses, multisendAmounts, {
    value: multisendFee
  });

  // 4. Transfer fFEI from FeiRari to a custom deposit
  const pool8Fei = await rariPool8Fei.balanceOf(timelockAddress);
  await rariPool8Fei.transfer(rariPool8FeiPCVDeposit.address, pool8Fei, { from: timelockAddress });

  // Kashi deployments
  const accounts = await web3.eth.getAccounts();
  const sender = accounts[0].slice(2);

  // 5. Approve BentoBox FEI
  await fei.approve(bentoBoxAddress, `8500000${e18}`);
  // 6. Approve Master Kashi contract BentoBox
  await bentoBox.setMasterContractApproval(
    accounts[0],
    masterKashiAddress,
    true,
    0,
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );

  // Construct calldata for cook transactions
  let datas = [
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    `0x000000000000000000000000956f47f50a910163d8bf957cf5846d573e7f87ca000000000000000000000000${sender}00000000000000000000000000000000000000000002116545850052128000000000000000000000000000000000000000000000000000000000000000000000`,
    `0x0000000000000000000000000000000000000000000211654585005212800000000000000000000000000000${sender}0000000000000000000000000000000000000000000000000000000000000000`
  ];

  // 7. Cook FEI-TRIBE Kashi deposit
  await kashiFeiEth.cook([11, 20, 1], [0, 0, 0], datas);

  // 8. Cook FEI-ETH Kashi deposit
  await kashiFeiTribe.cook([11, 20, 1], [0, 0, 0], datas);

  // 9. Cook FEI-xSushi Kashi deposit
  await kashiFeiXSushi.cook([11, 20, 1], [0, 0, 0], datas);

  // Change the calldata to 1M instead of 2.5M
  datas = [
    '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    `0x000000000000000000000000956f47f50a910163d8bf957cf5846d573e7f87ca000000000000000000000000${sender}00000000000000000000000000000000000000000000D3C21BCECCEDA10000000000000000000000000000000000000000000000000000000000000000000000`,
    `0x00000000000000000000000000000000000000000000D3C21BCECCEDA1000000000000000000000000000000${sender}0000000000000000000000000000000000000000000000000000000000000000`
  ];

  // 10. Cook FEI-DPI Kashi deposit
  await kashiFeiDPI.cook([11, 20, 1], [0, 0, 0], datas);
}

// Trigger deposit logic on the various FEI PCV deposits
async function teardown(addresses, oldContracts, contracts, logging) {
  const {
    indexCoopFusePoolFeiPCVDeposit,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool24FeiPCVDeposit
  } = contracts;

  rariPool6FeiPCVDeposit.deposit();
  rariPool7FeiPCVDeposit.deposit();
  rariPool24FeiPCVDeposit.deposit();
  creamFeiPCVDeposit.deposit();
  poolPartyFeiPCVDeposit.deposit();
  indexCoopFusePoolFeiPCVDeposit.deposit();
}

async function validate(addresses, oldContracts, contracts) {
  const { timelockAddress } = addresses;

  const {
    rariPool8FeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    kashiFeiTribe,
    kashiFeiEth,
    kashiFeiXSushi,
    kashiFeiDPI,
    creamFeiPCVDeposit,
    poolPartyFeiPCVDeposit,
    indexCoopFusePoolFeiPCVDeposit
  } = contracts;

  const balances = {
    kashiFeiEth: (await kashiFeiEth.balanceOf(timelockAddress)).toString() === `2500000${e18}`,
    kashiFeiTribe: (await kashiFeiTribe.balanceOf(timelockAddress)).toString() === `2500000${e18}`,
    kashiFeiXSushi: (await kashiFeiXSushi.balanceOf(timelockAddress)).toString() === `2500000${e18}`,
    kashiFeiDPI: (await kashiFeiDPI.balanceOf(timelockAddress)).toString() === `1000000${e18}`,
    rariPool8FeiPCVDeposit: (await rariPool8FeiPCVDeposit.balance()).toString() > `10000000${e18}`,
    creamFeiPCVDeposit: (await creamFeiPCVDeposit.balance()).toString() === `5000000${e18}`,
    poolPartyFeiPCVDeposit: (await poolPartyFeiPCVDeposit.balance()).toString() === `1333333${e18}`,
    indexCoopFusePoolFeiPCVDeposit: (await indexCoopFusePoolFeiPCVDeposit.balance()).toString() === `1000000${e18}`,
    rariPool6FeiPCVDeposit: (await rariPool6FeiPCVDeposit.balance()).toString() === `1000000${e18}`,
    rariPool7FeiPCVDeposit: (await rariPool7FeiPCVDeposit.balance()).toString() === `1000000${e18}`,
    rariPool24FeiPCVDeposit: (await rariPool24FeiPCVDeposit.balance()).toString() === `1000000${e18}`
  };

  console.log(balances);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
