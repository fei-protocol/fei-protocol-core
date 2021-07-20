const { BN } = require('@openzeppelin/test-helpers');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');
const fipSeven = require('../dao/fip_7');
const { check, getAddresses } = require('../utils/helpers');

const {
  timelockAddress,
  rariPoolEightComptrollerAddress,
  rariPoolEightFeiAddress,
  rariPoolEightTribeAddress,
  rariPoolEightEthAddress,
  rariPoolEightDaiAddress,
  feiAddress
} = getAddresses();

async function getState() {
  const rariPoolEightComptroller = await CErc20Delegator.at(rariPoolEightComptrollerAddress);
  const rariPoolEightFei = await CErc20Delegator.at(rariPoolEightFeiAddress);
  const rariPoolEightTribe = await CErc20Delegator.at(rariPoolEightTribeAddress);
  const rariPoolEightEth = await CErc20Delegator.at(rariPoolEightEthAddress);
  const rariPoolEightDai = await CErc20Delegator.at(rariPoolEightDaiAddress);
  const fei = await Fei.at(feiAddress);    

  const totalFeiSupply = await fei.totalSupply();
  const feiInRariPool = await fei.balanceOf(rariPoolEightFei.address);
  const currentPoolComptrollerAdmin = await rariPoolEightComptroller.admin();
  const currentPoolFeiAdmin = await rariPoolEightFei.admin();
  const currentPoolTribeAdmin = await rariPoolEightTribe.admin();
  const currentPoolEthAdmin = await rariPoolEightEth.admin();
  const currentPoolDaiAdmin = await rariPoolEightDai.admin();
  const poolFeiAllowance = await fei.allowance(timelockAddress, rariPoolEightFei.address);
  const timelockCTokenBalance = await rariPoolEightFei.balanceOf(timelockAddress);

  return {
    currentPoolComptrollerAdmin,
    currentPoolFeiAdmin,
    currentPoolTribeAdmin,
    currentPoolEthAdmin,
    currentPoolDaiAdmin,
    poolFeiAllowance,
    timelockCTokenBalance,
    totalFeiSupply,
    feiInRariPool,
  };
}

async function validateState(newState, oldState) {
  const {
    currentPoolComptrollerAdmin,
    currentPoolFeiAdmin,
    currentPoolTribeAdmin,
    currentPoolEthAdmin,
    currentPoolDaiAdmin,
    poolFeiAllowance,
    timelockCTokenBalance,
    totalFeiSupply,
    feiInRariPool,
  } = newState;

  check(currentPoolComptrollerAdmin === timelockAddress, 'Rari pool comptroller transfered to Timelock');
  check(currentPoolFeiAdmin === timelockAddress, 'Rari pool FEI transfered to Timelock');
  check(currentPoolTribeAdmin === timelockAddress, 'Rari pool TRIBE transfered to Timelock');
  check(currentPoolEthAdmin === timelockAddress, 'Rari pool ETH transfered to Timelock');
  check(currentPoolDaiAdmin === timelockAddress, 'Rari pool DAI transfered to Timelock');

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
