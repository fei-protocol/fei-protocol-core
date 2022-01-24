import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { getImpersonatedSigner, time, expectRevert } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = '73_swap';

// LBP swapper
const LBP_FREQUENCY = '259200'; // 3 days
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(1_000_000); // 1M
let poolId; // auction pool id

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const lusdToDaiLBPSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.oneConstantOracle,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '100000000000000000', // small weight 10%
    '900000000000000000', // large weight 90%
    addresses.lusd,
    addresses.dai,
    addresses.compoundDaiPCVDeposit, // send DAI to Compound
    MIN_LBP_SIZE
  );

  await lusdToDaiLBPSwapper.deployTransaction.wait();

  logging && console.log('LUSD->DAI LBP Swapper: ', lusdToDaiLBPSwapper.address);

  // 2.
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'LUSD->DAI Auction Pool', // pool name
    'apLUSD-DAI', // lbp token symbol
    [addresses.lusd, addresses.dai], // pool contains [LUSD, DAI]
    [ethers.constants.WeiPerEther.mul(90).div(100), ethers.constants.WeiPerEther.mul(10).div(100)], // initial weights 10%/90%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    lusdToDaiLBPSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeLusdDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeLusdDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3.
  const tx2 = await lusdToDaiLBPSwapper.init(noFeeLusdDaiLBPAddress);
  await tx2.wait();

  // 4.
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const lusdToDaiLensDai = await BPTLensFactory.deploy(
    addresses.dai, // token reported in
    noFeeLusdDaiLBPAddress, // pool address
    addresses.oneConstantOracle, // reportedOracle
    addresses.oneConstantOracle, // otherOracle
    false, // feiIsReportedIn
    false // feiIsOther
  );

  await lusdToDaiLensDai.deployTransaction.wait();

  logging && console.log('BPTLens for DAI in swapper pool: ', lusdToDaiLensDai.address);

  const lusdToDaiLensLusd = await BPTLensFactory.deploy(
    addresses.lusd, // token reported in
    noFeeLusdDaiLBPAddress, // pool address
    addresses.oneConstantOracle, // reportedOracle
    addresses.oneConstantOracle, // otherOracle
    false, // feiIsReportedIn
    false // feiIsOther
  );

  await lusdToDaiLensLusd.deployTransaction.wait();

  logging && console.log('BPTLens for LUSD in swapper pool: ', lusdToDaiLensLusd.address);

  return {
    lusdToDaiLensDai,
    lusdToDaiLensLusd,
    lusdToDaiLBPSwapper
  } as NamedContracts;
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.lusdToDaiLBPSwapper.tokenSpent()).to.be.equal(addresses.lusd);
  expect(await contracts.lusdToDaiLBPSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await contracts.lusdToDaiLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.compoundDaiPCVDeposit);
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.lusd);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.dai);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const signer = await getImpersonatedSigner('0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'); // guardian
  await forceEth('0xB8f482539F2d3Ae2C9ea6076894df36D1f632775');

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  console.log('poolTokens.balances[0]', poolTokens.balances[0] / 1e18);
  console.log('poolTokens.balances[1]', poolTokens.balances[1] / 1e18);

  console.log('BEFORE lusdToDaiLensDai.balance()', (await contracts.lusdToDaiLensDai.balance()) / 1e18);
  console.log('BEFORE lusdToDaiLensLusd.balance()', (await contracts.lusdToDaiLensLusd.balance()) / 1e18);
  console.log(
    'BEFORE swapper LUSD balance',
    (await contracts.lusd.balanceOf(contracts.lusdToDaiLBPSwapper.address)) / 1e18
  );
  console.log('Withdraw 10M LUSD to the swapper with PCVGuardian');
  await contracts.pcvGuardian.connect(signer).withdrawToSafeAddress(
    contracts.bammDeposit.address, // address pcvDeposit,
    contracts.lusdToDaiLBPSwapper.address, // address safeAddress,
    '10000000000000000000000000', // uint256 amount,
    false, // bool pauseAfter,
    false // bool depositAfter
  );
  console.log(
    'AFTER swapper LUSD balance',
    (await contracts.lusd.balanceOf(contracts.lusdToDaiLBPSwapper.address)) / 1e18
  );
  await time.increase(3 * 24 * 3600);
  console.log('guardian can trigger a new swap');
  // if this error message shows, it means the balancer pool contract has been
  // called, so we passed the access control checks on the Fei contract above
  expectRevert(contracts.lusdToDaiLBPSwapper.connect(signer).swap(), 'Dai/insufficient-balance');
};

export { deploy, setup, teardown, validate };
