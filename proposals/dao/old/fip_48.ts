import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
import { BPTLens, CollateralizationOracle, StaticPCVDepositWrapper } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

const CHAINLINK_LUSD = '0x3D7aE7E594f2f2091Ad8798313450130d0Aba3a0';
const CHAINLINK_BAL = '0xC1438AA3823A6Ba0C159CfA8D98dF5A994bA120b';
const CHAINLINK_CREAM = '0x82597CFE6af8baad7c0d441AA82cbC3b51759607';

/*

CR Oracle updates

Deploy:
1. Lusd-usd oracle
2. Bal-Eth oracle
3. Cream-Eth oracle
4. Bal-usd composite oracle
5. Cream-usd composite oracle
6. Fei LUSD LBP Lens
7. Aave FEI Wrapper
8. CREAM Deposit Wrapper
9. BAL Deposit Wrapper
10. Static Deposit Wrapper
11. fei buyback LBP Lens

DAO:
1. Add new oracles LUSD, CREAM, BAL
2. Add new PCV Deposits
3. Remove PCV Deposit duplicates
*/
export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiLusdLBP,
    lusd,
    oneConstantOracle,
    aaveFeiPCVDeposit,
    chainlinkEthUsdOracleWrapper,
    feiDAOTimelock,
    bal,
    cream,
    feiTribeLBP,
    tribeUsdCompositeOracle
  } = addresses;

  if (!tribe || !fei || !feiLusdLBP) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Lusd-usd oracle
  const chainlinkFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkLUSDOracle = await chainlinkFactory.deploy(core, CHAINLINK_LUSD);

  await chainlinkLUSDOracle.deployed();

  logging && console.log('Chainlink LUSD Oracle deployed to: ', chainlinkLUSDOracle.address);

  // 2. Bal-Eth oracle
  const chainlinkBALEthOracle = await chainlinkFactory.deploy(core, CHAINLINK_BAL);

  await chainlinkBALEthOracle.deployed();

  logging && console.log('Chainlink BAL Oracle deployed to: ', chainlinkBALEthOracle.address);

  // 3. Cream-Eth oracle
  const chainlinkCREAMEthOracle = await chainlinkFactory.deploy(core, CHAINLINK_CREAM);

  await chainlinkCREAMEthOracle.deployed();

  logging && console.log('Chainlink CREAM Oracle deployed to: ', chainlinkCREAMEthOracle.address);

  // 4. Bal-usd composite oracle
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const balUsdCompositeOracle = await compositeOracleFactory.deploy(
    core,
    chainlinkBALEthOracle.address,
    chainlinkEthUsdOracleWrapper
  );

  await balUsdCompositeOracle.deployed();
  logging && console.log('BAL-USD Composite Oracle deployed to: ', balUsdCompositeOracle.address);

  // 5. Cream-usd composite oracle
  const creamUsdCompositeOracle = await compositeOracleFactory.deploy(
    core,
    chainlinkCREAMEthOracle.address,
    chainlinkEthUsdOracleWrapper
  );

  await creamUsdCompositeOracle.deployed();
  logging && console.log('CREAM-USD Composite Oracle deployed to: ', creamUsdCompositeOracle.address);

  // 6. Fei LUSD LBP Lens
  const factory = await ethers.getContractFactory('BPTLens');
  const feiLusdLens = await factory.deploy(
    lusd,
    feiLusdLBP,
    chainlinkLUSDOracle.address,
    oneConstantOracle, // constant oracle for FEI
    false, // fei not reported in
    true // fei is other
  );

  await feiLusdLens.deployed();

  logging && console.log('FEI/LUSD Lens deployed to: ', feiLusdLens.address);

  // 7. Aave FEI Wrapper
  const wrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');

  const aaveFeiPCVDepositWrapper = await wrapperFactory.deploy(aaveFeiPCVDeposit, fei, true);

  await aaveFeiPCVDepositWrapper.deployed();
  logging && console.log('Aave FEI PCV deposit wrapper deployed to: ', aaveFeiPCVDepositWrapper.address);

  const erc20wrapperFactory = await ethers.getContractFactory('ERC20PCVDepositWrapper');

  // 8. CREAM Deposit Wrapper
  const creamDepositWrapper = await erc20wrapperFactory.deploy(feiDAOTimelock, cream, false);

  await creamDepositWrapper.deployed();
  logging && console.log('CREAM PCV deposit wrapper deployed to: ', creamDepositWrapper.address);

  // 9. BAL Deposit Wrapper
  const balDepositWrapper = await erc20wrapperFactory.deploy(feiDAOTimelock, bal, false);

  await balDepositWrapper.deployed();
  logging && console.log('BAL PCV deposit wrapper deployed to: ', balDepositWrapper.address);

  // 10. Static Deposit Wrapper
  const staticPcvDepositWrapperFactory = await ethers.getContractFactory('StaticPCVDepositWrapper');
  const staticPcvDepositWrapper2 = await staticPcvDepositWrapperFactory.deploy(
    core,
    ethers.constants.WeiPerEther.mul(2_000_000),
    ethers.constants.WeiPerEther.mul(61_500_000)
  );

  await staticPcvDepositWrapper2.deployed();
  logging && console.log('Static PCV wrapper deployed to: ', staticPcvDepositWrapper2.address);

  // 11. fei buyback LBP Lens
  const feiBuybackLens = await factory.deploy(
    fei,
    feiTribeLBP,
    oneConstantOracle, // constant oracle for FEI
    tribeUsdCompositeOracle,
    true, // fei is reported in
    false // fei is not other
  );

  await feiBuybackLens.deployed();

  logging && console.log('FEI/TRIBE Buyback Lens deployed to: ', feiBuybackLens.address);
  return {
    chainlinkLUSDOracle,
    chainlinkCREAMEthOracle,
    chainlinkBALEthOracle,
    balUsdCompositeOracle,
    creamUsdCompositeOracle,
    feiLusdLens,
    aaveFeiPCVDepositWrapper,
    creamDepositWrapper,
    balDepositWrapper,
    staticPcvDepositWrapper2,
    feiBuybackLens
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Setup for CR-FIX');

  const crOracle = contracts.collateralizationOracle;
  console.log(await crOracle.tokenToOracle('0x1111111111111111111111111111111111111111'));
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for CR-FIX');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const lens: BPTLens = contracts.feiLusdLens as BPTLens;
  const buybackLens: BPTLens = contracts.feiBuybackLens as BPTLens;

  const staticWrapper: StaticPCVDepositWrapper = contracts.staticPcvDepositWrapper2 as StaticPCVDepositWrapper;
  const collateralizationOracle: CollateralizationOracle = contracts.collateralizationOracle as CollateralizationOracle;

  console.log(await lens.resistantBalanceAndFei());
  console.log(await buybackLens.resistantBalanceAndFei());

  // Check final PCV balances
  const stats = await collateralizationOracle.pcvStats();
  console.log(stats[0].toString());
  console.log(stats[1].toString());
  console.log(stats[2].toString());

  // Check admin of StaticWrapper
  expect(await staticWrapper.isContractAdmin(addresses.optimisticTimelock)).to.be.true;
  // Check existence of new oracles
  const oracles = await collateralizationOracle.getTokensInPcv();
  expect(oracles.length).to.be.equal(9);
  expect(oracles[6]).to.be.equal(addresses.lusd);
  expect(oracles[7]).to.be.equal(addresses.cream);
  expect(oracles[8]).to.be.equal(addresses.bal);

  // Check existence of new deposits
  expect(await collateralizationOracle.depositToToken(addresses.feiLusdLens)).to.be.equal(addresses.lusd);
  expect(await collateralizationOracle.depositToToken(addresses.rariPool7LusdPCVDeposit)).to.be.equal(addresses.lusd);
  expect(await collateralizationOracle.depositToToken(addresses.liquityFusePoolLusdPCVDeposit)).to.be.equal(
    addresses.lusd
  );
  expect(await collateralizationOracle.depositToToken(addresses.aaveFeiPCVDepositWrapper)).to.be.equal(addresses.fei);
  expect(await collateralizationOracle.depositToToken(addresses.feiBuybackLens)).to.be.equal(addresses.fei);
  expect(await collateralizationOracle.depositToToken(addresses.rariPool90FeiPCVDeposit)).to.be.equal(addresses.fei);
  expect(await collateralizationOracle.depositToToken(addresses.creamDepositWrapper)).to.be.equal(addresses.cream);
  expect(await collateralizationOracle.depositToToken(addresses.balDepositWrapper)).to.be.equal(addresses.bal);
  expect(await collateralizationOracle.depositToToken(addresses.staticPcvDepositWrapper2)).to.be.equal(
    '0x1111111111111111111111111111111111111111'
  );

  // Check removal of old deposits
  expect(await collateralizationOracle.depositToToken('0x4E119714f625B2E82e5fB5A7E297978f020Ea51E')).to.be.equal(
    '0x0000000000000000000000000000000000000000'
  );
  expect(await collateralizationOracle.depositToToken('0x05E2e93CFb0B53D36A3151ee727Bb581D4B918Ce')).to.be.equal(
    '0x0000000000000000000000000000000000000000'
  );
  expect(await collateralizationOracle.depositToToken('0x8B41DcEfAe6064E6bc2A9B3ae20141d23EFD6cbd')).to.be.equal(
    '0x0000000000000000000000000000000000000000'
  );
};
