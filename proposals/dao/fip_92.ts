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
  const veBalDelegatorFactory = await ethers.getContractFactory('VeBalDelegatorPCVDeposit');
  const veBalDelegatorPCVDeposit = await veBalDelegatorFactory.deploy(addresses.core, DELEGATE_BAL);
  await veBalDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('veBalDelegatorPCVDeposit: ', veBalDelegatorPCVDeposit.address);

  const gaugeLensFactory = await ethers.getContractFactory('CurveGaugeLens');
  const gaugeLensBpt30Fei70WethGauge = await gaugeLensFactory.deploy(
    addresses.balancerGaugeBpt30Fei70Weth,
    veBalDelegatorPCVDeposit.address
  );
  await gaugeLensBpt30Fei70WethGauge.deployTransaction.wait();
  logging && console.log('gaugeLensBpt30Fei70WethGauge:', gaugeLensBpt30Fei70WethGauge.address);

  // TODO:
  // need 3 lenses to add to the CR:
  // - 1 lens that report (FEI, WETH) in the gaugeLensBpt30Fei70WethGauge
  // - 1 lens that report (BAL) in the veBalDelegatorPCVDeposit
  // - 1 lens that report (WETH) in the veBalDelegatorPCVDeposit

  /*const uniswapLensFactory = await ethers.getContractFactory('UniswapLens');
  const uniswapLensAgEurUniswapGauge = await uniswapLensFactory.deploy(
    gaugeLensAgEurUniswapGauge.address, // deposit to read from
    addresses.core, // core
    addresses.chainlinkEurUsdOracleWrapper, // oracle
    ethers.constants.AddressZero // no backup oracle
  );
  await uniswapLensAgEurUniswapGauge.deployTransaction.wait();
  logging && console.log('uniswapLensAgEurUniswapGauge:', uniswapLensAgEurUniswapGauge.address);*/

  return {
    veBalDelegatorPCVDeposit,
    gaugeLensBpt30Fei70WethGauge
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
  expect(await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address)).to.be.at.least(e18(109_000));

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

  console.log('~~ ok');

  // Resistant balance & fei properly read
  /*const resistantBalanceAndFei = await contracts.uniswapLensAgEurUniswapGauge.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.at.least(e18(8_000_000)); // >8M agEUR
  expect(resistantBalanceAndFei[1]).to.be.at.least(e18(9_500_000)); // >9.5M FEI*/
};

export { deploy, setup, teardown, validate };
