import { ZERO_ADDRESS, MAX_UINT256 } from '@openzeppelin/test-helpers/src/constants';
import hre, { web3, ethers, artifacts, network } from 'hardhat';
import { expectRevert, balance, time } from '@openzeppelin/test-helpers';
import chai from 'chai';
import CBN from 'chai-bn';
import { Core, Core__factory } from '@custom-types/contracts';
import { Signer } from 'ethers';

// use default BigNumber
chai.use(CBN(ethers.BigNumber));

const toBN = ethers.BigNumber.from;
const { expect } = chai;
const WETH9 = artifacts.readArtifactSync('WETH9');

async function deployDevelopmentWeth(): Promise<void> {
  await network.provider.send('hardhat_setCode', [
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    WETH9.deployedBytecode
  ]);

  const weth = await ethers.getContractAt(WETH9.abi, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  await weth.init();
}

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
    guardianAddress
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
    guardianAddress
  };
}

async function getImpersonatedSigner(address: string): Promise<Signer> {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  });

  const signer = await ethers.getSigner(address);

  return signer;
}

async function getCore(): Promise<Core> {
  const { governorAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress } = await getAddresses();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAddress]
  });

  const governorSigner = await ethers.getSigner(governorAddress);

  const coreFactory = new Core__factory(governorSigner);
  const core = await coreFactory.deploy();

  await core.init();
  await core.grantMinter(minterAddress);
  await core.grantBurner(burnerAddress);
  await core.grantPCVController(pcvControllerAddress);
  await core.grantGuardian(guardianAddress);

  return core;
}

async function expectApprox(actual, expected, magnitude = '1000') {
  const actualBN = toBN(actual);
  const expectedBN = toBN(expected);
  const magnitudeBN = toBN(magnitude);

  const diff = actualBN.sub(expectedBN);
  const diffAbs = diff.abs();

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
  expectRevert,
  balance,
  time,
  // functions
  getCore,
  getAddresses,
  expectApprox,
  deployDevelopmentWeth
};
