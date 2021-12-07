const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Unitroller = artifacts.require('Unitroller');
const InterestRateModel = artifacts.require('InterestRateModel');

/*
 DAO Proposal Steps
    1. Reduce close factor from 50% to 33.33%
    2. Reduce liquidation incentive from 10% to 8%
    3. Increase FEI collateral factor from 75% to 80%
    4. Increase DAI collateral factor from 75% to 80%
    5. Increase ETH collateral factor from 75% to 80%
    6. Set new FEI IRM: 0% Base Rate, 7% Slope Mult., 400% Jump Mult., 80% Kink
    7. Set new TRIBE IRM: 0% Base Rate, 20% Slope Mult., 400% Jump Mult., 80% Kink
    8. Set new DAI IRM: 0% Base Rate, 10% Slope Mult., 400% Jump Mult., 80% Kink
    9. Set new ETH IRM: 0% Base Rate, 8% Slope Mult., 400% Jump Mult., 80% Kink
*/

async function setup(addresses, oldContracts, contracts, logging) {}

async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    rariPool8ComptrollerAddress,
    rariPool8FeiAddress,
    rariPool8TribeAddress,
    rariPool8EthAddress,
    rariPool8DaiAddress,
    rariPool8FeiIrmAddress,
    rariPool8TribeIrmAddress,
    rariPool8EthIrmAddress,
    rariPool8DaiIrmAddress,
    timelockAddress
  } = addresses;

  const rariPoolEightComptroller = await Unitroller.at(rariPool8ComptrollerAddress);
  const rariPoolEightFei = await CErc20Delegator.at(rariPool8FeiAddress);
  const rariPoolEightTribe = await CErc20Delegator.at(rariPool8TribeAddress);
  const rariPoolEightEth = await CErc20Delegator.at(rariPool8EthAddress);
  const rariPoolEightDai = await CErc20Delegator.at(rariPool8DaiAddress);
  const rariFeiIrm = await InterestRateModel.at(rariPool8FeiIrmAddress);
  const rariTribeIrm = await InterestRateModel.at(rariPool8TribeIrmAddress);
  const rariDaiIrm = await InterestRateModel.at(rariPool8DaiIrmAddress);
  const rariEthIrm = await InterestRateModel.at(rariPool8EthIrmAddress);

  // 1. Reduce close factor from 50% to 33.33%
  await rariPoolEightComptroller._setCloseFactor('333333333333333333', {
    from: timelockAddress
  });
  // 2. Reduce liquidation incentive from 10% to 8%
  await rariPoolEightComptroller._setLiquidationIncentive('1080000000000000000', {
    from: timelockAddress
  });
  // 3. Increase FEI collateral factor from 75% to 80%
  await rariPoolEightComptroller._setCollateralFactor(rariPool8FeiAddress, '800000000000000000', {
    from: timelockAddress
  });
  // 4. Increase DAI collateral factor from 75% to 80%
  await rariPoolEightComptroller._setCollateralFactor(rariPool8DaiAddress, '800000000000000000', {
    from: timelockAddress
  });
  // 5. Increase ETH collateral factor from 75% to 80%
  await rariPoolEightComptroller._setCollateralFactor(rariPool8EthAddress, '800000000000000000', {
    from: timelockAddress
  });
  // 6. Set new FEI IRM: 0% Base Rate, 7% Slope Mult., 400% Jump Mult., 80% Kink
  await rariPoolEightFei._setInterestRateModel(rariPool8FeiIrmAddress, {
    from: timelockAddress
  });
  // 7. Set new TRIBE IRM: 0% Base Rate, 20% Slope Mult., 400% Jump Mult., 80% Kink
  await rariPoolEightTribe._setInterestRateModel(rariPool8TribeIrmAddress, {
    from: timelockAddress
  });
  // 8. Set new DAI IRM: 0% Base Rate, 10% Slope Mult., 400% Jump Mult., 80% Kink
  await rariPoolEightDai._setInterestRateModel(rariPool8DaiIrmAddress, {
    from: timelockAddress
  });
  // 9. Set new ETH IRM: 0% Base Rate, 8% Slope Mult., 400% Jump Mult., 80% Kink
  await rariPoolEightEth._setInterestRateModel(rariPool8EthIrmAddress, {
    from: timelockAddress
  });
}

async function teardown(addresses, oldContracts, contracts) {}

async function validate(addresses, oldContracts, contracts) {
  const {
    rariPool8ComptrollerAddress,
    rariPool8FeiAddress,
    rariPool8TribeAddress,
    rariPool8EthAddress,
    rariPool8DaiAddress,
    rariPool8FeiIrmAddress,
    rariPool8TribeIrmAddress,
    rariPool8EthIrmAddress,
    rariPool8DaiIrmAddress
  } = addresses;

  const rariPoolEightComptroller = await Unitroller.at(rariPool8ComptrollerAddress);
  const rariPoolEightFei = await CErc20Delegator.at(rariPool8FeiAddress);
  const rariPoolEightTribe = await CErc20Delegator.at(rariPool8TribeAddress);
  const rariPoolEightEth = await CErc20Delegator.at(rariPool8EthAddress);
  const rariPoolEightDai = await CErc20Delegator.at(rariPool8DaiAddress);
  const rariFeiIrm = await InterestRateModel.at(rariPool8FeiIrmAddress);
  const rariTribeIrm = await InterestRateModel.at(rariPool8TribeIrmAddress);
  const rariDaiIrm = await InterestRateModel.at(rariPool8DaiIrmAddress);
  const rariEthIrm = await InterestRateModel.at(rariPool8EthIrmAddress);

  // Check close factor on the comptroller
  const closeFactorMantissa = await rariPoolEightComptroller.closeFactorMantissa();
  console.log('CLOSE FACTOR MANTISSA', closeFactorMantissa.toString());
  // Check liquidation incentive on the comptroller
  const liquidationIncentiveMantissa = await rariPoolEightComptroller.liquidationIncentiveMantissa();
  console.log('LIQ. INCENTIVE MANTISSA', liquidationIncentiveMantissa.toString());
  // Check the collateral factors
  const { collateralFactorMantissa: feiCollateralFactorMantissa } = await rariPoolEightComptroller.markets(
    rariPool8FeiAddress
  );
  const { collateralFactorMantissa: tribeCollateralFactorMantissa } = await rariPoolEightComptroller.markets(
    rariPool8TribeAddress
  );
  const { collateralFactorMantissa: daiCollateralFactorMantissa } = await rariPoolEightComptroller.markets(
    rariPool8DaiAddress
  );
  const { collateralFactorMantissa: ethCollateralFactorMantissa } = await rariPoolEightComptroller.markets(
    rariPool8EthAddress
  );
  console.log(
    'COLLATERAL FACTOR MANTISSAS',
    JSON.stringify(
      {
        FEI: feiCollateralFactorMantissa.toString(),
        TRIBE: tribeCollateralFactorMantissa.toString(),
        DAI: daiCollateralFactorMantissa.toString(),
        ETH: ethCollateralFactorMantissa.toString()
      },
      null,
      2
    )
  );
  // Check that all the IRMs are set to the new addresses
  console.log(
    'NEW IRM ADDRESSES',
    JSON.stringify(
      {
        FEI: await rariPoolEightFei.interestRateModel(),
        TRIBE: await rariPoolEightTribe.interestRateModel(),
        DAI: await rariPoolEightDai.interestRateModel(),
        ETH: await rariPoolEightEth.interestRateModel()
      },
      null,
      2
    )
  );
  // Check that the parameters of all the IRMs are correctly set
  const pools = [
    {
      contract: rariFeiIrm,
      name: 'FEI'
    },
    {
      contract: rariTribeIrm,
      name: 'TRIBE'
    },
    {
      contract: rariDaiIrm,
      name: 'DAI'
    },
    {
      contract: rariEthIrm,
      name: 'ETH'
    }
  ];
  for (let i = 0; i < pools.length; i += 1) {
    const { contract, name } = pools[i];
    const kink = await contract.kink();
    const jumpMultiplierPerBlock = await contract.jumpMultiplierPerBlock();
    const multiplierPerBlock = await contract.multiplierPerBlock();
    const blocksPerYear = await contract.blocksPerYear();
    console.log(`${name} POOL IRM PARAMS`, {
      // blocksPerYear: blocksPerYear.toString(),
      // jumpMultiplierPerBlock: jumpMultiplierPerBlock.toString(),
      // multiplierPerBlock: multiplierPerBlock.toString(),
      kink: kink.toString(),
      multiplierPercent: multiplierPerBlock.mul(blocksPerYear).toString(),
      jumpMultiplierPercent: jumpMultiplierPerBlock.mul(blocksPerYear).toString()
    });
  }
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
