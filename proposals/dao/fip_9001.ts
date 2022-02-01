import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

DAO Proposal #9001

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '9001'; // Change me!
const DELEGATE_AAVE = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';
const DELEGATE_ANGLE = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';
const DELEGATE_COMP = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';
const DELEGATE_CVX = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  if (!addresses.core) {
    throw new Error('An environment variable contract address is not set');
  }

  // Create Chainlink Oracle Wrapper for COMP/USD feed
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkCompUsdOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    '0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5' // COMP/USD Chainlink feed
  );
  await chainlinkCompUsdOracleWrapper.deployTransaction.wait();
  logging && console.log('Chainlink COMP/USD Oracle Wrapper:', chainlinkCompUsdOracleWrapper.address);
  const chainlinkAaveUsdOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    '0x547a514d5e3769680Ce22B2361c10Ea13619e8a9' // AAVE/USD Chainlink feed
  );
  await chainlinkAaveUsdOracleWrapper.deployTransaction.wait();
  logging && console.log('Chainlink AAVE/USD Oracle Wrapper:', chainlinkAaveUsdOracleWrapper.address);
  const chainlinkCvxUsdOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    '0xd962fC30A72A84cE50161031391756Bf2876Af5D' // CVX/USD Chainlink feed
  );
  await chainlinkCvxUsdOracleWrapper.deployTransaction.wait();
  logging && console.log('Chainlink CVX/USD Oracle Wrapper:', chainlinkCvxUsdOracleWrapper.address);

  const moverFactory = await ethers.getContractFactory('ERC20PermissionlessMover');
  const permissionlessPcvMover = await moverFactory.deploy(addresses.core);
  await permissionlessPcvMover.deployTransaction.wait();
  logging && console.log('permissionlessPcvMover: ', permissionlessPcvMover.address);

  const aaveDelegatorFactory = await ethers.getContractFactory('AaveDelegatorPCVDeposit');
  const aaveDelegatorPCVDeposit = await aaveDelegatorFactory.deploy(addresses.core, DELEGATE_AAVE);
  await aaveDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('aaveDelegatorPCVDeposit: ', aaveDelegatorPCVDeposit.address);

  const angleDelegatorFactory = await ethers.getContractFactory('AngleDelegatorPCVDeposit');
  const angleDelegatorPCVDeposit = await angleDelegatorFactory.deploy(addresses.core, DELEGATE_ANGLE);
  await angleDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('angleDelegatorPCVDeposit: ', angleDelegatorPCVDeposit.address);

  const delegatorFactory = await ethers.getContractFactory('DelegatorPCVDeposit');
  const compDelegatorPCVDeposit = await delegatorFactory.deploy(addresses.core, addresses.comp, DELEGATE_COMP);
  await compDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('compDelegatorPCVDeposit: ', compDelegatorPCVDeposit.address);

  const convexDelegatorFactory = await ethers.getContractFactory('ConvexDelegatorPCVDeposit');
  const convexDelegatorPCVDeposit = await convexDelegatorFactory.deploy(addresses.core, DELEGATE_CVX);
  await convexDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('convexDelegatorPCVDeposit: ', convexDelegatorPCVDeposit.address);

  // Create a new agEUR-FEI Uniswap PCVDeposit that does not stake on the old staking rewards contract
  const angleUniswapPCVDepositFactory = await ethers.getContractFactory('AngleUniswapPCVDeposit');
  const agEurAngleUniswapPCVDepositNoStaking = await angleUniswapPCVDepositFactory.deploy(
    addresses.core,
    addresses.angleAgEurFeiPool, // Uniswap-v2 agEUR/FEI pool
    addresses.uniswapRouter, // UNiswap-v2 router
    addresses.chainlinkEurUsdOracleWrapper,
    ethers.constants.AddressZero,
    '100', // max. 1% slippage
    addresses.angleStableMaster,
    addresses.anglePoolManager
  );
  await agEurAngleUniswapPCVDepositNoStaking.deployTransaction.wait();
  logging && console.log('Angle agEUR/FEI Uniswap PCVDeposit:', agEurAngleUniswapPCVDepositNoStaking.address);

  // Create a TOKE Tokemak PCVDeposit that can also vote on reactor weights
  const tokeTokemakFactory = await ethers.getContractFactory('TokeTokemakPCVDeposit');
  const tokeTokemakPCVDepositVoting = await tokeTokemakFactory.deploy(
    addresses.core,
    '0xa760e26aA76747020171fCF8BdA108dFdE8Eb930', // TOKE pool
    '0x79dD22579112d8a5F7347c5ED7E609e60da713C5' // TOKE rewards
  );
  await tokeTokemakPCVDepositVoting.deployTransaction.wait();
  logging && console.log('tokeTokemakPCVDepositVoting: ', tokeTokemakPCVDepositVoting.address);

  return {
    chainlinkCompUsdOracleWrapper,
    chainlinkAaveUsdOracleWrapper,
    chainlinkCvxUsdOracleWrapper,
    aaveDelegatorPCVDeposit,
    angleDelegatorPCVDeposit,
    compDelegatorPCVDeposit,
    convexDelegatorPCVDeposit,
    permissionlessPcvMover,
    agEurAngleUniswapPCVDepositNoStaking,
    tokeTokemakPCVDepositVoting
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Whitelist our contract for vote-locking on Angle's governance
  logging && console.log('Whitelist angleDelegatorPCVDeposit as a smartwallet on Angle governance...');
  const ANGLE_MULTISIG_ADDRESS = '0xdC4e6DFe07EFCa50a197DF15D9200883eF4Eb1c8';
  await forceEth(ANGLE_MULTISIG_ADDRESS);
  const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
  const abi = ['function approveWallet(address _wallet)'];
  const smartWalletCheckerInterface = new ethers.utils.Interface(abi);
  const encodeWhitelistingCall = smartWalletCheckerInterface.encodeFunctionData('approveWallet', [
    contracts.angleDelegatorPCVDeposit.address
  ]);
  await (
    await angleMultisigSigner.sendTransaction({
      data: encodeWhitelistingCall,
      to: '0xAa241Ccd398feC742f463c534a610529dCC5888E' // SmartWalletChecker
    })
  ).wait();
  logging && console.log('Whitelisted angleDelegatorPCVDeposit as a smartwallet on Angle governance.');
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
  await forceEth(contracts.feiDAOTimelock.address);

  // Validate delegatees
  expect(await contracts.aaveDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_AAVE);
  expect(await contracts.angleDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_ANGLE);
  expect(await contracts.compDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_COMP);
  expect(await contracts.convexDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_CVX);

  console.log('========== Move all our gov tokens to delegators ==========');
  await contracts.permissionlessPcvMover.move(contracts.crv.address, contracts.d3poolConvexPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.cvx.address, contracts.d3poolConvexPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.comp.address, contracts.compoundEthPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.comp.address, contracts.compoundDaiPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.stkaave.address, contracts.aaveEthPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.stkaave.address, contracts.aaveRaiPCVDeposit.address);
  await contracts.permissionlessPcvMover.move(contracts.toke.address, contracts.ethTokemakPCVDeposit.address);
  console.log(
    'Aave delegator AAVE balance',
    (await contracts.aave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Aave delegator stkAAVE balance',
    (await contracts.stkaave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Angle delegator ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Compound delegator COMP balance',
    (await contracts.comp.balanceOf(contracts.compDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Convex delegator CVX balance',
    (await contracts.cvx.balanceOf(contracts.convexDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Convex delegator CRV balance',
    (await contracts.crv.balanceOf(contracts.convexDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'TOKE deposit TOKE balance',
    (await contracts.toke.balanceOf(contracts.tokeTokemakPCVDepositVoting.address)) / 1e18
  );

  // Aave game
  console.log('========== Aave game ==========');
  console.log('claimRewards()');
  await contracts.aaveDelegatorPCVDeposit.claimRewards();
  console.log(
    'Aave delegator AAVE balance',
    (await contracts.aave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Aave delegator stkAAVE balance',
    (await contracts.stkaave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('start stkAAVE -> AAVE cooldown [as governor]');
  await contracts.aaveDelegatorPCVDeposit.connect(daoSigner).cooldown();
  console.log('cooldown started. fast-forwarding 10 days');
  await time.increase(10 * 24 * 3600);
  console.log('unstaking stkAAVE to AAVE');
  await contracts.aaveDelegatorPCVDeposit.redeem();
  console.log(
    'Aave delegator AAVE balance',
    (await contracts.aave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Aave delegator stkAAVE balance',
    (await contracts.stkaave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('stake AAVE to stkAAVE');
  await contracts.aaveDelegatorPCVDeposit.stake();
  console.log(
    'Aave delegator AAVE balance',
    (await contracts.aave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'Aave delegator stkAAVE balance',
    (await contracts.stkaave.balanceOf(contracts.aaveDelegatorPCVDeposit.address)) / 1e18
  );

  // Comp delegation check
  console.log('========== Compound game ==========');
  console.log('comp.getCurrentVotes(DELEGATE_COMP)', (await contracts.comp.getCurrentVotes(DELEGATE_COMP)) / 1e18);

  // TOKE deposit and vote
  console.log('========== Tokemak game ==========');
  console.log('balance()', (await contracts.tokeTokemakPCVDepositVoting.balance()) / 1e18);
  console.log('deposit()...');
  await contracts.tokeTokemakPCVDepositVoting.deposit();
  console.log('balance()', (await contracts.tokeTokemakPCVDepositVoting.balance()) / 1e18);
  console.log(
    'tokeTokemakPCVDepositVoting TOKE balance',
    (await contracts.toke.balanceOf(contracts.tokeTokemakPCVDepositVoting.address)) / 1e18
  );
  console.log(
    'tokeTokemakPCVDepositVoting tTOKE balance',
    (await contracts.tToke.balanceOf(contracts.tokeTokemakPCVDepositVoting.address)) / 1e18
  );
  console.log('vote...');
  await contracts.tokeTokemakPCVDepositVoting.vote(
    '0x00000000000000000000000000000000000000000000000000000000000000af', // bytes32 voteSessionKey
    '1' // uint256 nonce
  );
  console.log('voted :)');

  // Angle game
  console.log('========== Angle game ==========');
  console.log('Vote-locking ANGLE...');
  await contracts.angleDelegatorPCVDeposit.lock();
  console.log('Vote-locked ANGLE.');
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('Vote 100% for Uni-v2 FEI/agEUR pool');
  await contracts.angleDelegatorPCVDeposit.voteForGaugeWeight(
    contracts.angleGaugeController.address, // gauge controller
    contracts.angleGaugeUniswapV2FeiAgEur.address, // gauge address
    '10000' // 100%
  );
  console.log('ff 1 year');
  await time.increase(365 * 24 * 3600);
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('claim gauge rewards');
  await contracts.angleDelegatorPCVDeposit.claimGaugeRewards(
    contracts.angleGaugeUniswapV2FeiAgEur.address // gauge address
  );
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('prolong locking period');
  await contracts.angleDelegatorPCVDeposit.lock();
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('ff 4 years');
  await time.increase(4 * 365 * 24 * 3600);
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('exitLock()');
  await contracts.angleDelegatorPCVDeposit.exitLock();
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log('lock()');
  await contracts.angleDelegatorPCVDeposit.lock();
  console.log(
    'angleDelegatorPCVDeposit ANGLE balance',
    (await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );
  console.log(
    'angleDelegatorPCVDeposit veANGLE balance',
    (await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)) / 1e18
  );

  // Convex game
  console.log('========== Convex game ==========');
  console.log('todo');

  // TODO: additional checks
  console.log('done');
  expect(false).to.be.true;
};

export { deploy, setup, teardown, validate };
