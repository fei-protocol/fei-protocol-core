const QuadraticTimelockedDelegator = artifacts.require('QuadraticTimelockedDelegator');

// DEPLOY_FILE=erwan_timelock.js npm run deploy:rinkeby

async function deploy(deployAddress, addresses, logging = false) {
  const {
    tribeAddress
  } = addresses;

  const delegator = await QuadraticTimelockedDelegator.new(
    tribeAddress,
    '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148', // eswak.eth
    4 * 365 * 24 * 60 * 60, // 4 years
    { from: deployAddress }
  );

  logging ? console.log('QuadraticTimelockedDelegator deployed at:', delegator.address) : undefined;

  return {
    delegator
  };
}

module.exports = { deploy };
