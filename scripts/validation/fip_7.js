const { BN } = require('@openzeppelin/test-helpers');
const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');
const fipSeven = require('../dao/fip_7');

const tetranodePoolAddress = '0xd8553552f8868C1Ef160eEdf031cF0BCf9686945';
const feiTimelockAddress = '0x639572471f2f318464dc01066a56867130e45E25';
const feiAddress = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';

function check(flag, message) {
    if (flag) {
      console.log(`PASS: ${message}`); 
    } else {
      throw Error(`FAIL: ${message}`);
    }
  }

async function getState() {
    const rariPoolEight = await CErc20Delegator.at(tetranodePoolAddress)
    const fei = await Fei.at(feiAddress);    

    const totalFeiSupply = await fei.totalSupply();
    const feiInRariPool = await fei.balanceOf(tetranodePoolAddress);
    const currentPoolAdmin = await rariPoolEight.admin();
    const poolFeiAllowance = await fei.allowance(feiTimelockAddress, tetranodePoolAddress);
    const timelockCTokenBalance = await rariPoolEight.balanceOf(feiTimelockAddress);

    return {
        currentPoolAdmin,
        poolFeiAllowance,
        timelockCTokenBalance,
        totalFeiSupply,
        feiInRariPool,
    }
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
async function fullLocalValidation() {
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
async function postFipValidation() {
  const stateAfterFipSeven = await getState();
  console.log('State after FIP-7:', JSON.stringify(stateAfterFipSeven, null, 2), '\n');

  await validateState(stateAfterFipSeven);
}

fullLocalValidation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// postFipValidation()
// .then(() => process.exit(0))
// .catch((error) => {
//   console.error(error);
//   process.exit(1);
// });