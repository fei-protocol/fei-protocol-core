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

const e18 = (x) => ethers.constants.WeiPerEther.mul(x);

const fipNumber = '92';
const DELEGATE_BAL = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy contract that will hold veBAL & stake in gauges
  const veBalDelegatorFactory = await ethers.getContractFactory('VeBalDelegatorPCVDeposit');
  const veBalDelegatorPCVDeposit = await veBalDelegatorFactory.deploy(addresses.core, DELEGATE_BAL);
  await veBalDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('veBalDelegatorPCVDeposit: ', veBalDelegatorPCVDeposit.address);

  // Deploy lens to report the B-30FEI-70WETH staked in gauge
  const gaugeLensFactory = await ethers.getContractFactory('CurveGaugeLens');
  const gaugeLensBpt30Fei70WethGauge = await gaugeLensFactory.deploy(
    addresses.balancerGaugeBpt30Fei70Weth,
    veBalDelegatorPCVDeposit.address
  );
  await gaugeLensBpt30Fei70WethGauge.deployTransaction.wait();
  logging && console.log('gaugeLensBpt30Fei70WethGauge:', gaugeLensBpt30Fei70WethGauge.address);

  // Deploy lens to report B-30FEI-70WETH as WETH and protocol-owned FEI
  const balancerPool2LensFactory = await ethers.getContractFactory('BalancerPool2Lens');
  const balancerLensBpt30Fei70Weth = await balancerPool2LensFactory.deploy(
    gaugeLensBpt30Fei70WethGauge.address, // address _depositAddress
    addresses.wethERC20, // address _token
    '0x90291319f1d4ea3ad4db0dd8fe9e12baf749e845', // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.oneConstantOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    true // bool _feiIsOther
  );
  await balancerLensBpt30Fei70Weth.deployTransaction.wait();
  logging && console.log('balancerLensBpt30Fei70Weth: ', balancerLensBpt30Fei70Weth.address);

  // Deploy lens to report the BAL part of B-80BAL-20WETH vote-locked
  const balancerLensVeBalBal = await balancerPool2LensFactory.deploy(
    veBalDelegatorPCVDeposit.address, // address _depositAddress
    addresses.bal, // address _token
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56', // IWeightedPool _pool
    addresses.balUsdCompositeOracle, // IOracle _reportedOracle
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    false // bool _feiIsOther
  );
  await balancerLensVeBalBal.deployTransaction.wait();
  logging && console.log('balancerLensVeBalBal: ', balancerLensVeBalBal.address);

  // Deploy lens to report the WETH part of B-80BAL-20WETH vote-locked
  const balancerLensVeBalWeth = await balancerPool2LensFactory.deploy(
    veBalDelegatorPCVDeposit.address, // address _depositAddress
    addresses.wethERC20, // address _token
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56', // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.balUsdCompositeOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    false // bool _feiIsOther
  );
  await balancerLensVeBalWeth.deployTransaction.wait();
  logging && console.log('balancerLensVeBalWeth: ', balancerLensVeBalWeth.address);

  return {
    veBalDelegatorPCVDeposit,
    gaugeLensBpt30Fei70WethGauge,
    balancerLensBpt30Fei70Weth,
    balancerLensVeBalBal,
    balancerLensVeBalWeth
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Whitelist our contract for vote-locking on Balancer's governance
  logging && console.log('Whitelist veBalDelegatorPCVDeposit as a smartwallet on Balancer governance...');

  const BALANCER_AUTHORIZER_ADAPTOR = '0x8F42aDBbA1B16EaAE3BB5754915E0D06059aDd75';
  await forceEth(BALANCER_AUTHORIZER_ADAPTOR);
  const balAuthorizerSigner = await getImpersonatedSigner(BALANCER_AUTHORIZER_ADAPTOR);

  // commit a smart wallet checker (the Balancer team will have to deploy a new contract
  // for this purpose. For this local mock, we add the Angle Protocol's smartwallet checker,
  // that is already deployed onchain.
  await contracts.veBal
    .connect(balAuthorizerSigner)
    .commit_smart_wallet_checker('0xAa241Ccd398feC742f463c534a610529dCC5888E');
  await contracts.veBal.connect(balAuthorizerSigner).apply_smart_wallet_checker();

  // add veBalDelegatorPCVDeposit as a smartwallet on the smartwallet checker
  // note: this is using the Angle multisig address, because the Angle smart
  // wallet checker is added on veBAL, on this local fork. The veBAL contract
  // does not currently have a smart wallet checker, so there is no way to
  // whitelist smart contracts. Instead of deploying a fake smart wallet checker,
  // I'm using the Angle one, and I whitelist the veBalDelegatorPCVDeposit on it.
  // When this proposal executes onchain, the Balancer team will have deployed
  // their own smartwallet checker, and will have whitelisted the veBalDelegatorPCVDeposit
  // to vote-lock B-80BAL-20WETH into veBAL.
  const ANGLE_MULTISIG_ADDRESS = '0xdC4e6DFe07EFCa50a197DF15D9200883eF4Eb1c8';
  await forceEth(ANGLE_MULTISIG_ADDRESS);
  const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
  const abi = ['function approveWallet(address _wallet)'];
  const smartWalletCheckerInterface = new ethers.utils.Interface(abi);
  const encodeWhitelistingCall = smartWalletCheckerInterface.encodeFunctionData('approveWallet', [
    contracts.veBalDelegatorPCVDeposit.address
  ]);
  await (
    await angleMultisigSigner.sendTransaction({
      data: encodeWhitelistingCall,
      to: '0xAa241Ccd398feC742f463c534a610529dCC5888E' // SmartWalletChecker
    })
  ).wait();

  logging && console.log('Whitelisted veBalDelegatorPCVDeposit as a smartwallet on Balancer governance.');
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

  // Validate delegatee
  expect(await contracts.veBalDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_BAL);

  // All B-80BAL-20WETH converted to veBAL
  // for max duration (1 B-80BAL-20WETH ~= 1 veBAL)
  expect(await contracts.bpt80Bal20Weth.balanceOf(contracts.veBalDelegatorPCVDeposit.address)).to.be.equal('0');
  expect(await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address)).to.be.at.least(e18(100_000));

  // Check that gauge vote is properly set to 100% for B-30FEI-70WETH
  expect(
    await contracts.balancerGaugeController.vote_user_power(contracts.veBalDelegatorPCVDeposit.address)
  ).to.be.equal('10000'); // 100% voting power engaged
  expect(
    await contracts.balancerGaugeController.last_user_vote(
      contracts.veBalDelegatorPCVDeposit.address,
      contracts.balancerGaugeBpt30Fei70Weth.address
    )
  ).to.be.at.least(1); // timestamp of last vote > 0

  // Should have staked all B-30FEI-70WETH in gauge
  expect(
    await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contracts.veBalDelegatorPCVDeposit.address)
  ).to.be.at.least(e18(252_865));

  // Resistant balance & fei properly reported
  // B-30FEI-70WETH staked in gauge should contain ~14k ETH (~50M$) and ~21M FEI
  expect(await contracts.balancerLensBpt30Fei70Weth.balanceReportedIn()).to.be.equal(addresses.weth);
  const rb1 = await contracts.balancerLensBpt30Fei70Weth.resistantBalanceAndFei();
  expect(rb1[0]).to.be.at.least(e18(13_000));
  expect(rb1[1]).to.be.at.least(e18(18_000_000));
  // B-80BAL-20WETH vote-locked in veBAL should contain ~214k BAL (~3.45M$)
  expect(await contracts.balancerLensVeBalBal.balanceReportedIn()).to.be.equal(addresses.bal);
  const rb2 = await contracts.balancerLensVeBalBal.resistantBalanceAndFei();
  expect(rb2[0]).to.be.at.least(e18(200_000));
  expect(rb2[1]).to.be.equal('0');
  // B-80BAL-20WETH vote-locked in veBAL should contain ~250 ETH (~870k$)
  expect(await contracts.balancerLensVeBalWeth.balanceReportedIn()).to.be.equal(addresses.weth);
  const rb3 = await contracts.balancerLensVeBalWeth.resistantBalanceAndFei();
  expect(rb3[0]).to.be.at.least(e18(230));
  expect(rb3[1]).to.be.equal('0');
};

export { deploy, setup, teardown, validate };
