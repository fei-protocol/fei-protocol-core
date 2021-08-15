const { web3 } = require('hardhat');

const e18 = '000000000000000000';

/* We'd need to pause the dripper and stabilizer */
async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Grant new stabilizer burner
 2. Grant Aave dripper as PCV Controller
 3. Grant Compound dripper as PCV Controller
 4. Revoke burner from old stabilizer
 5. Withdraw 9,986.9 ETH from old stabilizer to new stablizer using ratioController
 6. Withdraw 75k ETH from dripper to Compound
 7. Withdraw 75k ETH from dripper to Aave
 8. Withdraw 14,611 ETH from dripper to stETH deposit
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    core,
    ethReserveStabilizer,
    oldEthReserveStabilizer,
    aaveEthPCVDeposit,
    compoundEthPCVDeposit,
    aaveEthPCVDripController,
    compoundEthPCVDripController,
    ethLidoPCVDeposit,
    ethPCVDripper
  } = contracts;

  // 1. 
  await core.grantBurner(ethReserveStabilizer.address);

  // 2.
  await core.grantPCVController(aaveEthPCVDripController.address);
  
  // 3. 
  await core.grantPCVController(compoundEthPCVDripController.address);

  // 4.
  await core.revokeBurner(oldEthReserveStabilizer.address);

  // 5.
  await oldEthReserveStabilizer.withdraw(ethReserveStabilizer.address, `9986${e18}`);

  // 6.
  await ethPCVDripper.withdrawETH(aaveEthPCVDeposit.address, `75000${e18}`);

  // 7.
  await ethPCVDripper.withdrawETH(compoundEthPCVDeposit.address, `75000${e18}`);

  // 8.
  await ethPCVDripper.withdrawETH(ethLidoPCVDeposit.address, `14611${e18}`);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {}

module.exports = {
  setup, run, teardown, validate
};
