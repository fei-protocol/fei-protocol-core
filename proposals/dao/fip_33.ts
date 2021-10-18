import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox } from '@test/helpers';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
});

// Constants
// CR oracle wrapper
const CR_KEEPER_INCENTIVE = ethers.constants.WeiPerEther.mul(1000); // 1000 FEI

// CR oracle guardian
const CR_GUARDIAN_FREQUENCY = 12 * 60 * 60; // 12 hours
const CR_GUARDIAN_DEVIATION_BPS = '500'; // 5%

// LBP swapper
const LBP_FREQUENCY = '604800'; // weekly
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(100_000); // 100k FEI

// PCV Equity Minter
const PCV_EQUITY_MINTER_INCENTIVE = ethers.constants.WeiPerEther.mul(1000); // 1000 FEI
const PCV_EQUITY_MINTER_FREQUENCY = '604800'; // weekly
const PCV_EQUITY_MINTER_APR_BPS = '1000'; // 10%

const TRIBE_BUYBACK_AMOUNT = ethers.constants.WeiPerEther.mul(50_000); // 50k TRIBE

/*

TRIBE Buybacks

DEPLOY ACTIONS:

1. Deploy CR Oracle Keeper
2. Deploy TRIBE/ETH Oracle
3. Deploy TRIBE/USD Oracle
4. Deploy TRIBE LBP Swapper
5. Create TRIBE LBP pool
6. Init TRIBE LBP Swapper
7. Deploy PCV Equity Minter
8. Deploy CR Oracle Guardian

DAO ACTIONS:
1. Make PCV Equity Minter a minter
2. Make CR Oracle Keeper a minter
3. Seed LBP Swapper with TRIBE
4. Create ORACLE_ADMIN role
5. Set ORACLE_ADMIN role to admin for CR Oracle
6. Set ORACLE_ADMIN role to admin for CR Oracle Wrapper
7. Grant Oracle Admin role to Collateralization Oracle Guardian
8. Create SWAP_ADMIN_ROLE
9. Grant PCVEquityMinter swap admin
10. ORACLE admin to OA
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiEthPair,
    weth,
    chainlinkEthUsdOracleWrapper,
    compositeOracle,
    balancerLBPoolFactory,
    collateralizationOracleWrapper,
    chainlinkTribeEthOracle
  } = addresses;

  if (!core || !feiEthPair || !weth || !chainlinkEthUsdOracleWrapper || !compositeOracle) {
    console.log(`core: ${core}`);
    console.log(`feiEtiPair: ${feiEthPair}`);
    console.log(`weth: ${weth}`);
    console.log(`chainlinkEthUsdOracleWrapper: ${chainlinkEthUsdOracleWrapper}`);
    console.log(`compositeOracle: ${compositeOracle}`);

    throw new Error('An environment variable contract address is not set');
  }

  // 1.
  const collateralizationOracleKeeperFactory = await ethers.getContractFactory('CollateralizationOracleKeeper');
  const collateralizationOracleKeeper = await collateralizationOracleKeeperFactory.deploy(
    core,
    CR_KEEPER_INCENTIVE,
    collateralizationOracleWrapper
  );

  logging && console.log('Collateralization Oracle Keeper: ', collateralizationOracleKeeper.address);

  // 2.
  const chainlinkTribeEthOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkTribeEthOracleWrapper = await chainlinkTribeEthOracleWrapperFactory.deploy(
    core,
    chainlinkTribeEthOracle
  );

  logging && console.log('TRIBE/ETH Oracle Wrapper deployed to: ', chainlinkTribeEthOracleWrapper.address);

  // 3.
  const chainlinkTribeUsdCompositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const chainlinkTribeUsdCompositeOracle = await chainlinkTribeUsdCompositeOracleFactory.deploy(
    core,
    chainlinkTribeEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapper
  );

  logging && console.log('TRIBE/USD Composite Oracle deployed to: ', chainlinkTribeUsdCompositeOracle.address);

  // 4.
  const feiTribeLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const feiTribeLBPSwapper = await feiTribeLBPSwapperFactory.deploy(
    core,
    {
      _oracle: chainlinkTribeUsdCompositeOracle.address,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    fei,
    tribe,
    core, // send TRIBE back to treasury
    MIN_LBP_SIZE
  );

  logging && console.log('FEI->TRIBE LBP Swapper: ', feiTribeLBPSwapper.address);

  // 5.
  const lbpFactory = await ethers.getContractAt('ILiquidityBootstrappingPoolFactory', balancerLBPoolFactory);

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [fei, tribe],
    [ethers.constants.WeiPerEther.mul(99).div(100), ethers.constants.WeiPerEther.div(100)],
    ethers.constants.WeiPerEther.mul(30).div(10_000),
    feiTribeLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const feiTribeLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', feiTribeLBPAddress);

  // 6.
  await feiTribeLBPSwapper.init(feiTribeLBPAddress);

  // 7.
  const pcvEquityMinterFactory = await ethers.getContractFactory('PCVEquityMinter');
  const pcvEquityMinter = await pcvEquityMinterFactory.deploy(
    core,
    feiTribeLBPSwapper.address,
    PCV_EQUITY_MINTER_INCENTIVE,
    PCV_EQUITY_MINTER_FREQUENCY,
    collateralizationOracleWrapper,
    PCV_EQUITY_MINTER_APR_BPS
  );

  logging && console.log('PCV Equity Minter: ', pcvEquityMinter.address);

  // 8.
  const collateralizationOracleGuardianFactory = await ethers.getContractFactory('CollateralizationOracleGuardian');
  const collateralizationOracleGuardian = await collateralizationOracleGuardianFactory.deploy(
    core,
    collateralizationOracleWrapper,
    CR_GUARDIAN_FREQUENCY,
    CR_GUARDIAN_DEVIATION_BPS
  );

  logging && console.log('Collateralization Oracle Guardian: ', collateralizationOracleGuardian.address);

  return {
    collateralizationOracleKeeper,
    collateralizationOracleGuardian,
    chainlinkTribeEthOracleWrapper,
    chainlinkTribeUsdCompositeOracle,
    feiTribeLBPSwapper,
    pcvEquityMinter
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-33');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-33');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const {
    collateralizationOracleGuardian,
    collateralizationOracleKeeper,
    collateralizationOracleWrapper,
    collateralizationOracle,
    core,
    feiTribeLBPSwapper,
    pcvEquityMinter,
    tribe
  } = contracts;

  const { multisig, optimisticTimelock } = addresses;

  const oracleAdminRole = ethers.utils.id('ORACLE_ADMIN_ROLE');
  expect(await collateralizationOracle.CONTRACT_ADMIN_ROLE()).to.be.equal(oracleAdminRole);
  expect(await collateralizationOracleWrapper.CONTRACT_ADMIN_ROLE()).to.be.equal(oracleAdminRole);

  expect(await collateralizationOracle.isContractAdmin(multisig)).to.be.false;
  expect(await collateralizationOracleWrapper.isContractAdmin(collateralizationOracleGuardian.address)).to.be.true;
  expect(await collateralizationOracleWrapper.isContractAdmin(optimisticTimelock)).to.be.true;

  expect(await core.isMinter(collateralizationOracleKeeper.address)).to.be.true;
  expect(await core.isMinter(pcvEquityMinter.address)).to.be.true;

  expect(await tribe.balanceOf(feiTribeLBPSwapper.address)).to.be.bignumber.equal(TRIBE_BUYBACK_AMOUNT);

  const price = (await feiTribeLBPSwapper.readOracle())[0];
  const response = await feiTribeLBPSwapper.getTokensIn(1000000);
  const amounts = response[1];
  expect(amounts[0]).to.be.bignumber.equal(ethers.BigNumber.from(1000000));
  // TRIBE/FEI price * FEI amount * 1% ~= amount
  expectApprox(price.mul(1000000).div(ethers.constants.WeiPerEther).div(100), amounts[1]);
};
