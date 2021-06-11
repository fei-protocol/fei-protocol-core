const { BN } = require('@openzeppelin/test-helpers');
const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');
const fipEight = require("../dao/fip_8");

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
    const currentPoolAdmin = await rariPoolEight.admin();
    const poolFeiAllowance = await fei.allowance(feiTimelockAddress, tetranodePoolAddress);
    const timelockCTokenBalance = await rariPoolEight.balanceOf(feiTimelockAddress);

    return {
        currentPoolAdmin,
        poolFeiAllowance,
        timelockCTokenBalance,
        totalFeiSupply,
    }
}

async function validateState(newState, oldState) {
    const {
        currentPoolAdmin,
        poolFeiAllowance,
        timelockCTokenBalance,
        totalFeiSupply,
    } = newState;

    check(currentPoolAdmin === feiTimelockAddress, 'Rari pool transfered to Timelock');

    check(poolFeiAllowance.toString() === "0", "Allowance given to Rari pool has been used");

    // TODO: figure out if we can get the exact number every time instead of just checking > 0
    check(timelockCTokenBalance.gt(0), "Timelock is holding the cTokens");

    check(totalFeiSupply.sub(oldState.totalFeiSupply).eq(new BN("10000000000000000000000000")), "FEI supply increased by 10M");
}

async function main() {
    const stateBeforeFipEight = await getState();
    console.log("State before FIP-8:", JSON.stringify(stateBeforeFipEight, null, 2));

    console.log("Running FIP-8 execution script...");
    await fipEight.main();
    console.log("Finished running FIP-8 execution script.");

    const stateAfterFipEight = await getState();
    console.log("State after FIP-8:", JSON.stringify(stateAfterFipEight, null, 2));

    await validateState(stateAfterFipEight, stateBeforeFipEight);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
