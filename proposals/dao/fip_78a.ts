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

const fipNumber = '78a';
const DELEGATE_ANGLE = '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const angleDelegatorFactory = await ethers.getContractFactory('AngleDelegatorPCVDeposit');
  const angleDelegatorPCVDeposit = await angleDelegatorFactory.deploy(addresses.core, DELEGATE_ANGLE);
  await angleDelegatorPCVDeposit.deployTransaction.wait();
  logging && console.log('angleDelegatorPCVDeposit: ', angleDelegatorPCVDeposit.address);

  // Create a new agEUR-FEI Uniswap PCVDeposit that does not stake on the old staking rewards contract
  const uniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');
  const agEurUniswapPCVDeposit = await uniswapPCVDepositFactory.deploy(
    addresses.core,
    addresses.angleAgEurFeiPool, // Uniswap-v2 agEUR/FEI pool
    addresses.uniswapRouter, // UNiswap-v2 router
    addresses.chainlinkEurUsdOracleWrapper,
    ethers.constants.AddressZero,
    '75' // max. 0.75% slippage (Chainlink has 0.15% and Angle 0.5%)
  );
  await agEurUniswapPCVDeposit.deployTransaction.wait();
  logging && console.log('New agEUR/FEI Uniswap PCVDeposit:', agEurUniswapPCVDeposit.address);

  const gaugeLensFactory = await ethers.getContractFactory('GaugeLens');
  const gaugeLensAgEurUniswapGauge = await gaugeLensFactory.deploy(
    addresses.angleGaugeUniswapV2FeiAgEur,
    angleDelegatorPCVDeposit.address
  );
  await gaugeLensAgEurUniswapGauge.deployTransaction.wait();
  logging && console.log('gaugeLensAgEurUniswapGauge:', gaugeLensAgEurUniswapGauge.address);

  const uniswapLensFactory = await ethers.getContractFactory('UniswapLens');
  const uniswapLensAgEurUniswapGauge = await uniswapLensFactory.deploy(
    gaugeLensAgEurUniswapGauge.address, // deposit to read from
    addresses.core, // core
    addresses.chainlinkEurUsdOracleWrapper, // oracle
    ethers.constants.AddressZero // no backup oracle
  );
  await uniswapLensAgEurUniswapGauge.deployTransaction.wait();
  logging && console.log('uniswapLensAgEurUniswapGauge:', uniswapLensAgEurUniswapGauge.address);

  return {
    uniswapLensAgEurUniswapGauge,
    gaugeLensAgEurUniswapGauge,
    angleDelegatorPCVDeposit,
    agEurUniswapPCVDeposit
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

  // Validate delegatee
  expect(await contracts.angleDelegatorPCVDeposit.delegate()).to.be.equal(DELEGATE_ANGLE);

  // Check that liquidity was correctly migrated to the gauge
  expect(
    await contracts.angleGaugeUniswapV2FeiAgEur.balanceOf(contracts.angleDelegatorPCVDeposit.address)
  ).to.be.at.least(e18(9_000_000)); // should have the same balance as currently

  // Check that gauge vote is properly set to agEUR/FEI Uniswap-v2 pool
  expect(await contracts.angleGaugeController.vote_user_power(contracts.angleDelegatorPCVDeposit.address)).to.be.equal(
    '10000'
  ); // 100% voting power engaged
  expect(
    await contracts.angleGaugeController.last_user_vote(
      contracts.angleDelegatorPCVDeposit.address,
      contracts.angleGaugeUniswapV2FeiAgEur.address
    )
  ).to.be.at.least(1); // timestamp of last vote > 0

  // All ANGLE converted to veANGLE
  expect(await contracts.angle.balanceOf(contracts.angleDelegatorPCVDeposit.address)).to.be.equal('0');
  expect(await contracts.veAngle.balanceOf(contracts.angleDelegatorPCVDeposit.address)).to.be.at.least(e18(150_000));

  // Resistant balance & fei properly read
  const resistantBalanceAndFei = await contracts.uniswapLensAgEurUniswapGauge.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.at.least(e18(8_000_000)); // >8M agEUR
  expect(resistantBalanceAndFei[1]).to.be.at.least(e18(9_500_000)); // >9.5M FEI
};

export { deploy, setup, teardown, validate };
