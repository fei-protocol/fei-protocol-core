import { AddressCategory } from '../types/types'; // imported without custom path to allow docs to autogen without ts errors

export const MainnetContractsConfig = {
  simpleFeiDaiPSM: {
    artifactName: 'SimpleFeiDaiPSM',
    address: '0x7842186CDd11270C4Af8C0A99A5E0589c7F249ce',
    category: AddressCategory.Peg
  },
  tribeRedeemer: {
    artifactName: 'TribeRedeemer',
    address: '0x4d9629e80118082b939e3d59e69c82a2ec08b4d5',
    category: AddressCategory.Core
  },
  rariMerkleRedeemer: {
    artifactName: 'RariMerkleRedeemer',
    address: '0xCAe4210e6676727EA4e0fD9BA5dFb95831356a16',
    category: AddressCategory.Core
  },
  core: {
    artifactName: 'Core',
    address: '0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9',
    category: AddressCategory.Core
  },
  fei: {
    artifactName: 'Fei',
    address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
    category: AddressCategory.Core
  },
  proxyAdmin: {
    artifactName: 'ProxyAdmin',
    address: '0xf8c2b645988b7658E7748BA637fE25bdD46A704A',
    category: AddressCategory.Core
  },
  tribe: {
    artifactName: 'Tribe',
    address: '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B',
    category: AddressCategory.Core
  },
  tribeMinter: {
    artifactName: 'TribeMinter',
    address: '0xFC3532b443383d9022b1B2c6FD5Fd0895943360A',
    category: AddressCategory.Core
  },
  restrictedPermissions: {
    artifactName: 'RestrictedPermissions',
    address: '0x10ffa0CD36Bc16b355d21A08DF4a552c4A9FEC10',
    category: AddressCategory.Core
  },
  feiTimelockBurner1: {
    artifactName: 'FeiLinearTokenTimelockBurner',
    address: '0x072e5D8DBe245bB78aF1888866E6eFE9548d017F',
    category: AddressCategory.Distribution
  },
  tribeTimelockBurner1: {
    artifactName: 'TribeTimelockedDelegatorBurner',
    address: '0x8772D97229A55cf0e2D4AB37766D5DC5647cdF3C',
    category: AddressCategory.Distribution
  },
  tribeTimelockBurner2: {
    artifactName: 'TribeTimelockedDelegatorBurner',
    address: '0x8f966aF3ACc936aE6b8ebeB893F6f5925e220902',
    category: AddressCategory.Distribution
  },
  daoTimelockBurner: {
    artifactName: 'DAOTimelockBurner',
    address: '0x6F6580285a63f1e886548458f427f8695BA1a563',
    category: AddressCategory.Core
  },
  guardianMultisig: {
    artifactName: 'unknown',
    address: '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775',
    category: AddressCategory.Security
  },
  feiDAO: {
    artifactName: 'FeiDAO',
    address: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
    category: AddressCategory.Governance
  },

  feiDAOTimelock: {
    artifactName: 'FeiDAOTimelock',
    address: '0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c',
    category: AddressCategory.Governance
  },
  rariTimelock: {
    artifactName: 'Timelock',
    address: '0x8ace03Fc45139fDDba944c6A4082b604041d19FC',
    category: AddressCategory.Governance
  },

  tribeRariDAO: {
    artifactName: 'FeiDAO',
    address: '0x637deEED4e4deb1D222650bD4B64192abf002c00',
    category: AddressCategory.Governance
  },

  rariGovernanceProxyAdmin: {
    artifactName: 'ProxyAdmin',
    address: '0x1c9aA54a013962C2444ECae06902F31D532c6AD3',
    category: AddressCategory.Governance
  },

  rariTimelockFeiOldLens: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x614D46B7eB2AC1a359b8835D64954F3Ee4E6F676',
    category: AddressCategory.PCV
  },

  escrowedAaveDaiPCVDeposit: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x82c55A1Ab5C6F4b8e162b7dE24b50A38E1aFd38f',
    category: AddressCategory.PCV
  },

  collateralizationOracle: {
    artifactName: 'CollateralizationOracle',
    address: '0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257',
    category: AddressCategory.Collateralization
  },
  rariInfraFeiTimelock: {
    artifactName: 'LinearTokenTimelock',
    address: '0xfaFC562265a49975E8B20707EAC966473795CF90',
    category: AddressCategory.Distribution
  },
  rariInfraTribeTimelock: {
    artifactName: 'LinearTimelockedDelegator',
    address: '0x625cf6AA7DafB154F3Eb6BE87592110e30290dEe',
    category: AddressCategory.Distribution
  },

  oneConstantOracle: {
    artifactName: 'ConstantOracle',
    address: '0x2374800337c6BE8B935f96AA6c10b33f9F12Bd40',
    category: AddressCategory.Oracle
  },

  zeroConstantOracle: {
    artifactName: 'ConstantOracle',
    address: '0x43b99923CF06D6D9101110b595234670f73A4934',
    category: AddressCategory.Oracle
  },

  rariPool8ConvexD3Plugin: {
    artifactName: 'IConvexERC4626',
    address: '0xaa189e7f4aac757216b62849f78f1236749ba814',
    category: AddressCategory.FeiRari
  },

  rariCErc20PluginImpl: {
    artifactName: 'unknown',
    address: '0xbfb8D550B53F64F581df1Da41DDa0CB9E596Aa0E',
    category: AddressCategory.FeiRari
  },

  rariPool8Comptroller: {
    artifactName: 'Unitroller',
    address: '0xc54172e34046c1653d1920d40333dd358c7a1af4',
    category: AddressCategory.FeiRari
  },

  rariPool8MasterOracle: {
    artifactName: 'IMasterOracle',
    address: '0x4d10BC156FBaD2474a94f792fe0D6c3261469cdd',
    category: AddressCategory.FeiRari
  },

  rariChainlinkPriceOracleV3: {
    artifactName: 'unknown',
    address: '0x058c345D3240001088b6280e008F9e78b3B2112d',
    category: AddressCategory.FeiRari
  },

  curveLPTokenOracle: {
    artifactName: 'unknown',
    address: '0xa9f3faac3b8eDF7b3DCcFDBBf25033D6F5fc02F3',
    category: AddressCategory.FeiRari
  },

  gUniFuseOracle: {
    artifactName: 'unknown',
    address: '0xEa3633b38C747ceA231aDB74b511DC2eD3992B43',
    category: AddressCategory.FeiRari
  },

  rariPool8Lusd: {
    artifactName: 'CErc20Delegator',
    address: '0x647A36d421183a0a9Fa62717a64B664a24E469C7',
    category: AddressCategory.FeiRari
  },

  rariPool8Dai: {
    artifactName: 'CErc20Delegator',
    address: '0x7e9cE3CAa9910cc048590801e64174957Ed41d43',
    category: AddressCategory.FeiRari
  },

  rariPool8DaiIrm: {
    artifactName: 'unknown',
    address: '0xede47399e2aa8f076d40dc52896331cba8bd40f7',
    category: AddressCategory.FeiRari
  },

  rariPool8Eth: {
    artifactName: 'CErc20Delegator',
    address: '0xbB025D470162CC5eA24daF7d4566064EE7f5F111',
    category: AddressCategory.FeiRari
  },

  rariPool8EthIrm: {
    artifactName: 'unknown',
    address: '0xbab47e4b692195bf064923178a90ef999a15f819',
    category: AddressCategory.FeiRari
  },

  rariPool8Fei: {
    artifactName: 'CErc20Delegator',
    address: '0xd8553552f8868C1Ef160eEdf031cF0BCf9686945',
    category: AddressCategory.FeiRari
  },

  rariPool8FeiIrm: {
    artifactName: 'unknown',
    address: '0x8f47be5692180079931e2f983db6996647aba0a5',
    category: AddressCategory.FeiRari
  },

  rariPool8Tribe: {
    artifactName: 'CErc20Delegator',
    address: '0xFd3300A9a74b3250F1b2AbC12B47611171910b07',
    category: AddressCategory.FeiRari
  },

  rariPool8TribeIrm: {
    artifactName: 'unknown',
    address: '0x075538650a9c69ac8019507a7dd1bd879b12c1d7',
    category: AddressCategory.FeiRari
  },

  rariPool8CTokenImpl: {
    artifactName: 'unknown',
    address: '0x67Db14E73C2Dce786B5bbBfa4D010dEab4BBFCF9',
    category: AddressCategory.FeiRari
  },

  rariPool8Fei3Crv: {
    artifactName: 'CErc20Delegator',
    address: '0xBFB6f7532d2DB0fE4D83aBb001c5C2B0842AF4dB',
    category: AddressCategory.FeiRari
  },

  rariPool8FeiD3: {
    artifactName: 'CErc20Delegator',
    address: '0x5cA8Ffe4DAD9452ED880FA429DD0A08574225936',
    category: AddressCategory.FeiRari
  },

  rariPool146Comptroller: {
    artifactName: 'Unitroller',
    address: '0x88F7c23EA6C4C404dA463Bc9aE03b012B32DEf9e',
    category: AddressCategory.FeiRari
  },

  rariPool146FuseAdmin: {
    artifactName: 'FuseAdmin',
    address: '0x6d64D080345C446dA31b8D3855bA6d9C0fC875D2',
    category: AddressCategory.FeiRari
  },

  rariPool146Eth: {
    artifactName: 'unknown',
    address: '0xfbD8Aaf46Ab3C2732FA930e5B343cd67cEA5054C',
    category: AddressCategory.FeiRari
  },

  fuseAdmin: {
    artifactName: 'FuseAdmin',
    address: '0x761dD1Ae03D95BdABeC3C228532Dcdab4F2c7adD',
    category: AddressCategory.FeiRari
  },

  fuseGuardian: {
    artifactName: 'FuseGuardian',
    address: '0xc0c59A2d3F278445f27ed4a00E2727D6c677c43F',
    category: AddressCategory.FeiRari
  },

  balancerBBaUSD: {
    artifactName: 'unknown',
    address: '0xA13a9247ea42D743238089903570127DdA72fE44',
    category: AddressCategory.External
  },

  balancerBBUSDGauge: {
    artifactName: 'unknown',
    address: '0xa6325e799d266632D347e41265a69aF111b05403',
    category: AddressCategory.External
  },

  vebalOtcHelper: {
    artifactName: 'VeBalHelper',
    address: '0xb02CE4D72124b98Df4EAB4184467d7Da0023F9FB',
    category: AddressCategory.External
  },

  balancerVotingEscrowDelegation: {
    artifactName: 'IVotingEscrowDelegation',
    address: '0xB496FF44746A8693A060FafD984Da41B253f6790',
    category: AddressCategory.External
  },

  balancerGaugeStakerV2Impl: {
    artifactName: 'BalancerGaugeStakerV2',
    address: '0xbf3f6c7821E4d7D5DF204dEa4871b2e8D68c1CCd',
    category: AddressCategory.External
  },

  // Use to call proxy functions
  balancerGaugeStakerProxy: {
    artifactName: 'TransparentUpgradeableProxy',
    address: '0x66977Ce30049CD0e443216Bf26377966c3A109E2',
    category: AddressCategory.External
  },

  // Use to call functions through the proxy. Proxy address cast
  // with latest implementation interface
  balancerGaugeStaker: {
    artifactName: 'BalancerGaugeStakerV2',
    address: '0x66977Ce30049CD0e443216Bf26377966c3A109E2',
    category: AddressCategory.External
  },

  volt: {
    artifactName: 'Fei',
    address: '0x559eBC30b0E58a45Cc9fF573f77EF1e5eb1b3E18',
    category: AddressCategory.External
  },
  voltFusePCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xFeBDf448C8484834bb399d930d7E1bdC773E23bA',
    category: AddressCategory.External
  },

  voltSafe: {
    artifactName: 'unknown',
    address: '0xcBB83206698E8788F85EFbEeeCAd17e53366EBDf',
    category: AddressCategory.External
  },
  voltOptimisticTimelock: {
    artifactName: 'unknown',
    address: '0x860fa85f04f9d35b3471d8f7f7fa3ad31ce4d5ae',
    category: AddressCategory.External
  },
  aaveLendingPoolAddressesProvider: {
    artifactName: 'unknown',
    address: '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5',
    category: AddressCategory.External
  },
  dpiToDaiLBPPool: {
    artifactName: 'IWeightedPool',
    address: '0xd10386804959a121a8a487e49f45aa9f5a2eb2a0',
    category: AddressCategory.External
  },

  ethToDaiLBPPool: {
    artifactName: 'IWeightedPool',
    address: '0x34809aEDF93066b49F638562c42A9751eDb36DF5',
    category: AddressCategory.External
  },
  lusdToDaiLBPPool: {
    // poolId: 0x8485b36623632ffa5e486008df4d0b6d363defdb00020000000000000000034a
    artifactName: 'IWeightedPool',
    address: '0x8485b36623632ffa5e486008df4d0b6d363defdb',
    category: AddressCategory.External
  },

  veBal: {
    artifactName: 'IVeToken',
    address: '0xC128a9954e6c874eA3d62ce62B468bA073093F25',
    category: AddressCategory.External
  },

  bpt80Bal20Weth: {
    artifactName: 'IERC20',
    address: '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56',
    category: AddressCategory.External
  },

  bpt30Fei70Weth: {
    artifactName: 'IERC20',
    address: '0x90291319F1D4eA3ad4dB0Dd8fe9E12BAF749E845',
    category: AddressCategory.External
  },

  balancerMinter: {
    artifactName: 'IBalancerMinter',
    address: '0x239e55F427D44C3cc793f49bFB507ebe76638a2b',
    category: AddressCategory.External
  },

  balancerGaugeController: {
    artifactName: 'ILiquidityGaugeController',
    address: '0xC128468b7Ce63eA702C1f104D55A2566b13D3ABD',
    category: AddressCategory.External
  },

  balancerGaugeBpt30Fei70Weth: {
    artifactName: 'ILiquidityGauge',
    address: '0x4f9463405F5bC7b4C1304222c1dF76EFbD81a407',
    category: AddressCategory.External
  },

  tokemakManagerRollover: {
    artifactName: 'unknown',
    address: '0x90b6C61B102eA260131aB48377E143D6EB3A9d4B',
    category: AddressCategory.External
  },

  tokemakManager: {
    artifactName: 'unknown',
    address: '0xa86e412109f77c45a3bc1c5870b880492fb86a14',
    category: AddressCategory.External
  },

  rariOpsMultisig: {
    artifactName: 'unknown',
    address: '0x5A2e3420af551a48a1dB056caC4d6Ba752bF1488',
    category: AddressCategory.External
  },

  aave: {
    artifactName: 'IERC20',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    category: AddressCategory.External
  },

  aaveGovernanceV2: {
    artifactName: 'IAaveGovernanceV2',
    address: '0xEC568fffba86c094cf06b22134B23074DFE2252c',
    category: AddressCategory.External
  },

  aaveIncentivesController: {
    artifactName: 'IAaveIncentivesController',
    address: '0xd784927ff2f95ba542bfc824c8a8a98f3495f6b5',
    category: AddressCategory.External
  },

  aaveLendingPool: {
    artifactName: 'ILendingPool',
    address: '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9',
    category: AddressCategory.External
  },

  bbausd: {
    artifactName: 'IERC20',
    address: '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2',
    category: AddressCategory.External
  },

  aFei: {
    artifactName: 'IERC20',
    address: '0x683923dB55Fead99A79Fa01A27EeC3cB19679cC3',
    category: AddressCategory.External
  },

  cFei: {
    artifactName: 'IERC20',
    address: '0x7713DD9Ca933848F6819F38B8352D9A15EA73F67',
    category: AddressCategory.External
  },

  aFeiStableDebt: {
    artifactName: 'IERC20',
    address: '0xd89cF9E8A858F8B4b31Faf793505e112d6c17449',
    category: AddressCategory.External
  },

  aFeiVariableDebt: {
    artifactName: 'IERC20',
    address: '0xC2e10006AccAb7B45D9184FcF5b7EC7763f5BaAe',
    category: AddressCategory.External
  },

  agEUR: {
    artifactName: 'IERC20',
    address: '0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8',
    category: AddressCategory.External
  },

  alusd: {
    artifactName: 'IERC20',
    address: '0xBC6DA0FE9aD5f3b0d58160288917AA56653660E9',
    category: AddressCategory.External
  },

  angleMultisig: {
    artifactName: 'unknown',
    address: '0x0C2553e4B9dFA9f83b1A6D3EAB96c4bAaB42d430',
    category: AddressCategory.External
  },

  angle: {
    artifactName: 'Tribe', // using Tribe instead of IERC20 to have delegate()
    address: '0x31429d1856ad1377a8a0079410b297e1a9e214c2',
    category: AddressCategory.External
  },

  angleAgEurFeiPool: {
    artifactName: 'IUniswapV2Pair',
    address: '0xF89CE5eD65737dA8440411544b0499c9FaD323B2',
    category: AddressCategory.External
  },

  anglePoolManager: {
    artifactName: 'IAnglePoolManager',
    address: '0x53b981389Cfc5dCDA2DC2e903147B5DD0E985F44',
    category: AddressCategory.External
  },

  angleStableMaster: {
    artifactName: 'IAngleStableMaster',
    address: '0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87',
    category: AddressCategory.External
  },

  angleGaugeController: {
    artifactName: 'ILiquidityGaugeController',
    address: '0x9aD7e7b0877582E14c17702EecF49018DD6f2367',
    category: AddressCategory.External
  },

  angleGaugeUniswapV2FeiAgEur: {
    artifactName: 'ILiquidityGauge',
    address: '0xd6282C5aEAaD4d776B932451C44b8EB453E44244',
    category: AddressCategory.External
  },

  anglePoolManagerUsdc: {
    artifactName: 'IAnglePoolManager',
    address: '0xe9f183FC656656f1F17af1F2b0dF79b8fF9ad8eD',
    category: AddressCategory.External
  },
  angleStrategyUsdc1: {
    artifactName: 'IAngleStrategy',
    address: '0x5fE0E497Ac676d8bA78598FC8016EBC1E6cE14a3',
    category: AddressCategory.External
  },

  veAngle: {
    artifactName: 'IVeToken',
    address: '0x0C462Dbb9EC8cD1630f1728B2CFD2769d09f0dd5',
    category: AddressCategory.External
  },

  comp: {
    artifactName: 'Tribe', // using Tribe instead of IERC20 to have delegate()
    address: '0xc00e94Cb662C3520282E6f5717214004A7f26888',
    category: AddressCategory.External
  },

  aRai: {
    artifactName: 'IERC20',
    address: '0xc9BC48c72154ef3e5425641a3c747242112a46AF',
    category: AddressCategory.External
  },

  aWETH: {
    artifactName: 'IERC20',
    address: '0x030bA81f1c18d280636F32af80b9AAd02Cf0854e',
    category: AddressCategory.External
  },

  bal: {
    artifactName: 'IERC20',
    address: '0xba100000625a3754423978a60c9317c58a424e3D',
    category: AddressCategory.External
  },

  balWethBPT: {
    artifactName: 'IERC20',
    address: '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56',
    category: AddressCategory.External
  },

  usdc: {
    artifactName: 'IERC20',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    category: AddressCategory.External
  },

  balancerAdmin: {
    artifactName: 'unknown',
    address: '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f',
    category: AddressCategory.External
  },

  balancerAuthorizer: {
    artifactName: 'Permissions',
    address: '0xA331D84eC860Bf466b4CdCcFb4aC09a1B43F3aE6',
    category: AddressCategory.External
  },

  balancerWeightedPoolFactory: {
    artifactName: 'IWeightedPool2TokensFactory',
    address: '0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0',
    category: AddressCategory.External
  },

  balancerLBPoolFactory: {
    artifactName: 'ILiquidityBootstrappingPoolFactory',
    address: '0x751A0bC0e3f75b38e01Cf25bFCE7fF36DE1C87DE',
    category: AddressCategory.External
  },

  balancerLBPoolFactoryNoFee: {
    artifactName: 'ILiquidityBootstrappingPoolFactory',
    address: '0x0F3e0c4218b7b0108a3643cFe9D3ec0d4F57c54e',
    category: AddressCategory.External
  },

  balancerVault: {
    artifactName: 'IVault',
    address: '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
    category: AddressCategory.External
  },

  balancerRewards: {
    artifactName: 'IMerkleOrchard',
    address: '0xdAE7e32ADc5d490a43cCba1f0c736033F2b4eFca',
    category: AddressCategory.External
  },

  barnbridgeAFei: {
    artifactName: 'ISmartYield',
    address: '0xA3abb32c657adA8803bF6AEEF6Eb42B29c74bf28',
    category: AddressCategory.External
  },

  bamm: {
    artifactName: 'IBAMM',
    address: '0x0d3AbAA7E088C2c82f54B2f47613DA438ea8C598',
    category: AddressCategory.External
  },

  bentoBox: {
    artifactName: 'IMasterContractManager',
    address: '0xF5BCE5077908a1b7370B9ae04AdC565EBd643966',
    category: AddressCategory.External
  },

  chainlinkDaiUsdOracle: {
    artifactName: 'unknown',
    address: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
    category: AddressCategory.External
  },

  chainlinkDpiUsdOracle: {
    artifactName: 'unknown',
    address: '0xD2A593BF7594aCE1faD597adb697b5645d5edDB2',
    category: AddressCategory.External
  },

  chainlinkEthUsdOracle: {
    artifactName: 'unknown',
    address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
    category: AddressCategory.External
  },

  chainlinkOHMV2EthOracle: {
    artifactName: 'unknown',
    address: '0x9a72298ae3886221820b1c878d12d872087d3a23',
    category: AddressCategory.External
  },

  chainlinkStEthUsdOracle: {
    artifactName: 'unknown',
    address: '0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8',
    category: AddressCategory.External
  },

  chainlinkEurUsdOracle: {
    artifactName: 'unknown',
    address: '0xb49f677943bc038e9857d61e7d053caa2c1734c1',
    category: AddressCategory.External
  },

  chainlinkFeiEthOracle: {
    artifactName: 'unknown',
    address: '0x7F0D2c2838c6AC24443d13e23d99490017bDe370',
    category: AddressCategory.External
  },

  chainlinkRaiEthOracle: {
    artifactName: 'unknown',
    address: '0x4ad7B025127e89263242aB68F0f9c4E5C033B489',
    category: AddressCategory.External
  },

  chainlinkTribeEthOracle: {
    artifactName: 'unknown',
    address: '0x84a24deCA415Acc0c395872a9e6a63E27D6225c8',
    category: AddressCategory.External
  },

  communalFarm: {
    artifactName: 'unknown',
    address: '0x0639076265e9f88542C91DCdEda65127974A5CA5',
    category: AddressCategory.External
  },

  compoundDai: {
    artifactName: 'unknown',
    address: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    category: AddressCategory.External
  },

  compoundEth: {
    artifactName: 'unknown',
    address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
    category: AddressCategory.External
  },

  convexBooster: {
    artifactName: 'IConvexBooster',
    address: '0xF403C135812408BFbE8713b5A23a04b3D48AAE31',
    category: AddressCategory.External
  },

  convexD3poolRewards: {
    artifactName: 'IConvexBaseRewardPool',
    address: '0x329cb014b562d5d42927cfF0dEdF4c13ab0442EF',
    category: AddressCategory.External
  },

  cream: {
    artifactName: 'IERC20',
    address: '0x2ba592F78dB6436527729929AAf6c908497cB200',
    category: AddressCategory.External
  },

  creamFei: {
    artifactName: 'CErc20Delegator',
    address: '0x8C3B7a4320ba70f8239F83770c4015B5bc4e6F91',
    category: AddressCategory.External
  },

  crv: {
    artifactName: 'IERC20',
    address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
    category: AddressCategory.External
  },

  curve3crv: {
    artifactName: 'unknown',
    address: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490',
    category: AddressCategory.External
  },

  curve3pool: {
    artifactName: 'unknown',
    address: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
    category: AddressCategory.External
  },

  curveD3pool: {
    artifactName: 'ICurveStableSwap3',
    address: '0xBaaa1F5DbA42C3389bDbc2c9D2dE134F5cD0Dc89',
    category: AddressCategory.External
  },

  curveStethPool: {
    artifactName: 'IStableSwapSTETH',
    address: '0xDC24316b9AE028F1497c275EB9192a3Ea0f67022',
    category: AddressCategory.External
  },

  curveFei3crvMetapool: {
    artifactName: 'IERC20',
    address: '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655',
    category: AddressCategory.External
  },

  cvx: {
    artifactName: 'IERC20',
    address: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B',
    category: AddressCategory.External
  },

  dai: {
    artifactName: 'IERC20',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    category: AddressCategory.External
  },

  dpi: {
    artifactName: 'IERC20',
    address: '0x1494CA1F11D487c2bBe4543E90080AeBa4BA3C2b',
    category: AddressCategory.External
  },

  feiEthPair: {
    artifactName: 'IUniswapV2Pair',
    address: '0x94B0A3d511b6EcDb17eBF877278Ab030acb0A878',
    category: AddressCategory.External
  },

  feiLusdLBP: {
    artifactName: 'IWeightedPool',
    address: '0xede4efcc5492cf41ed3f0109d60bc0543cfad23a',
    category: AddressCategory.External
  },

  feiTribeLBP: {
    artifactName: 'IWeightedPool',
    address: '0xC1382FE6e17bCdBC3d35F73f5317fBF261EbeECD',
    category: AddressCategory.External
  },

  feiTribePair: {
    artifactName: 'IUniswapV2Pair',
    address: '0x9928e4046d7c6513326cCeA028cD3e7a91c7590A',
    category: AddressCategory.External
  },

  fuseFeeDistributor: {
    artifactName: 'IFuseFeeDistributor',
    address: '0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85',
    category: AddressCategory.External
  },

  aaveCompaniesMultisig: {
    artifactName: 'unknown',
    address: '0xe8d4D93D9728bD673b0197673a230F62255C7846',
    category: AddressCategory.External
  },

  aaveCompaniesDaiEscrowMultisig: {
    artifactName: 'unknown',
    address: '0xA27A83A2433EbEB9f658B4420074B454846e1C5B',
    category: AddressCategory.External
  },

  fuseMultisig: {
    artifactName: 'unknown',
    address: '0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F',
    category: AddressCategory.External
  },

  frax: {
    artifactName: 'IERC20',
    address: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    category: AddressCategory.External
  },

  gfxAddress: {
    artifactName: 'unknown',
    address: '0xA6E8772AF29B29B9202A073F8E36F447689BEEF6',
    category: AddressCategory.External
  },
  gohm: {
    artifactName: 'IERC20',
    address: '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f',
    category: AddressCategory.External
  },

  gUniFeiDaiLP: {
    artifactName: 'unknown',
    address: '0x3D1556e84783672f2a3bd187a592520291442539',
    category: AddressCategory.External
  },

  gUniFeiUsdcLP: {
    artifactName: 'unknown',
    address: '0xCf84a3dC12319531E3deBD48C86E68eAeAfF224a',
    category: AddressCategory.External
  },

  idleBestYield: {
    artifactName: 'IIdleToken',
    address: '0xb2d5cb72a621493fe83c6885e4a776279be595bc',
    category: AddressCategory.External
  },

  idleTranches: {
    artifactName: 'IERC20',
    address: '0x9ce3a740df498646939bcbb213a66bbfa1440af6',
    category: AddressCategory.External
  },

  idleTranchesMinter: {
    artifactName: 'IIdleTrancheMinter',
    address: '0x77648A2661687ef3B05214d824503F6717311596',
    category: AddressCategory.External
  },

  hypervisor: {
    artifactName: 'IHypervisor',
    address: '0x704eCeCABe7855996CeDE5CeFa660Eccd3c01dBE',
    category: AddressCategory.External
  },

  index: {
    artifactName: 'IERC20',
    address: '0x0954906da0Bf32d5479e25f46056d22f08464cab',
    category: AddressCategory.External
  },

  kashiFeiDPI: {
    artifactName: 'IKashiPair',
    address: '0xf352773f1d4d69deb4de8d0578e43b993ee76e5d',
    category: AddressCategory.External
  },

  kashiFeiEth: {
    artifactName: 'IKashiPair',
    address: '0x329efec40f58054fc2f2cd4fd65809f2be3e11c8',
    category: AddressCategory.External
  },

  kashiFeiTribe: {
    artifactName: 'IKashiPair',
    address: '0x18c9584d9ce56a0f62f73f630f180d5278c873b7',
    category: AddressCategory.External
  },

  kashiFeiXSushi: {
    artifactName: 'IKashiPair',
    address: '0xf2028069cd88f75fcbcfe215c70fe6d77cb80b10',
    category: AddressCategory.External
  },

  liquityFusePoolLusd: {
    artifactName: 'CErc20Delegator',
    address: '0x5052BfbB7972E702179f3Eeed43B9213819b681a',
    category: AddressCategory.External
  },

  lqty: {
    artifactName: 'IERC20',
    address: '0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D',
    category: AddressCategory.External
  },

  lusd: {
    artifactName: 'IERC20',
    address: '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
    category: AddressCategory.External
  },

  masterKashi: {
    artifactName: 'unknown',
    address: '0x2cba6ab6574646badc84f0544d05059e57a5dc42',
    category: AddressCategory.External
  },

  multisend: {
    artifactName: 'IERC20Airdropper',
    address: '0x0B36b0F351ea8383506F596743a2DA7DCa204cc3',
    category: AddressCategory.External
  },

  rai: {
    artifactName: 'IERC20',
    address: '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919',
    category: AddressCategory.External
  },

  rariPool18Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x17b1A2E012cC4C31f83B90FF11d3942857664efc',
    category: AddressCategory.External
  },

  rariPool19Dpi: {
    artifactName: 'CErc20Delegator',
    address: '0xf06f65a6b7d2c401fcb8b3273d036d21fe2a5963',
    category: AddressCategory.External
  },

  rariPool19Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x04281F6715Dea6A8EbBCE143D86ea506FF326531',
    category: AddressCategory.External
  },

  rariPool22Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x653A32ED7AaA3DB37520125CDB45c17AdB3fdF01',
    category: AddressCategory.External
  },

  rariPool24Fei: {
    artifactName: 'CErc20Delegator',
    address: '0xb5A817E5354736eafe3A0C85620433eE75daA649',
    category: AddressCategory.External
  },

  rariPool25Fei: {
    artifactName: 'CErc20Delegator',
    address: '0xE468D0244D75b9b18B27cb682AeC3ab35d33663B',
    category: AddressCategory.External
  },

  rariPool26Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x38ee94FcF276Cee403f4645341f80e671d25b352',
    category: AddressCategory.External
  },

  rariPool27Fei: {
    artifactName: 'CErc20Delegator',
    address: '0xda396c927e3e6BEf77A98f372CE431b49EdEc43D',
    category: AddressCategory.External
  },

  rariPool6Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x185Ab80A77D362447415a5B347D7CD86ecaCC87C',
    category: AddressCategory.External
  },

  rariPool7Fei: {
    artifactName: 'CErc20Delegator',
    address: '0xE640E9beC342B86266B2bD79F3847e7958cb30C4',
    category: AddressCategory.External
  },

  rariPool9Fei: {
    artifactName: 'CErc20Delegator',
    address: '0x11A9F6ae6B36B4b820777D05B90Cd6CCCB1CDa31',
    category: AddressCategory.External
  },

  rariPool9Rai: {
    artifactName: 'CErc20Delegator',
    address: '0x752F119bD4Ee2342CE35E2351648d21962c7CAfE',
    category: AddressCategory.External
  },

  reptb: {
    artifactName: 'IERC20',
    address: '0x6c806eDDAd78A5505Fce27B18C6f859fc9739BEc',
    category: AddressCategory.External
  },

  rgt: {
    artifactName: 'ERC20VotesComp',
    address: '0xD291E7a03283640FDc51b121aC401383A46cC623',
    category: AddressCategory.External
  },

  saddleD4Pool: {
    artifactName: 'ISaddleSwap',
    address: '0xC69DDcd4DFeF25D8a793241834d4cc4b3668EAD6',
    category: AddressCategory.External
  },

  snapshotDelegateRegistry: {
    artifactName: 'DelegateRegistry',
    address: '0x469788fE6E9E9681C6ebF3bF78e7Fd26Fc015446',
    category: AddressCategory.External
  },

  stAAVE: {
    artifactName: 'IERC20',
    address: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
    category: AddressCategory.External
  },

  wstEth: {
    artifactName: 'IERC20',
    address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    category: AddressCategory.External
  },

  steth: {
    artifactName: 'IERC20',
    address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
    category: AddressCategory.External
  },

  sushiswapDpiFei: {
    artifactName: 'IUniswapV2Pair',
    address: '0x8775aE5e83BC5D926b6277579c2B0d40c7D9b528',
    category: AddressCategory.External
  },

  sushiswapRouter: {
    artifactName: 'unknown',
    address: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    category: AddressCategory.External
  },

  usd: {
    artifactName: 'unknown',
    address: '0x1111111111111111111111111111111111111111',
    category: AddressCategory.External
  },

  toke: {
    artifactName: 'IERC20',
    address: '0x2e9d63788249371f1dfc918a52f8d799f4a38c94',
    category: AddressCategory.External
  },

  tToke: {
    artifactName: 'IERC20',
    address: '0xa760e26aA76747020171fCF8BdA108dFdE8Eb930',
    category: AddressCategory.External
  },

  tWETH: {
    artifactName: 'IERC20',
    address: '0xD3D13a578a53685B4ac36A1Bab31912D2B2A2F36',
    category: AddressCategory.External
  },

  votiumBribe: {
    artifactName: 'IVotiumBribe',
    address: '0x19BBC3463Dd8d07f55438014b021Fb457EBD4595',
    category: AddressCategory.External
  },

  weth: {
    artifactName: 'WETH9',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    category: AddressCategory.External
  },

  orcaPodController: {
    artifactName: 'IControllerV1',
    address: '0x17FDC2Eaf2bd46f3e1052CCbccD9e6AD0296C42c',
    category: AddressCategory.External
  },

  orcaMemberToken: {
    artifactName: 'IMemberToken',
    address: '0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3',
    category: AddressCategory.External
  },

  orcaShipToken: {
    artifactName: 'unknown',
    address: '0x872EdeaD0c56930777A82978d4D7deAE3A2d1539',
    category: AddressCategory.External
  },

  tribeDev1Deployer: {
    artifactName: 'unknown',
    address: '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d',
    category: AddressCategory.External
  },

  tribeDev2Deployer: {
    artifactName: 'unknown',
    address: '0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77',
    category: AddressCategory.External
  },

  tribeDev3Deployer: {
    artifactName: 'unknown',
    address: '0xE2388f22cf5e328C197D6530663809cc0408a510',
    category: AddressCategory.External
  },

  tribeDev4Deployer: {
    artifactName: 'unknown',
    address: '0x5346b4ff3e924508d33d93f352d11e392a7a9d3b',
    category: AddressCategory.External
  },

  voltOTCEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x590eb1a809377f786a11fa1968eF8c15eB44A12F',
    category: AddressCategory.External
  },

  gOHM: {
    artifactName: 'IERC20',
    address: '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f',
    category: AddressCategory.External
  },
  makerUSDCPSM: {
    artifactName: 'IDSSPSM',
    address: '0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A',
    category: AddressCategory.External
  },
  makerUSDCGemJoin: {
    artifactName: 'unknown',
    address: '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
    categorty: AddressCategory.External
  },
  aura: {
    artifactName: 'IERC20',
    address: '0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF',
    category: AddressCategory.External
  },
  vlAura: {
    artifactName: 'IAuraLocker',
    address: '0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC',
    category: AddressCategory.External
  },
  auraMerkleDrop: {
    artifactName: 'IAuraMerkleDrop',
    address: '0x45EB1A004373b1D8457134A2C04a42d69D287724',
    category: AddressCategory.External
  },
  eswak: {
    artifactName: 'unknown',
    address: '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148',
    category: AddressCategory.External
  },
  fishy: {
    artifactName: 'unknown',
    address: '0x7D82675470B06453980b37880d81f6F254371FD3'
  },
  wintermute: {
    artifactName: 'unknown',
    address: '0x4B3F1048C55Faa0C0873e249E541139360501f2a',
    category: AddressCategory.External
  },
  olympusMultisig: {
    artifactName: 'unknown',
    address: '0x245cc372C84B3645Bf0Ffe6538620B04a217988B',
    category: AddressCategory.External
  },
  lusdCurveMetapool: {
    artifactName: 'ICurvePool',
    address: '0xEd279fDD11cA84bEef15AF5D39BB4d4bEE23F0cA',
    category: AddressCategory.External
  },

  chainlinkBALEthOracle: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x7261D245454Daa070C77B2a26eA192E3a4c8F655',
    category: AddressCategory.External
  },

  pcvGuardian: {
    artifactName: 'PCVGuardian',
    address: '0x02435948F84d7465FB71dE45ABa6098Fc6eC2993',
    category: AddressCategory.Deprecated
  },
  ratioPCVControllerV2: {
    artifactName: 'RatioPCVControllerV2',
    address: '0x221fff24FB66dA3c722c7C5B856956a6a30C0179',
    category: AddressCategory.Deprecated
  },
  nopeDAO: {
    artifactName: 'NopeDAO',
    address: '0x6C7aF43Ce97686e0C8AcbBc03b2E4f313c0394C7',
    category: AddressCategory.Deprecated
  },

  balancerDepositBalWeth: {
    artifactName: 'BalancerPCVDepositWeightedPool',
    address: '0xcd1Ac0014E2ebd972f40f24dF1694e6F528B2fD4',
    category: AddressCategory.Deprecated
  },

  balancerLensVeBalBal: {
    artifactName: 'BalancerPool2Lens',
    address: '0x8cbA3149b95084A61bBAb9e01110b0fB92C9a289',
    category: AddressCategory.Deprecated
  },

  balancerLensVeBalWeth: {
    artifactName: 'BalancerPool2Lens',
    address: '0xD8Eb546726d449fC1dEd06DFeCa800A2fa8bB930',
    category: AddressCategory.Deprecated
  },

  pcvSentinel: {
    artifactName: 'PCVSentinel',
    address: '0xC297705Acf50134d256187c754B92FA37826C019',
    category: AddressCategory.Deprecated
  },

  // Use to call implementation
  balancerGaugeStakerImpl: {
    // v1 BalancerGaugeStaker
    artifactName: 'BalancerGaugeStaker',
    address: '0xF53E251352683155898295569d77B8506bA00d80',
    category: AddressCategory.Deprecated
  },

  ethToDaiLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0xf7991f4698ffb6716982aec7f78964dd731c4a54',
    category: AddressCategory.Deprecated
  },

  weightedBalancerPoolManagerBase: {
    artifactName: 'WeightedBalancerPoolManagerBase',
    address: '0x75b984d8Ad22007923B03b5D40daA1917EF35313',
    category: AddressCategory.Deprecated
  },

  veBalDelegatorPCVDeposit: {
    artifactName: 'VeBalDelegatorPCVDeposit',
    address: '0xc4EAc760C2C631eE0b064E39888b89158ff808B2',
    category: AddressCategory.Deprecated
  },

  ethToDaiLensDai: {
    artifactName: 'BPTLens',
    address: '0xdF9Ff5c077d9F3427ade67AC2d27a864Be6F3187',
    category: AddressCategory.Deprecated
  },

  ethToDaiLensEth: {
    artifactName: 'BPTLens',
    address: '0xf24401F6992FaEAcbc5d6C6991db15B5F8364A1B',
    category: AddressCategory.Deprecated
  },

  balUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0xDe0407851AEC6F073A63D27C7D29805CCD59D3e0',
    category: AddressCategory.Deprecated
  },

  chainlinkStEthUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x011d15600671530C93818FdB1283E20748CB8c73',
    category: AddressCategory.Deprecated
  },

  chainlinkDaiUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x231aDa12E273eDf3fA54CbD90c5C1a73129D5bb9',
    category: AddressCategory.Deprecated
  },

  chainlinkLUSDOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xe61d11ec732d556A26fb863B192052BEa03eF8B5',
    category: AddressCategory.Deprecated
  },

  fuseWithdrawalGuard: {
    artifactName: 'FuseWithdrawalGuard',
    address: '0xd079ec4b442600a381eAc7E95662eB1b313cd113',
    category: AddressCategory.Deprecated
  },

  compositeStEthEthOracle: {
    artifactName: 'CompositeOracle',
    address: '0x16A26876835cB3b06D948E7D166835aB28896a71',
    category: AddressCategory.Deprecated
  },

  chainlinkEthUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xCd3c40AE1256922BA16C7872229385E20Bc8351e',
    category: AddressCategory.Deprecated
  },

  chainlinkFeiEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x060Be7B51F78DFFd04749332fd306BA1228e7444',
    category: AddressCategory.Deprecated
  },

  chainlinkTribeEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x061118ccabF0c2c62f05a2e3C2bd4379c0C70079',
    category: AddressCategory.Deprecated
  },

  compositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x8721f9EAba0B9081069970bCBce38763D3D4f28E',
    category: AddressCategory.Deprecated
  },

  tribeUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0xD7B8207f8644ee5cc60095023a8fcb8BdCF54732',
    category: AddressCategory.Deprecated
  },
  lusdToDaiSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0x09d26e0D6e40b285854C964FF8Dd672b524E235c',
    category: AddressCategory.Deprecated
  },
  optimisticMultisig: {
    artifactName: 'unknown',
    address: '0x35ED000468f397AA943009bD60cc6d2d9a7d32fF',
    category: AddressCategory.Deprecated
  },

  optimisticTimelock: {
    artifactName: 'OptimisticTimelock',
    address: '0xbC9C084a12678ef5B516561df902fdc426d95483',
    category: AddressCategory.Deprecated
  },

  tribalCouncilSafe: {
    artifactName: 'unknown',
    address: '0x2EC598d8e3DF35E5D6F13AE2f05a7bB2704e92Ea',
    category: AddressCategory.Deprecated
  },
  tribeReserveStabilizer: {
    artifactName: 'TribeReserveStabilizer',
    address: '0xE1A468418f4D8D3F070A06d49b3575A9562b6CfD',
    category: AddressCategory.Deprecated
  },
  balancerLensBpt30Fei70Weth: {
    artifactName: 'BalancerPool2Lens',
    address: '0x8465E7CFA63Aa6682531C7a34141966318aC5178',
    category: AddressCategory.Deprecated
  },
  balancerDepositFeiWeth: {
    artifactName: 'BalancerPCVDepositWeightedPool',
    address: '0xc5bb8F0253776beC6FF450c2B40f092f7e7f5b57',
    category: AddressCategory.Deprecated
  },
  lusdToDaiLensDai: {
    artifactName: 'BPTLens',
    address: '0x49194B3a9330316dC24e806B06a276794e1116DD',
    category: AddressCategory.Deprecated
  },
  tribalCouncilTimelockFeiLens: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x4037a70152F4c88Ad40522f35BD4dDD17E6B2052',
    category: AddressCategory.Deprecated
  },
  lusdToDaiLensLusd: {
    artifactName: 'BPTLens',
    address: '0x35cA36B69a4169B6BF71E6b64a03C2B2A6834ad0',
    category: AddressCategory.Deprecated
  },
  wethHoldingPCVDeposit: {
    artifactName: 'ERC20HoldingPCVDeposit',
    address: '0xC6D675ca5217d39C3A5E366141060fC2D1ea2b82',
    category: AddressCategory.Deprecated
  },
  merkleRedeemerDripper: {
    artifactName: 'MerkleRedeemerDripper',
    address: '0xF681F42f53D98A9136D090A04b47318C6961a832',
    category: AddressCategory.Deprecated
  },
  maxFeiWithdrawalGuard: {
    artifactName: 'MaxFeiWithdrawalGuard',
    address: '0x2Ee70721909b9673C6f5029243804b98C12a1bF2',
    category: AddressCategory.Deprecated
  },

  fuseFixer: {
    artifactName: 'FuseFixer',
    address: '0xFE7547F583aAe1212e72e063Aac25057C06c4797',
    category: AddressCategory.Deprecated
  },

  pcvEquityMinter: {
    artifactName: 'PCVEquityMinter',
    address: '0x904Deb2Dac1EdfCBBb69b9c279aE5F75E57Cf5E9',
    category: AddressCategory.Deprecated
  },

  daiPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0x3e0f66c5687FF917809A3F7fA7096e1Bc409fB03',
    category: AddressCategory.Deprecated
  },

  angleDelegatorPCVDeposit: {
    artifactName: 'AngleDelegatorPCVDeposit',
    address: '0xb91F96b7C62fe4a2301219956Cc023fA7892F0C0',
    category: AddressCategory.Deprecated
  },

  podExecutorV2: {
    artifactName: 'PodExecutor',
    address: '0xC72e814314e79114354F1682111e07015826080D',
    category: AddressCategory.Deprecated
  },

  podAdminGateway: {
    artifactName: 'PodAdminGateway',
    address: '0xDDe8AA537c5b289De9cede462E6F0ec3a3a99e39',
    category: AddressCategory.Deprecated
  },

  podFactory: {
    artifactName: 'PodFactory',
    address: '0x4B2c8894D29d05dbc0d5A1CE23535be08d844819',
    category: AddressCategory.Deprecated
  },

  governanceMetadataRegistry: {
    artifactName: 'GovernanceMetadataRegistry',
    address: '0xd78Cd3AaE6168BE43B548877aAc68312B9df9AFb',
    category: AddressCategory.Deprecated
  },

  tribalCouncilTimelock: {
    artifactName: 'TimelockController',
    address: '0xe0C7DE94395B629860Cbb3c42995F300F56e6d7a',
    category: AddressCategory.Deprecated
  },

  roleBastion: {
    artifactName: 'RoleBastion',
    address: '0x8096314D9014EbB69Fc777ED3791DDE6FFbaFAed',
    category: AddressCategory.Deprecated
  },

  aaveFeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xFAc571b6054619053ac311dA8112939C9a374A85',
    category: AddressCategory.Deprecated
  },
  daiHoldingPCVDeposit: {
    artifactName: 'ERC20HoldingPCVDeposit',
    address: '0x8fFAe111Ab06F532a18418190129373D14570014',
    category: AddressCategory.Deprecated
  },

  rariPool79FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xb3A026B830796E43bfC8b135553A7573538aB341',
    category: AddressCategory.Deprecated
  },
  lusdHoldingPCVDeposit: {
    artifactName: 'ERC20HoldingPCVDeposit',
    address: '0x4378De2F2991Fbed6616b34AC7727E7653713712',
    category: AddressCategory.Deprecated
  },
  compoundFeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xB80B3dc4F8B30589477b2bA0e4EF2b8224bDf0a5',
    category: AddressCategory.Deprecated
  },

  aaveFeiPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0xaFBd7Bd91B4c1Dd289EE47a4F030FBeDfa7ABc12',
    category: AddressCategory.Deprecated
  },

  indexDelegator: {
    artifactName: 'SnapshotDelegatorPCVDeposit',
    address: '0x0ee81df08B20e4f9E0F534e50da437D24491c4ee',
    category: AddressCategory.Deprecated
  },
  indexOtcEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x574a9a9EeD5A3bE02bD35255e7E8625fE6824a02',
    category: AddressCategory.Deprecated
  },

  rariPool22FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x7CeBaB7b4B4399343f6D0D36B550EE097F60d7fE',
    category: AddressCategory.Deprecated
  },

  rariPool128FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x02101960B3B317839254a17ba54a811A087cB3A0',
    category: AddressCategory.Deprecated
  },

  rariPool8FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9',
    category: AddressCategory.Deprecated
  },

  rariPool79FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x76dFcf06E7D7B8248094DC319b284fB244f06309',
    category: AddressCategory.Deprecated
  },

  gaugeLensBpt30Fei70WethGauge: {
    artifactName: 'CurveGaugeLens',
    address: '0xd9fc482E0Af8fd509699f1074d72D137cAC94D5B',
    category: AddressCategory.Deprecated
  },

  convexPoolPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x525eA5983A2e02abA8aA0BE7D15Cd73150812379',
    category: AddressCategory.Deprecated
  },

  compoundFeiPCVDeposit: {
    artifactName: 'PCVDeposit',
    address: '0xe1f2a7342459b54fbfea9f40695cdd46efadeeee',
    category: AddressCategory.Deprecated
  },

  laTribuFeiTimelock: {
    artifactName: 'LinearTokenTimelock',
    address: '0xdb02630ed4f4994414122894B5082dc6D88a4ED4',
    category: AddressCategory.Deprecated
  },
  laTribuTribeTimelock: {
    artifactName: 'QuadraticTokenTimelock',
    address: '0x552b8A441E945D021D29ae58B6Ae3dE96da75A05',
    category: AddressCategory.Deprecated
  },
  chainlinkCREAMEthOracle: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xDE02522cDc4959117fe839a7326D80F9858f383C',
    category: AddressCategory.Deprecated
  },

  chainlinkDpiUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xB594d2bd55Ede471e16b92AE6F7651648DA871c3',
    category: AddressCategory.Deprecated
  },
  chainlinkEurUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xFb3a062236A7E08b572F17bc9Ad2bBc2becB87b1',
    category: AddressCategory.Deprecated
  },
  ethLidoPCVDeposit: {
    artifactName: 'EthLidoPCVDeposit',
    address: '0x6e5f2745C08249a190239763706473bE0B72816d',
    category: AddressCategory.Deprecated
  },
  daiFixedPricePSM: {
    artifactName: 'FixedPricePSM',
    address: '0x2A188F9EB761F70ECEa083bA6c2A40145078dfc2',
    category: AddressCategory.Deprecated
  },
  daiFixedPricePSMFeiSkimmer: {
    artifactName: 'FeiSkimmer',
    address: '0xe49B608663EeB89f1E3AbBe75744e5318F85029C',
    category: AddressCategory.Deprecated
  },
  chainlinkRaiEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x3d49573ee6aFCBDe606F8a1c2AA1C498048E7190',
    category: AddressCategory.Deprecated
  },

  chainlinkRaiUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xC7a950418eC90df99B1516F3d0276423bF46D4C2',
    category: AddressCategory.Deprecated
  },

  chainlinkRaiUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x392b1d29eDab680c5CA778D3A32b8284859BFBB0',
    category: AddressCategory.Deprecated
  },
  creamUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x2BDca027c7f57eD9AC1769Ba3a3D64600578bA49',
    category: AddressCategory.Deprecated
  },

  rariTurboFusePool: {
    artifactName: 'unknown',
    address: '0x081E7C60bCB8A2e7E43076a2988068c0a6e69e27',
    category: AddressCategory.Deprecated
  },

  turboAdmin: {
    artifactName: 'unknown',
    address: '0x18413D61b335D2F46235E9E1256Fd5ec8AD03757',
    category: AddressCategory.Deprecated
  },

  turboBooster: {
    artifactName: 'unknown',
    address: '0xf6c7f4a90b10c9eaaf2a6676ce81fe8673453e72',
    category: AddressCategory.Deprecated
  },

  turboMaster: {
    artifactName: 'unknown',
    address: '0xf2e513d3b4171bb115cb9ffc45555217fbbbd00c',
    category: AddressCategory.Deprecated
  },
  fuseERC4626Pool8Fei: {
    artifactName: 'unknown',
    address: '0xf486608dbc7dd0eb80e4b9fa0fdb03e40f414030',
    category: AddressCategory.Deprecated
  },
  fuseERC4626Pool18Fei: {
    artifactName: 'unknown',
    address: '0x0a00F781508a2E3FF5C6Aa80DF97dAebd0fFC259',
    category: AddressCategory.Deprecated
  },
  noFeeFeiTribeLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0xC05FAF6C5C4bC1bD841AdFC92b3D3f20180F26E8',
    category: AddressCategory.Deprecated
  },

  compoundDaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xfDe7077AAEcDaf2C4B85261Aa858c96A7E737a61',
    category: AddressCategory.Deprecated
  },

  feiBuybackLensNoFee: {
    artifactName: 'BPTLens',
    address: '0x89DfBC12001b41985eFAbd7dFCae6a77B22E4Ec3',
    category: AddressCategory.Deprecated
  },

  compoundDaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xe0f73b8d76D2Ad33492F995af218b03564b8Ce20',
    category: AddressCategory.Deprecated
  },

  namedStaticPCVDepositWrapper: {
    artifactName: 'NamedStaticPCVDepositWrapper',
    address: '0x06dAcca04e201AD31393754E68dA04Dc14778Fa6',
    category: AddressCategory.Deprecated
  },

  uniswapFeiTribeLiquidityTimelock: {
    artifactName: 'FeiTribeLiquidityTimelockInterface',
    address: '0x7D809969f6A04777F0A87FF94B57E56078E5fE0F',
    category: AddressCategory.Deprecated
  },

  chainlinkOhmV2EthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xA67541733A5179977bED7d38F95b63b8c5398E18',
    category: AddressCategory.Deprecated
  },

  uniswapLiquidityRemover: {
    artifactName: 'UniswapLiquidityRemover',
    address: '0x378CFc826f9235587e50c1BcE0fA108AF5B9B7dA',
    category: AddressCategory.Deprecated
  },

  dpiToDaiLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0x05FD907528cf725C6F6d1D28E14619A313513Ba8',
    category: AddressCategory.Deprecated
  },
  optimisticMinter: {
    artifactName: 'OwnableTimedMinter',
    address: '0xE66c4De480Bd317054B5a3CF8E8689649d0728c9',
    category: AddressCategory.Deprecated
  },
  aaveEthPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0xb3D63876d95d3a5e591D4DE536dC410b97244086',
    category: AddressCategory.Deprecated
  },
  gOhmUSDOracle: {
    artifactName: 'CompositeOracle',
    address: '0x319BCE09E7E3e32dac08206129Df541F189A5Df8',
    category: AddressCategory.Deprecated
  },
  gOhmEthOracle: {
    artifactName: 'GOhmEthOracle',
    address: '0x49A7e453c164353ac2980ac05756a8C46B062293',
    category: AddressCategory.Deprecated
  },
  raiPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0x64d216dFbe31d0C88BBcAdfF51Ab2aD704A3aAd9',
    category: AddressCategory.Deprecated
  },
  lusdPSMFeiSkimmer: {
    artifactName: 'FeiSkimmer',
    address: '0xFc29429D8c8D80320C4AB454131f741F56239c2b',
    category: AddressCategory.Deprecated
  },
  lusdPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0x59fA1bB4fBd7fcB055476645F228f13ac14754a8',
    category: AddressCategory.Deprecated
  },
  collateralizationOracleKeeper: {
    artifactName: 'CollateralizationOracleKeeper',
    address: '0x62378C316a6161A613D02E11F65290aED79B3eD5',
    category: AddressCategory.Deprecated
  },
  opsOptimisticTimelock: {
    artifactName: 'OptimisticTimelock',
    address: '0x7DC26A320a9f70Db617e24B77aCA1D3DC48C5721',
    category: AddressCategory.Deprecated
  },
  lusdPSM: {
    artifactName: 'PegStabilityModule',
    address: '0xb0e731F036AdfDeC12da77c15aaB0F90E8e45A0e',
    category: AddressCategory.Deprecated
  },
  raiPriceBoundPSM: {
    artifactName: 'PriceBoundPSM',
    address: '0x5ddE9B4b14eDf59CB23c1d4579B279846998205e',
    category: AddressCategory.Deprecated
  },
  ethPSM: {
    artifactName: 'PegStabilityModule',
    address: '0x98E5F5706897074a4664DD3a32eB80242d6E694B',
    category: AddressCategory.Deprecated
  },
  ethPSMRouter: {
    artifactName: 'PSMRouter',
    address: '0xFA6a07f3551bF0ceE88D494780ce793AF452Cbca',
    category: AddressCategory.Deprecated
  },
  ethPSMFeiSkimmer: {
    artifactName: 'FeiSkimmer',
    address: '0xA8A25F8cbfC5053241aB6FA87b865755dcB5501F',
    category: AddressCategory.Deprecated
  },
  dpiToDaiLensDai: {
    artifactName: 'BPTLens',
    address: '0x3AA57FAf7114a9ebEbda73a997A35eAE06008A7B',
    category: AddressCategory.Deprecated
  },
  dpiToDaiLensDpi: {
    artifactName: 'BPTLens',
    address: '0xaDdB7eBdCA3fa3b72D2e57c8e660C90ec00af7Cc',
    category: AddressCategory.Deprecated
  },
  agEurUniswapPCVDeposit: {
    artifactName: 'UniswapPCVDeposit',
    address: '0xE8633C49AcE655EB4A8B720e6b12F09Bd3a97812',
    category: AddressCategory.Deprecated
  },
  bammDeposit: {
    artifactName: 'BAMMDeposit',
    address: '0x374628EBE7Ef6AcA0574e750B618097531A26Ff8',
    category: AddressCategory.Deprecated
  },
  d3poolConvexPCVDeposit: {
    artifactName: 'ConvexPCVDeposit',
    address: '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8',
    category: AddressCategory.Deprecated
  },
  d3poolCurvePCVDeposit: {
    artifactName: 'CurvePCVDepositPlainPool',
    address: '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24',
    category: AddressCategory.Deprecated
  },
  ethTokemakPCVDeposit: {
    artifactName: 'EthTokemakPCVDeposit',
    address: '0x0961d2a545e0c1201B313d14C57023682a546b9D',
    category: AddressCategory.Deprecated
  },
  rariPool7LusdPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x6026a1559CDd44a63C5CA9A078CC996a9eb68ABB',
    category: AddressCategory.Deprecated
  },
  uniswapPCVDeposit: {
    artifactName: 'UniswapPCVDeposit',
    address: '0x15958381E9E6dc98bD49655e36f524D2203a28bD',
    category: AddressCategory.Deprecated
  },
  aaveEthPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x43Ef03755991056681F01EE2182234eF6aF1f658',
    category: AddressCategory.Deprecated
  },
  compoundEthPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x0735e14D28eD395048d5Fa4a8dbe6e6EB9fc0470',
    category: AddressCategory.Deprecated
  },
  feiOATimelockWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7Eb88140af813294aEDce981b6aC08fcd139d408',
    category: AddressCategory.Deprecated
  },
  rariPool19FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7e39bBA9D0d967Ee55524fAe9e54900B02d9889a',
    category: AddressCategory.Deprecated
  },
  rariPool24FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x508f6fbd78B6569C29E9D75986a51558dE9E5865',
    category: AddressCategory.Deprecated
  },
  rariPool6FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7aA4b1558C3e219cFFFd6a356421C071F71966e7',
    category: AddressCategory.Deprecated
  },
  rariPool128FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xA62ddde8F799873E6FcdbB3aCBbA75da85D9dcdE',
    category: AddressCategory.Deprecated
  },
  rariPool22FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xa2BdbCb95d31C85BAE6f0FA42D55F65d609D94eE',
    category: AddressCategory.Deprecated
  },
  wethDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x5E9fA7d783A7F7d4626cE450C8Bd2EbBB26dfdB2',
    category: AddressCategory.Deprecated
  },
  agEurDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x485d23ce5725ecdE46ca9033012984D90b514FFd',
    category: AddressCategory.Deprecated
  },
  voltDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x564eFCe5c6873219a7FbE450187c23254E3d62a4',
    category: AddressCategory.Deprecated
  },
  uniswapLensAgEurUniswapGauge: {
    artifactName: 'UniswapLens',
    address: '0xD2554839c2e8a87Dd2CddD013EF828B6534aBC26',
    category: AddressCategory.Deprecated
  },
  aaveEthPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0x5B86887e171bAE0C2C826e87E34Df8D558C079B9',
    category: AddressCategory.Deprecated
  },
  compoundEthPCVDeposit: {
    artifactName: 'EthCompoundPCVDeposit',
    address: '0x4fCB1435fD42CE7ce7Af3cB2e98289F79d2962b3',
    category: AddressCategory.Deprecated
  },
  rariPool24FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x1434F99EDB2bD03DECCCFe21288767b8324B7403',
    category: AddressCategory.Deprecated
  },
  rariPool19FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xD6960adba53212bBE96E54a7AFeDA2066437D000',
    category: AddressCategory.Deprecated
  },
  rariPool6FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xB51f09B6F103D697dc5d64DC904Ad6a2Dad39987',
    category: AddressCategory.Deprecated
  },
  agEurAngleUniswapPCVDeposit: {
    artifactName: 'AngleUniswapPCVDeposit',
    address: '0x7AC2Ab8143634419c5bc230A9f9955C3e29f64Ef',
    category: AddressCategory.Deprecated
  },
  gaugeLensAgEurUniswapGauge: {
    artifactName: 'AngleGaugeLens',
    address: '0x10f59bd0a100bcAD86CaB39751797D952eE1f76f',
    category: AddressCategory.Deprecated
  },
  collateralizationOracleGuardian: {
    artifactName: 'CollateralizationOracleGuardian',
    address: '0x81De6bA8df84A4B679061952E171a27F096F3eAe',
    category: AddressCategory.Deprecated
  },
  collateralizationOracleWrapper: {
    artifactName: 'CollateralizationOracleWrapper',
    address: '0xd1866289B4Bd22D453fFF676760961e0898EE9BF',
    category: AddressCategory.Deprecated
  },
  collateralizationOracleWrapperImpl: {
    artifactName: 'CollateralizationOracleWrapper',
    address: '0x656aA9c9875eB089b11869d4730d6963D25E76ad',
    category: AddressCategory.Deprecated
  },
  turboFusePCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x2c47Fef515d2C70F2427706999E158533F7cF090',
    category: AddressCategory.Deprecated
  },
  aaveTribeIncentivesController: {
    artifactName: 'IAaveIncentivesController',
    address: '0xDee5c1662bBfF8f80f7c572D8091BF251b3B0dAB',
    category: AddressCategory.Deprecated
  },
  aaveTribeIncentivesControllerImpl: {
    artifactName: 'IAaveIncentivesController',
    address: '0xFF865335401F12B88fa3FF5A3a51685A7f224191',
    category: AddressCategory.Deprecated
  },
  erc20Dripper: {
    artifactName: 'ERC20Dripper',
    address: '0x3Fe0EAD3500e767F0F8bC2d3B5AF7755B1b21A6a',
    category: AddressCategory.Deprecated
  },
  rariRewardsDistributorDelegate: {
    artifactName: 'IRewardsDistributorAdmin',
    address: '0x220f93183a69d1598e8405310cB361CFF504146F',
    category: AddressCategory.Deprecated
  },
  rariRewardsDistributorDelegator: {
    artifactName: 'IRewardsDistributorDelegator',
    address: '0x73F16f0c0Cd1A078A54894974C5C054D8dC1A3d7',
    category: AddressCategory.Deprecated
  },
  tribalChief: {
    artifactName: 'TribalChief',
    address: '0x9e1076cC0d19F9B0b8019F384B0a29E48Ee46f7f',
    category: AddressCategory.Deprecated
  },
  tribalChiefImpl: {
    artifactName: 'TribalChief',
    address: '0x2d91362e8bcAA8826b482B531dcb170FC9d17777',
    category: AddressCategory.Deprecated
  },
  votiumBriber3Crvpool: {
    artifactName: 'VotiumBriber',
    address: '0x8B6A295a35171E2F05B1579E485017B999810dcb',
    category: AddressCategory.Deprecated
  },
  voltHoldingPCVDeposit: {
    artifactName: 'ERC20HoldingPCVDeposit',
    address: '0xBDC01c9743989429df9a4Fe24c908D87e462AbC1',
    category: AddressCategory.Deprecated
  },
  voltCore: {
    artifactName: 'Core',
    address: '0xEC7AD284f7Ad256b64c6E69b84Eb0F48f42e8196',
    category: AddressCategory.Deprecated
  },
  voltFeiSwapContract: {
    artifactName: 'OtcEscrow',
    address: '0xeF152E462B59940616E667E801762dA9F2AF97b9',
    category: AddressCategory.Deprecated
  },
  voltOraclePassthrough: {
    artifactName: 'IOracle',
    address: '0x84dc71500D504163A87756dB6368CC8bB654592f',
    category: AddressCategory.Deprecated
  },
  voltOracle: {
    artifactName: 'CompositeOracle',
    address: '0x8A1f9707AbeE2102Da45a2392f2F992BA22Ff446',
    category: AddressCategory.Deprecated
  },
  tribeFeiLabsDel1: {
    artifactName: 'unknown',
    address: '0x107d1c9ef7a2ddb6a4aecfdcd6658355c7435a43',
    category: AddressCategory.External
  },
  tribeFeiLabsDel2: {
    artifactName: 'unknown',
    address: '0xe0ac4559739bd36f0913fb0a3f5bfc19bcbacd52',
    category: AddressCategory.External
  },
  tribeFeiLabsDel3: {
    artifactName: 'unknown',
    address: '0x486c33760ad3f6d9cf4a63493773e2b69635d602',
    category: AddressCategory.External
  },
  tribeFeiLabsDel4: {
    artifactName: 'unknown',
    address: '0x70b6ab736be7672c917a1ab11e67b5bc9fddeca9',
    category: AddressCategory.External
  },
  tribeFeiLabsDel5: {
    artifactName: 'unknown',
    address: '0xc8eefb8b3d50ca87da7f99a661720148acf97efa',
    category: AddressCategory.External
  },
  tribeFeiLabsDel6: {
    artifactName: 'unknown',
    address: '0x66b9d411e14fbc86424367b67933945fd7e40b11',
    category: AddressCategory.External
  },
  feiTribeLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0x16ef9601076d45e8cc564cDD91E5dF3Ae83dD3B3',
    category: AddressCategory.Deprecated
  },
  delayedPCVMoverWethUniToBal: {
    artifactName: 'DelayedPCVMover',
    address: '0x52B1D5BE5005002afD76193ADd3a827c18e2db99',
    category: AddressCategory.Deprecated
  },
  rariGovernanceTokenSushiSwapDistributor: {
    artifactName: 'RariGovernanceTokenUniswapDistributor',
    address: '0x1fa69a416bcf8572577d3949b742fbb0a9cd98c7',
    category: AddressCategory.Deprecated
  },
  pcvGuardianV1: {
    artifactName: 'PCVGuardian',
    address: '0x2D1b1b509B6432A73e3d798572f0648f6453a5D9',
    category: AddressCategory.Deprecated
  },
  daiPSM: {
    artifactName: 'PriceBoundPSM',
    address: '0x210300C158f95E1342fD008aE417ef68311c49C2',
    category: AddressCategory.Deprecated
  },
  aaveRaiPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0xd2174d78637a40448112aa6B30F9B19e6CF9d1F9',
    category: AddressCategory.Deprecated
  },
  ethLidoPCVDepositOld: {
    artifactName: 'EthLidoPCVDeposit',
    address: '0xac38ee05c0204a1e119c625d0a560d6731478880',
    category: AddressCategory.Deprecated
  },
  rariPool18FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x5A8CB4556e5D5935Af06beab8292905f48131479',
    category: AddressCategory.Deprecated
  },
  rariPool25FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xe1662531aA5de1DAD8ab5B5756b8F6c8F3C759Ca',
    category: AddressCategory.Deprecated
  },
  rariPool26FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xFdCc96967C86250f333cE52Ba706Ec2961c3302f',
    category: AddressCategory.Deprecated
  },
  rariPool27FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x91f50E3183a8CC30D2A981C3aFA85A2Bf6691c67',
    category: AddressCategory.Deprecated
  },
  rariPool19DpiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x3dD3d945C4253bAc5B4Cc326a001B7d3f9C4DD66',
    category: AddressCategory.Deprecated
  },
  rariPool7FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x74B235Fef146cDB5BE0D3786a9f3774674b3615E',
    category: AddressCategory.Deprecated
  },
  rariPool9FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xF2D8beE45f29A779cFB9F04ac233E703974a2C53',
    category: AddressCategory.Deprecated
  },
  rariPool9RaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9aAdFfe00eAe6d8e59bB4F7787C6b99388A6960D',
    category: AddressCategory.Deprecated
  },
  rariPool28FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xb0D5eBA35E1cecE568096064Ed68A49C6A24d961',
    category: AddressCategory.Deprecated
  },
  rariPool31FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x81DCB06eA4db474D1506Ca6275Ff7D870bA3A1Be',
    category: AddressCategory.Deprecated
  },
  rariPool72FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x4A5Af5A124E672C156241b76CAd4E41D09dd4883',
    category: AddressCategory.Deprecated
  },
  rariPool90FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x61d26126D2F8A44b41c1D8E1B1F276551DC8EEc6',
    category: AddressCategory.Deprecated
  },
  rariPool91FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x2296a2417D1f02d394ab22aF794a0f426eD53436',
    category: AddressCategory.Deprecated
  },
  gaugeLensBpt30Fei70WethGaugeOld: {
    artifactName: 'CurveGaugeLens',
    address: '0xa8E388a1f19f2b33Be8bf2cCeC43641C10b4D1e5',
    category: AddressCategory.Deprecated
  },
  balancerLensBpt30Fei70WethOld: {
    artifactName: 'BalancerPool2Lens',
    address: '0x673f7DFA863b611dE657759aEDE629b260F4E682',
    category: AddressCategory.Deprecated
  },
  dpiUniswapPCVDeposit: {
    artifactName: 'UniswapPCVDeposit',
    address: '0x902199755219A9f8209862d09F1891cfb34F59a3',
    category: AddressCategory.Deprecated
  },
  liquityFusePoolLusdPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x8C51E4532CC745cF3DFec5CEBd835D07E7BA1002',
    category: AddressCategory.Deprecated
  },
  aaveRaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x1267B39c93711Dd374DEAB15e0127e4adB259BE0',
    category: AddressCategory.Deprecated
  },
  creamDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x3a1838Ac9EcA864054bebB82C32455Dd7d7Fc89c',
    category: AddressCategory.Deprecated
  },
  ethLidoPCVDepositOldWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xA271fF86426c7fdAaAE72603e6Ce68c892d69ED7',
    category: AddressCategory.Deprecated
  },
  ethReserveStabilizerWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xB24570Bc46efDf97b4Aa7f008B4268005Eb7A27E',
    category: AddressCategory.Deprecated
  },
  rariPool146EthPCVDeposit: {
    artifactName: 'EthCompoundPCVDeposit',
    address: '0xC68412B72e68c30D4E6c0854b439CBBe957146e4',
    category: AddressCategory.Deprecated
  },
  rariPool8DaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9CC46aB5A714f7cd24C59f33C5769039B5872491',
    category: AddressCategory.Deprecated
  },
  rariPool8LusdPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xF846eE6E8EE9A6fbf51c7c65105CAbc041c048ad',
    category: AddressCategory.Deprecated
  },
  rariPool18FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x07F2DD7E6A78D96c08D0a8212f4097dCC129d629',
    category: AddressCategory.Deprecated
  },
  rariPool19DpiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x9a774a1B1208C323EDeD05E6Daf592E6E59cAa55',
    category: AddressCategory.Deprecated
  },
  rariPool25FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xB4FFD10C4C290Dc13E8e30BF186F1509001515fD',
    category: AddressCategory.Deprecated
  },
  rariPool26FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x82aebeE64a52180d8541eB601A8381e012A1eD04',
    category: AddressCategory.Deprecated
  },
  rariPool27FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xe2e35097638F0Ff2EeCA2EF70F352Be37431945f',
    category: AddressCategory.Deprecated
  },
  rariPool7FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xb13C755107301eBFeD6A93190aCdE09281b2f8A5',
    category: AddressCategory.Deprecated
  },
  rariPool8FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xD6598a23418c7FEf7c0Dc863265515B623B720F9',
    category: AddressCategory.Deprecated
  },
  rariPool9FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x96A657eE40A79A964c6b4eA551c895D98e885a75',
    category: AddressCategory.Deprecated
  },
  rariPool28FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x4E119714f625B2E82e5fB5A7E297978f020Ea51E',
    category: AddressCategory.Deprecated
  },
  rariPool31FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x05E2e93CFb0B53D36A3151ee727Bb581D4B918Ce',
    category: AddressCategory.Deprecated
  },
  rariPool90FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xec54148CbC47bFF8FCc5e04e5E8083aDb8aF9aD9',
    category: AddressCategory.Deprecated
  },
  rariPool91FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x5d073Fd34006E292583B7fC02B0f16ee8e29bcA5',
    category: AddressCategory.Deprecated
  },
  rariPool72FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x395B1Bc1800fa0ad48ae3876E66d4C10d297650c',
    category: AddressCategory.Deprecated
  },
  rariPool9RaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xCCe230c087F31032fc17621a2CF5E425A0b80C96',
    category: AddressCategory.Deprecated
  },
  dpiDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0xB250926E75b1CC6c53E77bb9426Baac14aB1e24c',
    category: AddressCategory.Deprecated
  },
  raiDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x7339cA4Ac94020b83A34f5edFA6e0F26986c434b',
    category: AddressCategory.Deprecated
  },
  autoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributor',
    address: '0x61be49dfbd869a601fea076e1a1379903e61a895',
    category: AddressCategory.Deprecated
  },
  d3AutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0x9Fd318C3F8f8583Fd40a0C2fba058fB7097E11d4',
    category: AddressCategory.Deprecated
  },
  fei3CrvAutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0x15f6D0d95aceCD7570e8Ff6128D953BC6aA3573C',
    category: AddressCategory.Deprecated
  },
  rewardsDistributorAdmin: {
    artifactName: 'RewardsDistributorAdmin',
    address: '0x4e979E8b136Cd7BdEBB83ea50a599C3BED1e15c0',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperBribeD3pool: {
    artifactName: 'StakingTokenWrapper',
    address: '0x462515dC7c21C728C8b7A777fDC89EEdAcF74537',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperFOXLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x3CD384ff1Fa1cbA8f06DF326AF4cbDA634aF94e8',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperGROLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x508629e8E0B96986Df4D0F1F60aadeF1d0FbaE96',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperKYLINLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0xFe266d143dB42a9835e2B1AB43B64a46278398cc',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperMStableLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x9B9ad20Cd99Cac3B536b94497A18346d66db0379',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperNEARLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x3b3591a4f7FD386E9987Eb48d898e29b57c30c47',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x6b018170311F3DA23c3fA62AFe1b2D0638522CCD',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperRari: {
    artifactName: 'StakingTokenWrapper',
    address: '0xd81Be1B9A7895C996704A8DDa794BbA4454EeB90',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperSYNLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x5Db85e395735Bb42eEB720Fe2EE69627d246e300',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperUMALaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x90B336dFF819b9e4b3D9A32cabdcAB0E92836065',
    category: AddressCategory.Deprecated
  },
  fei3CrvStakingtokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0x7013dc2e3c0D5ca3c0a6a66F6B5883eD203ac49c',
    category: AddressCategory.Deprecated
  },
  feiDaiStakingTokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0x601FFddACcAF7F05600D7E7561a51C745B8A2A3e',
    category: AddressCategory.Deprecated
  },
  feiUsdcStakingTokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0x0A0542Adf2fA8e85DD797697da537448b2e7c3EE',
    category: AddressCategory.Deprecated
  },
  feiDaiAutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0xE6Fef62A834D9b0BA1Da832769D6E99135dD2E0e',
    category: AddressCategory.Deprecated
  },
  feiUsdcAutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0x1126f1fA7Da556F8F82846223E3C2176B5631707',
    category: AddressCategory.Deprecated
  },
  fox: {
    artifactName: 'IERC20',
    address: '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d',
    category: AddressCategory.External
  },
  d3StakingTokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0xAa267d0A5A0A56Ef0F17bB4A28f85a5C4e0394F6',
    category: AddressCategory.Deprecated
  },
  stwBulkHarvest: {
    artifactName: 'STWBulkHarvest',
    address: '0x83433D925048d7e9D2D7Eec2A0Efbb4456Af2F93',
    category: AddressCategory.Deprecated
  },
  tribalChiefSyncV2: {
    artifactName: 'TribalChiefSyncV2',
    address: '0xb41c594f9a6a2E0882212598337AF8145f63731b',
    category: AddressCategory.Deprecated
  },
  tribalChiefSyncExtension: {
    artifactName: 'TribalChiefSyncExtension',
    address: '0x7b834cA07f81d52bB52d98DaE560D1442b2d7dBa',
    category: AddressCategory.Deprecated
  },
  stakingTokenWrapperBribe3Crvpool: {
    artifactName: 'StakingTokenWrapper',
    address: '0xaC98807E5CC43f134b00E87349e4ea3eDf927961',
    category: AddressCategory.Deprecated
  },
  votiumBriberD3pool: {
    artifactName: 'VotiumBriber',
    address: '0x0BEC570466B466aB689Ad33F1Ce5238CA43C8003',
    category: AddressCategory.Deprecated
  },
  aavePassthroughETH: {
    artifactName: 'unknown', // AavePassthroughETH
    address: '0x126AD2B5341A30D8115C443B3158E7661e4faD26',
    category: AddressCategory.Deprecated
  },
  balDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x7E28BA7a2D52Af88242E588d868E927119BA45dB',
    category: AddressCategory.Deprecated
  },
  compoundPassthroughETH: {
    artifactName: 'unknown', // CompoundPassthroughETH
    address: '0xF56B0B80ea6E986364c50177d396b988C3e41094',
    category: AddressCategory.Deprecated
  },
  daiBondingCurve: {
    artifactName: 'unknown', // BondingCurve
    address: '0xC0afe0E649e32528666F993ce63822c3840e941a',
    category: AddressCategory.Deprecated
  },
  daiBondingCurveWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x2547d76E2447E67F29d6bFeE5d46FDd2183c88E4',
    category: AddressCategory.Deprecated
  },
  creamFeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x243C601CC5DaA3Ac250B14509804188347bd2aFB',
    category: AddressCategory.Deprecated
  },
  bondingCurve: {
    artifactName: 'unknown', // EthBondingCurve
    address: '0xB783c0E21763bEf9F2d04E6499abFbe23AdB7e1F',
    category: AddressCategory.Deprecated
  },
  compoundEthPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0xa84C8be28f3d560059339f06C6b6c5B23f53C58C',
    category: AddressCategory.Deprecated
  },
  ethReserveStabilizer: {
    artifactName: 'unknown', // EthReserveStabilizer
    address: '0x17305f0e18318994a57b494078CAC866A857F7b6',
    category: AddressCategory.Deprecated
  },
  creamFeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xFf419Bc27483edb94b7Ad5c97b7FaB5DB323c7E0',
    category: AddressCategory.Deprecated
  },
  daiPSMFeiSkimmer: {
    artifactName: 'FeiSkimmer',
    address: '0xf8Ca6c10a794C867497541F5b7A7f96ca2bCd1E8',
    category: AddressCategory.Deprecated
  },
  defiPulseOTC: {
    artifactName: 'unknown',
    address: '0x673d140eed36385cb784e279f8759f495c97cf03',
    category: AddressCategory.Deprecated
  },
  dpiBondingCurve: {
    artifactName: 'unknown', // BondingCurve
    address: '0xBf5721c5E1C370f6F1A3E21b3972E0AcE93A1E84',
    category: AddressCategory.Deprecated
  },
  dpiBondingCurveWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x60B63eF8f461355207fE1d8102dda938bbd8c3fB',
    category: AddressCategory.Deprecated
  },
  ethOTCEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x6Cfed416f0729d5754f13fDDf297789079208E2e',
    category: AddressCategory.Deprecated
  },
  ethPCVDripper: {
    artifactName: 'IPCVDeposit',
    address: '0xDa079A280FC3e33Eb11A78708B369D5Ca2da54fE',
    category: AddressCategory.Deprecated
  },
  feiBalOtcEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x7fB1f6Cb94f01Ba03d2af5cC13c4c1E74b9b9Ecc',
    category: AddressCategory.Deprecated
  },
  feiBuybackLens: {
    artifactName: 'BPTLens',
    address: '0x107460564896377BA6CdcC7516c7eAb65E32E360',
    category: AddressCategory.Deprecated
  },
  feiLusdLens: {
    artifactName: 'BPTLens',
    address: '0x1F05b337cB16CeA2a1C638Ba9b9571F0Cf4a5612',
    category: AddressCategory.Deprecated
  },
  feiLusdLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0x5fc76F8Fc3AF2b19D45AC841252dcE711ed448ff',
    category: AddressCategory.Deprecated
  },
  feiOTCEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x9B9fE1b732839a53948B02E5164c0A50fdf11e06',
    category: AddressCategory.Deprecated
  },
  feiRewardsDistributor: {
    artifactName: 'unknown', // IFeiRewardsDistributor
    address: '0xEf1a94AF192A88859EAF3F3D8C1B9705542174C5',
    category: AddressCategory.Deprecated
  },
  genesisGroup: {
    artifactName: 'unknown',
    address: '0xBFfB152b9392e38CdDc275D818a3Db7FE364596b',
    category: AddressCategory.Deprecated
  },
  governorAlpha: {
    artifactName: 'GovernorAlpha',
    address: '0xE087F94c3081e1832dC7a22B48c6f2b5fAaE579B',
    category: AddressCategory.Deprecated
  },
  governorAlphaBackup: {
    artifactName: 'GovernorAlpha',
    address: '0x4C895973334Af8E06fd6dA4f723Ac24A5f259e6B',
    category: AddressCategory.Deprecated
  },
  oldEthBondingCurve: {
    artifactName: 'unknown', // EthBondingCurve
    address: '0xe1578B4a32Eaefcd563a9E6d0dc02a4213f673B7',
    category: AddressCategory.Deprecated
  },
  oldEthReserveStabilizer: {
    artifactName: 'unknown', // EthReserveStabilizer
    address: '0xa08A721dFB595753FFf335636674D76C455B275C',
    category: AddressCategory.Deprecated
  },
  ratioPCVController: {
    artifactName: 'unknown', // RatioPCVController
    address: '0xB1410aeCe2c65fE9e107c58b5aa32e91B18f0BC7',
    category: AddressCategory.Deprecated
  },
  oldRatioPCVController: {
    artifactName: 'unknown', // RatioPCVController
    address: '0xfC1aD6eb84351597cD3b9B65179633697d65B920',
    category: AddressCategory.Deprecated
  },
  raiBondingCurve: {
    artifactName: 'unknown', // BondingCurve
    address: '0x25d60212D47Dd8F6Ff0469367E4c6C98Cd3411A5',
    category: AddressCategory.Deprecated
  },
  raiBondingCurveWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xc42e155788f9f599Fd437C7455F63810A395a81f',
    category: AddressCategory.Deprecated
  },
  staticPcvDepositWrapper: {
    artifactName: 'unknown', // StaticPCVDepositWrapper
    address: '0x8B41DcEfAe6064E6bc2A9B3ae20141d23EFD6cbd',
    category: AddressCategory.Deprecated
  },
  staticPcvDepositWrapper2: {
    artifactName: 'unknown', // StaticPCVDepositWrapper
    address: '0xe72EB93de743F819fe91277582d7d0Fa9bb9b023',
    category: AddressCategory.Deprecated
  },
  tribalChiefOptimisticTimelock: {
    artifactName: 'Timelock',
    address: '0x27Fae9E49AD955A24bB578B66Cdc962b5029fbA9',
    category: AddressCategory.Deprecated
  },
  tribalChiefSync: {
    artifactName: 'unknown', // TribalChiefSync
    address: '0x7A883825caA45fcbDcd76991C5972Baf1551aa3d',
    category: AddressCategory.Deprecated
  },
  tribeBalOtcEscrow: {
    artifactName: 'OtcEscrow',
    address: '0xfFdEe6b0261d70278f5A3093A375c282eF8266Db',
    category: AddressCategory.Deprecated
  },
  tribeOTCEscrow: {
    artifactName: 'OtcEscrow',
    address: '0xe2fE8041429e4bd51c40F92C6cDb699527171298',
    category: AddressCategory.Deprecated
  },
  tribeRagequit: {
    artifactName: 'TRIBERagequit',
    address: '0xE77d572F04904fFea40899FD907F7ADd6Ea5228A',
    category: AddressCategory.Deprecated
  },
  uniswapOracle: {
    artifactName: 'unknown', // UniswapOracle
    address: '0x087F35bd241e41Fc28E43f0E8C58d283DD55bD65',
    category: AddressCategory.Deprecated
  },
  uniswapPCVController: {
    artifactName: 'unknown',
    address: '0x0760dfe09bd6d04d0df9a60c51f01ecedceb5132',
    category: AddressCategory.Deprecated
  },
  uniswapRouter: {
    artifactName: 'unknown',
    address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    category: AddressCategory.Deprecated
  },
  convexPoolPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x1370CA8655C255948d6c6110066d78680601B7c2',
    category: AddressCategory.Deprecated
  },
  timelock: {
    artifactName: 'Timelock',
    address: '0x639572471f2f318464dc01066a56867130e45E25',
    category: AddressCategory.Deprecated
  },
  ohmEscrow: {
    artifactName: 'OtcEscrow',
    address: '0x14d2F529576d3a5451BfbA370408a899Bb5261a9',
    category: AddressCategory.Deprecated
  },
  ohmEscrowUnwind: {
    artifactName: 'OtcEscrow',
    address: '0x01e292c0fBe4C35aE3af981a37Af30ca86d5a712',
    category: AddressCategory.Deprecated
  },
  gOHMHoldingPCVDeposit: {
    artifactName: 'ERC20HoldingPCVDeposit',
    address: '0x2C9980fa0a1ABe4B0cc6263132d8EB41Db9B73Ba',
    category: AddressCategory.Deprecated
  },
  mergerGate: {
    artifactName: 'MergerGate',
    address: '0xC2d452A4Feb76B41659cd036D5746149B98453D6',
    category: AddressCategory.Deprecated
  },
  rariPool54FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9d28B8Cb17c3E25b6Cce17f88B259f75174b69f4',
    category: AddressCategory.Deprecated
  },
  reptbRedeemer: {
    artifactName: 'REPTbRedeemer',
    address: '0xfEa132A3B7B70089f3d58F04eC1D1C2F321ef660',
    category: AddressCategory.Deprecated
  },
  kashiRedeemer: {
    artifactName: 'KashiPCVRedeemer',
    address: '0x14a38801FcC8a20b6c26cBcF85B7231218633928',
    category: AddressCategory.Deprecated
  },
  idleTranchesRedeemer: {
    artifactName: 'IdleTranchePCVRedeemer',
    address: '0x4E2F5e67e0A7A9bbFc257CEB1586D56F20364077',
    category: AddressCategory.Deprecated
  },
  idleRedeemer: {
    artifactName: 'IdlePCVRedeemer',
    address: '0xBca1d1eC00581ad3033eB88D9F0206BB4B9D1b90',
    category: AddressCategory.Deprecated
  },
  idle: {
    artifactName: 'IERC20',
    address: '0x875773784Af8135eA0ef43b5a374AaD105c5D39e',
    category: AddressCategory.External
  },
  bbRedeemer: {
    artifactName: 'SmartYieldRedeemer',
    address: '0x2dC77678Be7F900e81c638b056F4835BB7203C96',
    category: AddressCategory.Deprecated
  },
  podExecutor: {
    artifactName: 'PodExecutor',
    address: '0x99d8b669F48A708f7C0373AF6CE31F0726ab6CaD',
    category: AddressCategory.Deprecated
  },
  clawbackVestingContractA: {
    artifactName: 'QuadraticTimelockedDelegator',
    address: '0x1b4948248E13dc6Ec2A8e2B5Baa5EB78739d9486',
    category: AddressCategory.Deprecated
  },
  clawbackVestingContractB: {
    artifactName: 'QuadraticTimelockedDelegator',
    address: '0xf2a5872a34E69101f5311A8196EFac8d7B79dcCd',
    category: AddressCategory.Deprecated
  },
  clawbackVestingContractC: {
    artifactName: 'QuadraticTimelockedDelegator',
    address: '0xba7182c1B6df04bB730f0008BddeD27fc7D13ea2',
    category: AddressCategory.Deprecated
  },
  clawbackVestingContractBeneficiary: {
    artifactName: 'unknown',
    address: '0x4bFa2625D50b68D622D1e71c82ba6Db99BA0d17F',
    category: AddressCategory.Deprecated
  },
  feiLabsVestingTimelock: {
    artifactName: 'TimelockedDelegator',
    address: '0x38afbf8128cc54323e216acde9516d281c4f1e5f',
    category: AddressCategory.Deprecated
  },

  pegExchanger: {
    artifactName: 'PegExchanger',
    address: '0xc09BB5ECf865e6f69Fe62A43c27f036A426909f7',
    category: AddressCategory.Deprecated
  },
  pegExchangerDripper: {
    artifactName: 'PegExchangerDripper',
    address: '0xC416EEe663ECa29cEB726241caDFFe6a77D61E2D',
    category: AddressCategory.Deprecated
  },
  newRariInfraFeiTimelock: {
    artifactName: 'LinearTokenTimelock',
    address: '0x5d39721BA1c734b395C2CAdbdeeC178F688F6ec9',
    category: AddressCategory.Deprecated
  },
  newRariInfraTribeTimelock: {
    artifactName: 'LinearTimelockedDelegator',
    address: '0x20bC8FE104fadED2D0aD9634D745f1488f9991eF',
    category: AddressCategory.Deprecated
  },

  angleEuroRedeemer: {
    artifactName: 'AngleEuroRedeemer',
    address: '0x05A842943a56720Ebecd2D5f1fb32E48dB25863C',
    category: AddressCategory.Deprecated
  },

  vlauraOtcHelper: {
    artifactName: 'ProxyOTCEscrow',
    address: '0x61A991153E3ff68844abcE91551e046e1BE6f764',
    category: AddressCategory.Deprecated
  },
  vlAuraDelegatorPCVDepositProxy: {
    artifactName: 'TransparentUpgradeableProxy', // actually a TransparentUpgradeableProxy
    address: '0xc44902C03093D52213d20E5b06a0Bda4D9Ce6524',
    category: AddressCategory.Deprecated
  },
  vlAuraDelegatorPCVDeposit: {
    artifactName: 'VlAuraDelegatorPCVDeposit', // actually a TransparentUpgradeableProxy
    address: '0xc44902C03093D52213d20E5b06a0Bda4D9Ce6524',
    category: AddressCategory.Deprecated
  },
  vlAuraDelegatorPCVDepositImplementation: {
    artifactName: 'VlAuraDelegatorPCVDeposit',
    address: '0x6A78a824BC61Abf70C6AC33c41d37206B22B575d',
    category: AddressCategory.Deprecated
  },
  vlAuraDelegatorPCVDepositImplementationOld: {
    // this was broken and upgraded in tip-118, setDelegate()
    // is performed in a separate call & not in initialize().
    artifactName: 'VlAuraDelegatorPCVDeposit',
    address: '0xEd47a9519F86a695A212B53B5EBff92aF41741b1',
    category: AddressCategory.Deprecated
  }
};

export type MainnetContractsType = typeof MainnetContractsConfig;
export type MainnetContractsEntryName = keyof MainnetContractsType;
export const MainnetContractsEntryNames = Object.keys(MainnetContractsConfig) as MainnetContractsEntryName[];
