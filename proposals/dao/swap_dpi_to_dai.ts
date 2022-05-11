import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import { TransactionResponse } from '@ethersproject/providers';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

Swap DPI for DAI

*/

const fipNumber = 'swap_dpi';

// LBP Swapper config
const LBP_FREQUENCY = '86400'; // 24 hours
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(1_000_000); // 1M
let poolId; // auction pool id

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // DPI: 3,459,532
  // DAI: 147,712

  // Total: 3,607,244
  // 1. Deploy the Balancer LBP swapper
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const dpiToDaiSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkDpiUsdOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '40000000000000000', // small weight 4%
    '960000000000000000', // large weight 96%
    addresses.dpi,
    addresses.dai,
    addresses.daiFixedPricePSM, // send DAI to DAI PSM
    MIN_LBP_SIZE // minimum size of a pool which the swapper is used against
  );

  await dpiToDaiSwapper.deployed();
  logging && console.log('DPI to DAI swapper deployed to: ', dpiToDaiSwapper.address);

  // 2. Create a liquidity bootstrapping pool between DPI and DAI
  const lbpFactory = await ethers.getContractAt(
    'ILiquidityBootstrappingPoolFactory',
    addresses.balancerLBPoolFactoryNoFee
  );

  const tx: TransactionResponse = await lbpFactory.create(
    'DPI->DAI Auction Pool', // pool name
    'apDPI-DAI', // lbp token symbol
    [addresses.dpi, addresses.dai], // pool contains [DPI, DAI]
    [ethers.constants.WeiPerEther.mul(90).div(100), ethers.constants.WeiPerEther.mul(10).div(100)], // initial weights 10%/90%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    dpiToDaiSwapper.address, // pool owner = fei protocol swapper
    true
  );

  // Where does the initial liquidity come from?

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeDpiDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeDpiDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await dpiToDaiSwapper.init(noFeeDpiDaiLBPAddress);
  await tx2.wait();

  // 4. Deploy a lens to report the swapper value - possibly don't need these. Small position
  const BPTLensFactory = await ethers.getContractFactory('BPTLens');
  const dpiToDaiLensDai = await BPTLensFactory.deploy(
    addresses.dai, // token reported in
    noFeeDpiDaiLBPAddress, // pool address
    addresses.chainlinkDaiUsdOracleWrapper, // reportedOracle - DAI
    addresses.chainlinkDpiUsdOracleWrapper, // otherOracle - DPI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await dpiToDaiLensDai.deployTransaction.wait();

  logging && console.log('BPTLens for DPI in swapper pool: ', dpiToDaiLensDai.address);

  const dpiToDaiLensDpi = await BPTLensFactory.deploy(
    addresses.dpi, // token reported in
    noFeeDpiDaiLBPAddress, // pool address
    addresses.chainlinkDpiUsdOracleWrapper, // reportedOracle - DPI
    addresses.chainlinkDaiUsdOracleWrapper, // otherOracle - DAI
    false, // feiIsReportedIn
    false // feiIsOther
  );

  logging && console.log('BPTLens for DAI in swapper pool: ', dpiToDaiLensDpi.address);

  return {
    dpiToDaiSwapper,
    dpiToDaiLensDai,
    dpiToDaiLensDpi
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // overwrite chainlink ETH/USD oracle
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '250000000000', '8');

  // invariant checks
  expect(await contracts.dpiToDaiSwapper.tokenSpent()).to.be.equal(addresses.dpi);
  expect(await contracts.dpiToDaiSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await contracts.dpiToDaiSwapper.tokenReceivingAddress()).to.be.equal(addresses.daiFixedPricePSM);
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.dpi);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.dai);

  console.log('Starting DAI PSM dai balance [M]', (await contracts.daiFixedPricePSM.balance()) / 1e24);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('Final DAI PSM dai balance [M]', (await contracts.daiFixedPricePSM.balance()) / 1e24);

  // LBP swapper should be empty
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.dpiToDaiLensDai.balance()).to.be.equal('0');
  expect(await contracts.dpiToDaiLensDpi.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.dpi.balanceOf(contracts.dpiToDaiSwapper.address)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(contracts.dpiToDaiSwapper.address)).to.be.equal('0');

  // End-to-end test : use the guardian to start a LUSD->DAI auction
  const signer = await getImpersonatedSigner(addresses.multisig); // guardian

  // Want to transfer all DPI from the dpiDepositWrapper and rariPool19DpiPCVDepositWrapper
  // dpiDepositWrapper = $3.2m
  // rariPool19DpiPCVDepositWrapper = $0.2m

  // Move 3.4M DPI to the Swapper
  const dpiDepositWrapperAmount = await contracts.dpiDepositWrapper.balance();
  logging && console.log('DPI deposit amount: ', dpiDepositWrapperAmount.toString());
  await contracts.pcvGuardianNew.connect(signer).withdrawToSafeAddress(
    contracts.dpiDepositWrapper.address, // address pcvDeposit,
    contracts.dpiToDaiSwapper.address, // address safeAddress,
    dpiDepositWrapperAmount, // uint256 amount - 35,231 DPI
    false, // bool pauseAfter,
    false // bool depositAfter
  );

  const dpiRariDepositAmount = await contracts.rariPool19DpiPCVDepositWrapper.balance();
  logging && console.log('Rari DPI amount: ', dpiRariDepositAmount.toString());
  await contracts.pcvGuardianNew.connect(signer).withdrawToSafeAddress(
    contracts.dpiDepositWrapper.address, // address pcvDeposit,
    contracts.dpiToDaiSwapper.address, // address safeAddress,
    dpiRariDepositAmount, // uint256 amount - - 2,657 DPI
    false, // bool pauseAfter,
    false // bool depositAfter
  );

  // Move ~147k DAI to the Swapper
  const compoundDAIDepositAmount = await contracts.compoundDAIDepositWrapper.balance();
  logging && console.log('Compound DAI amount: ', compoundDAIDepositAmount.toString());
  await contracts.pcvGuardianNew.connect(signer).withdrawToSafeAddress(
    contracts.compoundDaiPCVDeposit.address, // address pcvDeposit,
    contracts.dpiToDaiSwapper.address, // address safeAddress,
    compoundDAIDepositAmount, // uint256 amount
    false, // bool pauseAfter,
    false // bool depositAfter
  );
  expect(await contracts.dpi.balanceOf(contracts.dpiToDaiSwapper.address)).to.be.equal(
    ethers.constants.WeiPerEther.mul(dpiDepositWrapperAmount.add(dpiRariDepositAmount))
  );
  expect(await contracts.dai.balanceOf(contracts.dpiToDaiSwapper.address)).to.be.equal(
    ethers.constants.WeiPerEther.mul(compoundDAIDepositAmount)
  );
  //
  await time.increase(await contracts.dpiToDaiSwapper.remainingTime());
  expect(await contracts.dpiToDaiSwapper.isTimeEnded()).to.be.true;
  await contracts.dpiToDaiSwapper.connect(signer).swap();
  expect(await contracts.dpiToDaiSwapper.isTimeEnded()).to.be.false;
};

export { deploy, setup, teardown, validate };
