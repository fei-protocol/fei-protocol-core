const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const ChainlinkCompositOracle = artifacts.readArtifactSync('CompositeOracle');
const BalancerLBPSwapper = artifacts.readArtifactSync('BalancerLBPSwapper');
const WeightedBalancerPoolManager = artifacts.readArtifactSync('WeightedBalancerPoolManager');
const ILiquidityBootstrappingPoolFactory = artifacts.readArtifactSync('ILiquidityBootstrappingPoolFactory');

const e16 = '0000000000000000';
const e14 = '00000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    tribeAddress,
    chainlinkTribeEthOracleAddress,
    chainlinkEthUsdOracleWrapperAddress,
    balancerLBPoolFactoryAddress,
    timelockAddress // TODO use better address
  } = addresses;

  if (!coreAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const chainlinkTribeEthOracleWrapper = await ChainlinkOracleWrapper.new(coreAddress, chainlinkTribeEthOracleAddress, {
    from: deployAddress
  });

  logging ? console.log('TRIBE/ETH Oracle Wrapper deployed to: ', chainlinkTribeEthOracleWrapper.address) : undefined;

  const chainlinkTribeUsdCompositeOracle = await ChainlinkCompositOracle.new(
    coreAddress,
    chainlinkTribeEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapperAddress,
    { from: deployAddress }
  );

  logging ? console.log('TRIBE Composite oracle deployed to: ', chainlinkTribeUsdCompositeOracle.address) : undefined;

  const balancerLBPSwapper = await BalancerLBPSwapper.new(
    coreAddress,
    {
      _oracle: chainlinkTribeUsdCompositeOracle.address,
      _backupOracle: chainlinkTribeUsdCompositeOracle.address,
      _decimalsNormalizer: 0,
      _invertOraclePrice: true
    },
    '60', // 1 minute frequency
    feiAddress,
    tribeAddress,
    timelockAddress,
    `100000${e16}` // 1000 FEI min
  );

  logging && console.log('Balance LBP Pool Swapper deployed to: ', balancerLBPSwapper.address);

  const lbpFactory = await ILiquidityBootstrappingPoolFactory.at(balancerLBPoolFactoryAddress);

  const tx = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [feiAddress, tribeAddress],
    [`99${e16}`, `1${e16}`],
    `30${e14}`,
    balancerLBPSwapper.address,
    true
  );
  const { rawLogs } = tx.receipt;
  const poolAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', poolAddress);

  await balancerLBPSwapper.init(poolAddress);

  return {
    chainlinkTribeEthOracleWrapper,
    chainlinkTribeUsdCompositeOracle,
    balancerLBPSwapper
  };
}

module.exports = { deploy };
