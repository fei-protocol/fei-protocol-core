import { ZERO_ADDRESS, MAX_UINT256 } from '@openzeppelin/test-helpers/src/constants';

import hre, { web3, ethers, artifacts } from 'hardhat';

import { expectEvent, expectRevert, balance, contract, time } from '@openzeppelin/test-helpers';

import chai from 'chai';
import CBN from "chai-bn";

// use default BigNumber
chai.use(CBN(ethers.BigNumber));

const toBN = ethers.BigNumber.from

const { expect } = chai;

const Core = artifacts.readArtifactSync('Core');

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

async function getCore() {
  const {
    governorAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress,
  } = await getAddresses();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAddress],
  })

  const governorSigner = await ethers.getSigner(governorAddress);

  const coreFactory = await ethers.getContractFactory(Core.abi, Core.bytecode, governorSigner);
  const core = await coreFactory.deploy();

  await core.init();

  await core.grantMinter(minterAddress);
  await core.grantBurner(burnerAddress);
  await core.grantPCVController(pcvControllerAddress);
  await core.grantGuardian(guardianAddress);

  await hre.network.provider.request({
    method: 'hardhat_stopImpersonatingAccount',
    params: [governorAddress],
  })

  return core;
}

async function expectApprox(actual, expected, magnitude = '1000') {
  let actualBN = toBN(actual);
  let expectedBN = toBN(expected);
  let magnitudeBN = toBN(magnitude);

  let diff = actualBN.sub(expectedBN);
  let diffAbs = diff.abs();

  if (expected.toString() == '0' || expected == 0 || expected == '0') {
    expect(diffAbs).to.be.lt(magnitudeBN);
  } else {
    expect(diffAbs.div(expected).lt(magnitudeBN)).to.be.true;
  }
}

export {
  // utils
  ZERO_ADDRESS,
  MAX_UINT256,
  expectEvent,
  expectRevert,
  balance,
  time,
  // functions
  getCore,
  getAddresses,
  expectApprox
};
