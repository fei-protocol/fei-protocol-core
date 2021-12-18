import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox } from '@test/helpers';
import { getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));
const toBN = ethers.BigNumber.from;
const e18 = ethers.constants.WeiPerEther;

// LBP swapper
const LBP_FREQUENCY = '604800'; // weekly
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(100_000); // 100k FEI

/*

TRIBE Buybacks

DEPLOY ACTIONS:

1. Deploy TRIBE LBP Swapper
2. Create TRIBE LBP pool
3. Init TRIBE LBP Swapper

DAO ACTIONS:
1. Set PCVEquityMinter target to new buyback swapper
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  if (!addresses.core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1.
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const noFeeFeiTribeLBPSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.tribeUsdCompositeOracle,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    addresses.fei,
    addresses.tribe,
    addresses.core, // send TRIBE back to treasury
    MIN_LBP_SIZE
  );

  await noFeeFeiTribeLBPSwapper.deployTransaction.wait();

  logging && console.log('FEI->TRIBE LBP Swapper: ', noFeeFeiTribeLBPSwapper.address);

  // 2.
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [addresses.fei, addresses.tribe],
    [ethers.constants.WeiPerEther.mul(90).div(100), ethers.constants.WeiPerEther.mul(10).div(100)],
    ethers.constants.WeiPerEther.mul(30).div(10_000),
    noFeeFeiTribeLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeFeiTribeLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', noFeeFeiTribeLBPAddress);

  // 3.
  const tx2 = await noFeeFeiTribeLBPSwapper.init(noFeeFeiTribeLBPAddress);
  await tx2.wait();

  return {
    noFeeFeiTribeLBPSwapper
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Fake as if the guardian paused the feiTribeLBPSwapper and pcvEquityMinter
  const guardianSigner = await getImpersonatedSigner('0xB8f482539F2d3Ae2C9ea6076894df36D1f632775');
  await contracts.feiTribeLBPSwapper.connect(guardianSigner).pause();
  await contracts.pcvEquityMinter.connect(guardianSigner).pause();
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-buyback_newpool');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  expect(await contracts.noFeeFeiTribeLBPSwapper.isTimeStarted()).to.be.true;

  const price = (await contracts.noFeeFeiTribeLBPSwapper.readOracle())[0];
  // sanity check on the price offered in the pool
  expect(price).to.be.at.least(e18.mul(toBN(1)).div(toBN(2))); // TRIBE price > 0.5 FEI
  expect(price).to.be.at.most(e18.mul(toBN(2))); // TRIBE price < 2 FEI

  const response = await contracts.noFeeFeiTribeLBPSwapper.getTokensIn(100000);
  const amounts = response[1];
  console.log('amounts[0]', amounts[0]);
  console.log('amounts[1]', amounts[1]);
  expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(100000));
  console.log('aaaaa', price.mul(100000).div(ethers.constants.WeiPerEther).div(10).toString());
  // TRIBE/FEI price * FEI amount * 10% ~= amount
  expectApprox(price.mul(100000).div(ethers.constants.WeiPerEther).div(10), amounts[1]);
};
