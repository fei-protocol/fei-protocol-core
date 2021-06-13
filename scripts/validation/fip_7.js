const { BN } = require('@openzeppelin/test-helpers');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');
const fipSeven = require('../dao/fip_7');
const { check } = require('./helpers');

const feiTimelockAddress = process.env.MAINNET_TIMELOCK;

async function getState() {
  const rariPoolEight = await CErc20Delegator.at(process.env.MAINNET_RARI_POOL_8);
  const fei = await Fei.at(process.env.MAINNET_FEI);    

  const totalFeiSupply = await fei.totalSupply();
  const feiInRariPool = await fei.balanceOf(rariPoolEight.address);
  const currentPoolAdmin = await rariPoolEight.admin();
  const poolFeiAllowance = await fei.allowance(feiTimelockAddress, rariPoolEight.address);
  const timelockCTokenBalance = await rariPoolEight.balanceOf(feiTimelockAddress);

  return {
    currentPoolAdmin,
    poolFeiAllowance,
    timelockCTokenBalance,
    totalFeiSupply,
    feiInRariPool,
  };
}

async function validateState(newState, oldState) {
  const {
    currentPoolAdmin,
    poolFeiAllowance,
    timelockCTokenBalance,
    totalFeiSupply,
    feiInRariPool,
  } = newState;

  check(currentPoolAdmin === feiTimelockAddress, 'Rari pool transfered to Timelock');

  check(poolFeiAllowance.toString() === '0', 'Allowance given to Rari pool has been used');

  check(timelockCTokenBalance.gt(0), 'Timelock is holding the cTokens');

  if (oldState) {
    check(
      totalFeiSupply.sub(oldState.totalFeiSupply).eq(new BN('10000000000000000000000000')), 
      'Global FEI supply increased by 10M'
    );
  
    check(
      feiInRariPool.sub(oldState.feiInRariPool).eq(new BN('10000000000000000000000000')), 
      'FEI in Rari pool increased by 10M'
    );
  }    
}

// Runs the fip-7 script with before+after validation
async function fullLocalValidation() { // eslint-disable-line
  const stateBeforeFipSeven = await getState();
  console.log('State before FIP-7:', JSON.stringify(stateBeforeFipSeven, null, 2));

  console.log('Running FIP-7 execution script...');
  await fipSeven.main();
  console.log('Finished running FIP-7 execution script.');

  const stateAfterFipSeven = await getState();
  console.log('State after FIP-7:', JSON.stringify(stateAfterFipSeven, null, 2), '\n');

  await validateState(stateAfterFipSeven, stateBeforeFipSeven);
}

// Runs validation assuming fip-7 has already been executed
async function postFipValidation() { // eslint-disable-line
  const stateAfterFipSeven = await getState();
  console.log('State after FIP-7:', JSON.stringify(stateAfterFipSeven, null, 2), '\n');

  await validateState(stateAfterFipSeven);
}

// fullLocalValidation()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// postFipValidation()
// .then(() => process.exit(0))
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });
