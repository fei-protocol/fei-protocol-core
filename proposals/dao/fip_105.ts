import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { TransactionResponse } from '@ethersproject/providers';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time } from '@test/helpers';

const toBN = ethers.BigNumber.from;

/*

DAO Proposal #105

1. Deploy Fei Skimmer and grant it PCV_CONTROLLER
2. Deploy Balancer LBP and initialise auction of DPI for DAI
3. Fix NopeDAO voting period
4. Transfer CREAM to TribalCouncil multisig, where it will then be sold to ETH
*/

// LBP Swapper config
const LBP_FREQUENCY = 86400 * 14; // 2 weeks in seconds
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(10_000); // 10k
let poolId; // auction pool id

const daiSeedAmount = toBN('187947000000000000000000');
const dpiSeedAmount = toBN('37888449801955370645659');

const fipNumber = '105';
const skimThreshold = ethers.constants.WeiPerEther.mul(20_000_000);

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  /////////  1. Deploy a Fei Skimmer for the DAI PSM
  const daiPSMFeiSkimmerFactory = await ethers.getContractFactory('FeiSkimmer');
  const daiFixedPricePSMFeiSkimmer = await daiPSMFeiSkimmerFactory.deploy(
    addresses.core,
    addresses.daiFixedPricePSM,
    skimThreshold
  );
  await daiFixedPricePSMFeiSkimmer.deployed();
  logging && console.log('DAI PSM Fei Skimmer deployed at', daiFixedPricePSMFeiSkimmer.address);

  ///////////  2. Deploy the Balancer LBP swapper
  // // Amounts:
  // DPI: 37888449801955370645659 (95%), 37k DPI, $3,758,957.86
  // DAI: 187947000000000000000000 (5%), 187k DAI, $187,947.89
  const BalancerLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');

  // Oracle reports DPI price in terms of USD, so should not be inverted
  // Specifically reports: 101258471470000000000, which is $101. As expected
  const dpiToDaiSwapper = await BalancerLBPSwapperFactory.deploy(
    addresses.core,
    {
      _oracle: addresses.chainlinkDpiUsdOracleWrapper,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    '50000000000000000', // small weight 5%
    '950000000000000000', // large weight 95%
    addresses.dpi,
    addresses.dai,
    addresses.compoundDaiPCVDeposit, // send DAI to Compound DAI deposit, where it can then be dripped to PSM
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
    [ethers.constants.WeiPerEther.mul(95).div(100), ethers.constants.WeiPerEther.mul(5).div(100)], // initial weights 5%/95%
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    dpiToDaiSwapper.address, // pool owner = fei protocol swapper
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const noFeeDpiDaiLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;
  poolId = rawLogs[1].topics[1];

  logging && console.log('LBP Pool deployed to: ', noFeeDpiDaiLBPAddress);
  logging && console.log('LBP Pool Id: ', poolId);

  // 3. Initialise the LBP swapper with the pool address
  const tx2 = await dpiToDaiSwapper.init(noFeeDpiDaiLBPAddress);
  await tx2.wait();

  // 4. Deploy a lens to report the swapper value
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

  logging && console.log('BPTLens for DAI in swapper pool: ', dpiToDaiLensDai.address);

  const dpiToDaiLensDpi = await BPTLensFactory.deploy(
    addresses.dpi, // token reported in
    noFeeDpiDaiLBPAddress, // pool address
    addresses.chainlinkDpiUsdOracleWrapper, // reportedOracle - DPI
    addresses.chainlinkDaiUsdOracleWrapper, // otherOracle - DAI
    false, // feiIsReportedIn
    false // feiIsOther
  );
  await dpiToDaiLensDpi.deployTransaction.wait();

  logging && console.log('BPTLens for DPI in swapper pool: ', dpiToDaiLensDpi.address);
  return {
    daiFixedPricePSMFeiSkimmer,
    dpiToDaiSwapper,
    dpiToDaiLensDai,
    dpiToDaiLensDpi
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  poolId = '0xd10386804959a121a8a487e49f45aa9f5a2eb2a00002000000000000000001f1';
  // overwrite chainlink ETH/USD oracle
  const dpiToDaiLBPSwapper = contracts.dpiToDaiLBPSwapper;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '250000000000', '8');

  // invariant checks
  expect(await dpiToDaiLBPSwapper.tokenSpent()).to.be.equal(addresses.dpi);
  expect(await dpiToDaiLBPSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await dpiToDaiLBPSwapper.tokenReceivingAddress()).to.be.equal(addresses.compoundDaiPCVDeposit);

  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  expect(poolTokens.tokens[0]).to.be.equal(addresses.dpi);
  expect(poolTokens.tokens[1]).to.be.equal(addresses.dai);

  // LBP swapper should be empty
  expect(poolTokens.balances[0]).to.be.equal('0');
  expect(poolTokens.balances[1]).to.be.equal('0');

  // Lenses should report 0 because LBP is empty
  expect(await contracts.dpiToDaiLensDai.balance()).to.be.equal('0');
  expect(await contracts.dpiToDaiLensDpi.balance()).to.be.equal('0');

  // Swapper should hold no tokens
  expect(await contracts.dpi.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal('0');

  console.log('Starting DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  await forceEth(addresses.tribalCouncilTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  poolId = '0xd10386804959a121a8a487e49f45aa9f5a2eb2a00002000000000000000001f1';
  ////////////    1. DAI FEI SKIMMER   //////////////
  const daiFixedPricePSMFeiSkimmer = contracts.daiFixedPricePSMFeiSkimmer;
  const dpiToDaiLBPSwapper = contracts.dpiToDaiLBPSwapper;
  const core = contracts.core;

  expect(await daiFixedPricePSMFeiSkimmer.threshold()).to.be.equal(skimThreshold);
  expect(await daiFixedPricePSMFeiSkimmer.source()).to.be.equal(addresses.daiFixedPricePSM);
  expect(await core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), daiFixedPricePSMFeiSkimmer.address)).to.be.true;

  // Validate skimmer contract admin role is set to PCV_MINOR_PARAM_ROLE
  expect(await daiFixedPricePSMFeiSkimmer.CONTRACT_ADMIN_ROLE()).to.be.equal(ethers.utils.id('PCV_MINOR_PARAM_ROLE'));

  /////////////  2.    DPI LBP  ////////////////
  expect(await dpiToDaiLBPSwapper.doInvert()).to.be.equal(true);

  // By this point, the DAO has moved funds to the LBP swapper and the auction should be active
  console.log('Final DAI PSM dai balance [M]', (await contracts.compoundDaiPCVDeposit.balance()) / 1e24);

  expect(await contracts.dpi.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal(dpiSeedAmount);
  expect(await contracts.dai.balanceOf(dpiToDaiLBPSwapper.address)).to.be.equal(daiSeedAmount);

  await time.increase(await dpiToDaiLBPSwapper.remainingTime());
  expect(await dpiToDaiLBPSwapper.isTimeEnded()).to.be.true;

  // Validate SWAP_ADMIN_ROLE is under ROLE_ADMIN and that TribalCouncilTimelock has the role
  expect(await core.hasRole(ethers.utils.id('SWAP_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.true;
  expect(await core.getRoleAdmin(ethers.utils.id('SWAP_ADMIN_ROLE'))).to.be.equal(ethers.utils.id('ROLE_ADMIN'));

  const signer = await getImpersonatedSigner(addresses.tribalCouncilTimelock);
  await dpiToDaiLBPSwapper.connect(signer).swap();
  expect(await dpiToDaiLBPSwapper.isTimeEnded()).to.be.false;

  ////////  3. Nope DAO Voting Period fix  /////////////
  expect(await contracts.nopeDAO.votingPeriod()).to.be.equal(26585);

  /////// 4. CREAM transferred to TribalCouncil multisig ////////
  const creamAmount = '31780370000000000000000';
  expect(await contracts.cream.balanceOf(addresses.tribalCouncilSafe)).to.be.equal(toBN(creamAmount));

  ///////  5. Fund TribalCouncil with 10 Eth //////////
  const ethersSigner = (await ethers.getSigners())[0];
  expect(await ethersSigner.provider.getBalance(addresses.tribalCouncilSafe)).to.be.equal(
    ethers.utils.parseEther('10')
  );
};

export { deploy, setup, teardown, validate };
