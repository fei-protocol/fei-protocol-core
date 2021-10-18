import hre, { ethers, artifacts, network } from 'hardhat';
import chai from 'chai';
import CBN from 'chai-bn';
import { Core, Core__factory } from '@custom-types/contracts';
import { BigNumberish, Signer } from 'ethers';
import { env } from 'process';

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
  ] = (await ethers.getSigners()).map((signer) => signer.address);

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

async function increaseTime(amount: number | string | BigNumberish) {
  await time.increase(amount);
}

async function resetTime() {
  await resetFork();
}

async function resetFork() {
  await hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: hre.config.networks.hardhat.forking
          ? {
              jsonRpcUrl: hre.config.networks.hardhat.forking.url
            }
          : undefined
      }
    ]
  });
}

async function setNextBlockTimestamp(time: number) {
  await hre.network.provider.request({
    method: 'evm_setNextBlockTimestamp',
    params: [time]
  });
}

async function latestTime(): Promise<number> {
  const { timestamp } = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

  return timestamp as number;
}

async function mine() {
  await hre.network.provider.request({
    method: 'evm_mine'
  });
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

async function expectRevert(tx, errorMessage: string) {
  await expect(tx).to.be.revertedWith(errorMessage);
}

async function expectUnspecifiedRevert(tx) {
  await expect(tx).to.be.reverted;
}

const ZERO_ADDRESS = ethers.constants.AddressZero;
const MAX_UINT256 = ethers.constants.MaxUint256;

const balance = {
  current: async (address: string) => {
    const balance = await ethers.provider.getBalance(address);
    return balance;
  }
};

const time = {
  latest: async () => latestTime(),

  latestBlock: async () => await ethers.provider.getBlockNumber(),

  increase: async (duration: number | string | BigNumberish) => {
    const durationBN = ethers.BigNumber.from(duration);

    if (durationBN.lt(ethers.constants.Zero)) throw Error(`Cannot increase time by a negative amount (${duration})`);

    await hre.network.provider.send('evm_increaseTime', [durationBN.toNumber()]);

    await hre.network.provider.send('evm_mine');
  },

  increaseTo: async (target: number | string | BigNumberish) => {
    const targetBN = ethers.BigNumber.from(target);

    const now = ethers.BigNumber.from(await time.latest());

    if (targetBN.lt(now)) throw Error(`Cannot increase current time (${now}) to a moment in the past (${target})`);
    const diff = targetBN.sub(now);
    return time.increase(diff);
  },

  advanceBlockTo: async (target: number | string | BigNumberish) => {
    target = ethers.BigNumber.from(target);

    const currentBlock = await time.latestBlock();
    const start = Date.now();
    let notified;
    if (target.lt(currentBlock))
      throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);
    while (ethers.BigNumber.from(await time.latestBlock()).lt(target)) {
      if (!notified && Date.now() - start >= 5000) {
        notified = true;
        console.warn(`You're advancing many blocks; this test may be slow.`);
      }
      await time.advanceBlock();
    }
  },

  advanceBlock: async () => {
    await hre.network.provider.send('evm_mine');
  }
};

export {
  // utils
  ZERO_ADDRESS,
  MAX_UINT256,
  time,
  balance,
  expectRevert,
  expectUnspecifiedRevert,
  // functions
  mine,
  getCore,
  getAddresses,
  increaseTime,
  latestTime,
  expectApprox,
  deployDevelopmentWeth,
  getImpersonatedSigner,
  setNextBlockTimestamp,
  resetTime,
  resetFork
};
