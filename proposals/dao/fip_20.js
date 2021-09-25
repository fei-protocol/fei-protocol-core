import { expectApprox } from '../../test/helpers';

const { web3 } = require('hardhat');
const { expect } = require('chai');

const e18 = '000000000000000000';

/* We'd need to pause the dripper and stabilizer */
async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Grant new stabilizer burner
 2. Grant Aave dripper as PCV Controller
 3. Grant Compound dripper as PCV Controller
 4. Revoke burner from old stabilizer
 5. Withdraw 6000 ETH from old stabilizer to new stablizer using ratioController
 6. Withdraw 75k ETH from dripper to Compound
 7. Withdraw 75k ETH from dripper to Aave
 8. Withdraw 14,135 ETH from dripper to stETH deposit
 9. Update ETH Bonding Curve allocation
 10. Pause old reserve stabilizer
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    core,
    bondingCurve,
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
  await oldEthReserveStabilizer.withdraw(ethReserveStabilizer.address, `6000${e18}`);

  // 6.
  await ethPCVDripper.withdrawETH(aaveEthPCVDeposit.address, `75000${e18}`);

  // 7.
  await ethPCVDripper.withdrawETH(compoundEthPCVDeposit.address, `75000${e18}`);

  // 8.
  await ethPCVDripper.withdrawETH(ethLidoPCVDeposit.address, `14135${e18}`);

  // 9.
  await bondingCurve.setAllocation([aaveEthPCVDeposit.address, compoundEthPCVDeposit.address], [5000, 5000]);

  // 10.
  await oldEthReserveStabilizer.pause();
}

async function teardown(addresses, oldContracts, contracts, logging) {
  const { aaveEthPCVDeposit, compoundEthPCVDeposit, ethLidoPCVDeposit } = contracts;
  await aaveEthPCVDeposit.deposit();
  await compoundEthPCVDeposit.deposit();
  await ethLidoPCVDeposit.deposit();
}

async function validate(addresses, oldContracts, contracts) {
  const { bondingCurve } = oldContracts;
  const { aaveEthPCVDeposit, compoundEthPCVDeposit, ethLidoPCVDeposit } = contracts;
  const { aaveEthPCVDepositAddress, compoundEthPCVDepositAddress } = addresses;
  const allocation = await bondingCurve.getAllocation();
  expect(allocation[0][0]).to.be.equal(aaveEthPCVDepositAddress);
  expect(allocation[0][1]).to.be.equal(compoundEthPCVDepositAddress);
  expect(allocation[1][0]).to.be.bignumber.equal('5000');
  expect(allocation[1][1]).to.be.bignumber.equal('5000');

  expectApprox(await aaveEthPCVDeposit.balance(), `75000${e18}`);
  expectApprox(await compoundEthPCVDeposit.balance(), `75000${e18}`);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
