const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const ChainlinkCompositOracle = artifacts.readArtifactSync('CompositeOracle');
const ERC20CompoundPCVDeposit = artifacts.readArtifactSync('ERC20CompoundPCVDeposit');
const AavePCVDeposit = artifacts.readArtifactSync('AavePCVDeposit');
const BondingCurve = artifacts.readArtifactSync('BondingCurve');

const e18 = '000000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    chainlinkRaiEthOracleAddress,
    chainlinkEthUsdOracleWrapperAddress,
    raiAddress,
    reflexerStableAssetFusePoolRaiAddress,
    aaveLendingPool,
    aRaiAddress,
    aaveIncentivesController
  } = addresses;

  if (
    !coreAddress ||
    !chainlinkRaiEthOracleAddress ||
    !chainlinkEthUsdOracleWrapperAddress ||
    !raiAddress ||
    !reflexerStableAssetFusePoolRaiAddress ||
    !aaveLendingPool ||
    !aRaiAddress ||
    !aaveIncentivesController
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const chainlinkRaiEthOracleWrapper = await ChainlinkOracleWrapper.new(coreAddress, chainlinkRaiEthOracleAddress, {
    from: deployAddress
  });

  logging ? console.log('RAI/ETH Oracle Wrapper deployed to: ', chainlinkRaiEthOracleWrapper.address) : undefined;

  const chainlinkRaiUsdCompositOracle = await ChainlinkCompositOracle.new(
    coreAddress,
    chainlinkRaiEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapperAddress,
    { from: deployAddress }
  );

  logging ? console.log('RAI Composit oracle deployed to: ', chainlinkRaiUsdCompositOracle.address) : undefined;

  const reflexerStableAssetFusePoolRaiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    reflexerStableAssetFusePoolRaiAddress,
    raiAddress,
    { from: deployAddress }
  );

  logging
    ? console.log(
        'RAI Reflexer stable asset ERC20CompoundPCVDeposit deployed to: ',
        reflexerStableAssetFusePoolRaiPCVDeposit.address
      )
    : undefined;

  const aaveRaiPCVDeposit = await AavePCVDeposit.new(
    coreAddress,
    aaveLendingPool,
    raiAddress,
    aRaiAddress,
    aaveIncentivesController,
    { from: deployAddress }
  );

  logging ? console.log('Aave RAI PCV Deposit deployed to: ', aaveRaiPCVDeposit.address) : undefined;

  const raiBondingCurve = await BondingCurve.new(
    coreAddress,
    chainlinkRaiUsdCompositOracle.address,
    chainlinkRaiUsdCompositOracle.address,
    `6000000${e18}`, // 6M Scale
    [reflexerStableAssetFusePoolRaiPCVDeposit.address, aaveRaiPCVDeposit.address],
    [5000, 5000], // 50% allocated to Fuse, 50% to Aave
    604800, // 1 week between incentives
    `100${e18}`, // 100 FEI reward
    raiAddress,
    30, // pre-scale discount 0.3%
    200 // post-scale buffer 2%
  );
  logging ? console.log('RAI Bonding Curve deployed to: ', raiBondingCurve.address) : undefined;

  return {
    chainlinkRaiEthOracleWrapper,
    chainlinkRaiUsdCompositOracle,
    reflexerStableAssetFusePoolRaiPCVDeposit,
    aaveRaiPCVDeposit,
    raiBondingCurve
  };
}

module.exports = { deploy };
