import { Core, Core__factory } from '@custom-types/contracts';
import { NamedAddresses } from '@custom-types/types';
import Safe from '@gnosis.pm/safe-core-sdk';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import CBN from 'chai-bn';
import { BigNumber, BigNumberish, Contract, Signer } from 'ethers';
import hre, { artifacts, ethers, network } from 'hardhat';

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

async function getAddresses(): Promise<NamedAddresses> {
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

async function getImpersonatedSigner(address: string): Promise<SignerWithAddress> {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  });

  const signer = await ethers.getSigner(address);

  return signer;
}

async function increaseTime(amount: number | string | BigNumberish): Promise<void> {
  await time.increase(amount);
}

async function resetTime(): Promise<void> {
  await resetFork();
}

async function resetFork(): Promise<void> {
  if (process.env.NO_RESET) {
    return;
  }
  await hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: hre.config.networks.hardhat.forking
          ? {
              jsonRpcUrl: hre.config.networks.hardhat.forking.url,
              blockNumber: hre.config.networks.hardhat.forking.blockNumber
            }
          : undefined
      }
    ]
  });
}

async function setNextBlockTimestamp(time: number): Promise<void> {
  await hre.network.provider.request({
    method: 'evm_setNextBlockTimestamp',
    params: [time]
  });
}

async function latestTime(): Promise<number> {
  const { timestamp } = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

  return timestamp as number;
}

async function mine(): Promise<void> {
  await hre.network.provider.request({
    method: 'hardhat_mine'
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

const validateArraysEqual = (arrayA: string[], arrayB: string[]) => {
  expect(arrayA.length).to.equal(arrayB.length);
  arrayA.every((a) => expect(arrayB.map((b) => b.toLowerCase()).includes(a.toLowerCase())));
};

async function expectApprox(
  actual: string | number | BigNumberish,
  expected: string | number | BigNumberish,
  magnitude = '1000'
): Promise<void> {
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

// expectApproxAbs(a, b, c) checks if b is between [a-c, a+c]
async function expectApproxAbs(
  actual: string | number | BigNumberish,
  expected: string | number | BigNumberish,
  diff = '1000000000000000000'
): Promise<void> {
  const actualBN = toBN(actual);
  const expectedBN = toBN(expected);
  const diffBN = toBN(diff);

  const lowerBound = expectedBN.sub(diffBN);
  const upperBound = expectedBN.add(diffBN);

  expect(actualBN).to.be.gte(lowerBound);
  expect(actualBN).to.be.lte(upperBound);
}

async function expectEvent(tx: any, contract: any, event: string, args: any[]): Promise<void> {
  await expect(tx)
    .to.emit(contract, event)
    .withArgs(...args);
}

async function expectRevert(tx: Promise<any>, errorMessage: string): Promise<void> {
  await expect(tx).to.be.revertedWith(errorMessage);
}

async function expectUnspecifiedRevert(tx: Promise<any>): Promise<void> {
  await expect(tx).to.be.reverted;
}

const ZERO_ADDRESS = ethers.constants.AddressZero;
const MAX_UINT256 = ethers.constants.MaxUint256;

const balance = {
  current: async (address: string): Promise<BigNumber> => {
    const balance = await ethers.provider.getBalance(address);
    return balance;
  }
};

async function overwriteChainlinkAggregator(aggregatorAddress: string, value: string, decimals: string) {
  // Deploy new mock aggregator
  const factory = await ethers.getContractFactory('MockChainlinkOracle');
  const mockAggregator = await factory.deploy(value, decimals);

  await mockAggregator.deployTransaction.wait();

  // Overwrite storage at chainlink address to use mock aggregator for updates
  const address = `0x00000000000000000000${mockAggregator.address.slice(2)}0005`;
  await hre.network.provider.send('hardhat_setStorageAt', [aggregatorAddress, '0x2', address]);
}

const time = {
  latest: async (): Promise<number> => latestTime(),

  latestBlock: async (): Promise<number> => await ethers.provider.getBlockNumber(),

  increase: async (duration: number | string | BigNumberish): Promise<void> => {
    const durationBN = ethers.BigNumber.from(duration);

    if (durationBN.lt(ethers.constants.Zero)) throw Error(`Cannot increase time by a negative amount (${duration})`);

    if (durationBN.eq(ethers.constants.Zero)) {
      await hre.network.provider.send('hardhat_mine');
    } else {
      await hre.network.provider.send('hardhat_mine', ['0x2', ethers.utils.hexStripZeros(durationBN.toHexString())]);
    }
  },

  increaseTo: async (target: number | string | BigNumberish): Promise<void> => {
    const targetBN = ethers.BigNumber.from(target);

    const now = ethers.BigNumber.from(await time.latest());

    if (targetBN.lt(now)) throw Error(`Cannot increase current time (${now}) to a moment in the past (${target})`);
    const diff = targetBN.sub(now);
    return time.increase(diff);
  },

  advanceBlockTo: async (target: number | string | BigNumberish): Promise<void> => {
    target = ethers.BigNumber.from(target);

    const currentBlock = await time.latestBlock();
    if (target.lt(currentBlock))
      throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);

    const diff = target.sub(currentBlock);
    await hre.network.provider.send('hardhat_mine', [ethers.utils.hexStripZeros(diff.toHexString())]);
  },

  advanceBlock: async (): Promise<void> => {
    await hre.network.provider.send('hardhat_mine');
  }
};

async function performDAOAction(
  feiDAO: Contract,
  multisigAddress: string,
  calldatas: string[],
  targets: string[],
  values: number[]
): Promise<void> {
  const description = '';

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [multisigAddress]
  });

  const signer = await ethers.getSigner(multisigAddress);

  // Propose
  // note ethers.js requires using this notation when two overloaded methods exist)
  // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
  await feiDAO.connect(signer)['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

  const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));
  const startBlock = (await feiDAO.proposals(pid)).startBlock;
  await time.advanceBlockTo(startBlock.toString());

  // vote
  await feiDAO.connect(signer).castVote(pid, 1);

  const endBlock = (await feiDAO.proposals(pid)).endBlock;
  await time.advanceBlockTo(endBlock.toString());

  // queue
  await feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
    targets,
    values,
    calldatas,
    ethers.utils.keccak256(description)
  );

  await time.increase('1000000');

  // execute
  await feiDAO['execute(address[],uint256[],bytes[],bytes32)'](
    targets,
    values,
    calldatas,
    ethers.utils.keccak256(description)
  );
}

async function initialiseGnosisSDK(safeOwner: Signer, safeAddress: string): Promise<Safe> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signer: safeOwner
  });
  const { chainId } = await safeOwner.provider!.getNetwork();
  const contractNetworks = {
    [chainId]: {
      multiSendAddress: '0x8D29bE29923b68abfDD21e541b9374737B49cdAD',
      safeMasterCopyAddress: '0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F',
      safeProxyFactoryAddress: '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
    }
  };
  return Safe.create({ ethAdapter, safeAddress, contractNetworks });
}

export {
  ZERO_ADDRESS,
  MAX_UINT256,
  time,
  balance,
  expectEvent,
  expectRevert,
  expectUnspecifiedRevert,
  // functions
  mine,
  getCore,
  getAddresses,
  increaseTime,
  latestTime,
  expectApprox,
  expectApproxAbs,
  deployDevelopmentWeth,
  getImpersonatedSigner,
  setNextBlockTimestamp,
  resetTime,
  resetFork,
  overwriteChainlinkAggregator,
  performDAOAction,
  initialiseGnosisSDK,
  validateArraysEqual
};
