const {
  ZERO_ADDRESS,
  MAX_UINT256,
} = require('@openzeppelin/test-helpers/src/constants');

const { web3 } = require('hardhat');

const {
  BN,
  expectEvent,
  expectRevert,
  ether,
  balance,
  contract,
  time,
} = require('@openzeppelin/test-helpers');

const chai = require('chai');

// use default BigNumber
chai.use(require('chai-bn')(BN));

const { expect } = chai;

const ForceEth = artifacts.require('ForceEth');
const Core = artifacts.require('Core');

async function getAddresses() {
  const [
    userAddress,
    secondUserAddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress,
  ] = await web3.eth.getAccounts();

  return {
    userAddress,
    secondUserAddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress,
  };
}

async function getCore(complete) {
  const {
    governorAddress,
    genesisGroup,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress,
  } = await getAddresses();
  const core = await Core.new({ from: governorAddress });
  await core.init({ from: governorAddress });

  await core.setGenesisGroup(genesisGroup, { from: governorAddress });
  if (complete) {
    await core.completeGenesisGroup({ from: genesisGroup });
  }

  await core.grantMinter(minterAddress, { from: governorAddress });
  await core.grantBurner(burnerAddress, { from: governorAddress });
  await core.grantPCVController(pcvControllerAddress, {
    from: governorAddress,
  });
  await core.grantGuardian(guardianAddress, { from: governorAddress });

  return core;
}

async function forceEth(to, amount) {
  const forceEthContract = await ForceEth.new({ value: amount });
  await forceEthContract.forceEth(to);
}

async function expectApprox(actual, expected) {
  const delta = expected.div(new BN('1000'));
  expect(actual).to.be.bignumber.closeTo(expected, delta);
}

async function testMultipleUsersPooling(
  masterChief,
  lpToken,
  userAddresses,
  incrementAmount,
  blocksToAdvance,
  lockLength,
  totalStaked,
  pid
) {
  // if lock length isn't defined, it defaults to 0
  lockLength = lockLength === undefined ? 0 : lockLength;

  for (let i = 0; i < userAddresses.length; i++) {
    let lockBlockAmount = lockLength;
    if (Array.isArray(lockLength)) {
      lockBlockAmount = lockLength[i];
      if (lockLength.length !== userAddresses.length) {
        throw new Error('invalid lock length');
      }
    }

    await lpToken.approve(masterChief.address, totalStaked, { from: userAddresses[i] });
    await masterChief.deposit(
      pid,
      totalStaked,
      lockBlockAmount,
      { from: userAddresses[i] },
    );
  }

  const pendingBalances = [];
  for (let i = 0; i < userAddresses.length; i++) {
    const balance = new BN(await masterChief.pendingSushi(pid, userAddresses[i], 0));
    pendingBalances.push(balance);
  }

  for (let i = 0; i < blocksToAdvance; i++) {
    for (let j = 0; j < pendingBalances.length; j++) {
      pendingBalances[j] = new BN(await masterChief.pendingSushi(pid, userAddresses[j], 0));
    }

    await time.advanceBlock();

    for (let j = 0; j < userAddresses.length; j++) {
      let userIncrementAmount = incrementAmount;
      if (Array.isArray(incrementAmount)) {
        userIncrementAmount = incrementAmount[j];
        if (incrementAmount.length !== userAddresses.length) {
          throw new Error('invalid increment amount length');
        }
      }

      expectApprox(
        pendingBalances[j].add(userIncrementAmount),
        new BN(await masterChief.pendingSushi(pid, userAddresses[j], 0)),
      );
    }
  }
}


module.exports = {
  // utils
  ZERO_ADDRESS,
  MAX_UINT256,
  web3,
  BN,
  expectEvent,
  expectRevert,
  balance,
  time,
  expect,
  contract,
  // functions
  getCore,
  getAddresses,
  forceEth,
  expectApprox,
  ether,
  testMultipleUsersPooling,
};
