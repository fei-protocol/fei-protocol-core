const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const ERC20CompoundPCVDeposit = artifacts.readArtifactSync('ERC20CompoundPCVDeposit');
const UniswapPCVDeposit = artifacts.readArtifactSync('UniswapPCVDeposit');
const BondingCurve = artifacts.readArtifactSync('BondingCurve');

const e18 = '000000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    chainlinkDpiUsdOracleAddress,
    dpiAddress,
    sushiswapDpiFeiAddress,
    indexCoopFusePoolDpiAddress,
    sushiswapRouterAddress
  } = addresses;

  if (
    !coreAddress ||
    !chainlinkDpiUsdOracleAddress ||
    !dpiAddress ||
    !sushiswapDpiFeiAddress ||
    !indexCoopFusePoolDpiAddress ||
    !sushiswapRouterAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const chainlinkDpiUsdOracleWrapper = await ChainlinkOracleWrapper.new(coreAddress, chainlinkDpiUsdOracleAddress, {
    from: deployAddress
  });

  logging ? console.log('DPI Oracle Wrapper deployed to: ', chainlinkDpiUsdOracleWrapper.address) : undefined;

  const indexCoopFusePoolDpiPCVDeposit = await ERC20CompoundPCVDeposit.new(
    coreAddress,
    indexCoopFusePoolDpiAddress,
    dpiAddress,
    { from: deployAddress }
  );

  logging
    ? console.log(
        'DPI Index Coop Fuse Pool ERC20CompoundPCVDeposit deployed to: ',
        indexCoopFusePoolDpiPCVDeposit.address
      )
    : undefined;

  const dpiUniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    sushiswapDpiFeiAddress,
    sushiswapRouterAddress,
    chainlinkDpiUsdOracleWrapper.address,
    chainlinkDpiUsdOracleWrapper.address,
    100,
    { from: deployAddress }
  );

  logging ? console.log('DPI UniswapPCVDeposit deployed to: ', dpiUniswapPCVDeposit.address) : undefined;

  const dpiBondingCurve = await BondingCurve.new(
    coreAddress,
    chainlinkDpiUsdOracleWrapper.address,
    chainlinkDpiUsdOracleWrapper.address,
    `10000000${e18}`, // 10M Scale
    [dpiUniswapPCVDeposit.address, indexCoopFusePoolDpiPCVDeposit.address],
    [9000, 1000], // 90/10 split
    604800, // 1 week between incentives
    `100${e18}`, // 100 FEI reward
    dpiAddress,
    100, // pre-scale discount 1%
    200 // post-scale buffer 2%
  );
  logging ? console.log('DPI Bonding Curve deployed to: ', dpiBondingCurve.address) : undefined;

  return {
    chainlinkDpiUsdOracleWrapper,
    indexCoopFusePoolDpiPCVDeposit,
    dpiUniswapPCVDeposit,
    dpiBondingCurve
  };
}

module.exports = { deploy };
