const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const ERC20CompoundPCVDeposit = artifacts.readArtifactSync('ERC20CompoundPCVDeposit');
const BondingCurve = artifacts.readArtifactSync('BondingCurve');

const e18 = '000000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, chainlinkDaiUsdOracleAddress, daiAddress, compoundDaiAddress } = addresses;

  if (!coreAddress || !chainlinkDaiUsdOracleAddress || !daiAddress || !compoundDaiAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const chainlinkDaiUsdOracleWrapper = await ChainlinkOracleWrapper.new(coreAddress, chainlinkDaiUsdOracleAddress, {
    from: deployAddress
  });

  logging ? console.log('DAI Oracle Wrapper deployed to: ', chainlinkDaiUsdOracleWrapper.address) : undefined;

  const compoundDaiPCVDeposit = await ERC20CompoundPCVDeposit.new(coreAddress, compoundDaiAddress, daiAddress, {
    from: deployAddress
  });

  logging ? console.log('DAI ERC20CompoundPCVDeposit deployed to: ', compoundDaiPCVDeposit.address) : undefined;

  const daiBondingCurve = await BondingCurve.new(
    coreAddress,
    chainlinkDaiUsdOracleWrapper.address,
    chainlinkDaiUsdOracleWrapper.address,
    `50000000${e18}`, // 50M Scale
    [compoundDaiPCVDeposit.address],
    [10000], // 100% to compound
    604800, // 1 week between incentives
    `100${e18}`, // 100 FEI reward
    daiAddress,
    30, // pre-scale discount .30%
    100 // post-scale buffer 1%
  );
  logging ? console.log('DAI Bonding Curve deployed to: ', daiBondingCurve.address) : undefined;

  return {
    chainlinkDaiUsdOracleWrapper,
    compoundDaiPCVDeposit,
    daiBondingCurve
  };
}

module.exports = { deploy };
