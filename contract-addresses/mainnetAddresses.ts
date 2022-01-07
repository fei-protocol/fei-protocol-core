import { MainnetAddresses, AddressCategory } from '../types/types'; // imported without custom path to allow docs to autogen without ts errors

const MainnetAddresses: MainnetAddresses = {
  core: {
    artifactName: AddressCategory.Core,
    address: '0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9',
    category: AddressCategory.Core
  },
  fei: {
    artifactName: 'Fei',
    address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
    category: AddressCategory.Core
  },
  feiTribeLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0x16ef9601076d45e8cc564cDD91E5dF3Ae83dD3B3',
    category: AddressCategory.Core
  },
  noFeeFeiTribeLBPSwapper: {
    artifactName: 'BalancerLBPSwapper',
    address: '0xC05FAF6C5C4bC1bD841AdFC92b3D3f20180F26E8',
    category: AddressCategory.Core
  },
  optimisticMinter: {
    artifactName: 'OwnableTimedMinter',
    address: '0xE66c4De480Bd317054B5a3CF8E8689649d0728c9',
    category: AddressCategory.Core
  },
  pcvEquityMinter: {
    artifactName: 'PCVEquityMinter',
    address: '0x904Deb2Dac1EdfCBBb69b9c279aE5F75E57Cf5E9',
    category: AddressCategory.Core
  },
  pcvGuardian: {
    artifactName: 'PCVGuardian',
    address: '0x2D1b1b509B6432A73e3d798572f0648f6453a5D9',
    category: AddressCategory.Core
  },
  proxyAdmin: {
    artifactName: 'ProxyAdmin',
    address: '0xf8c2b645988b7658E7748BA637fE25bdD46A704A',
    category: AddressCategory.Core
  },
  ratioPCVControllerV2: {
    artifactName: 'RatioPCVControllerV2',
    address: '0x221fff24FB66dA3c722c7C5B856956a6a30C0179',
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
  guardian: {
    artifactName: 'unknown',
    address: '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775',
    category: AddressCategory.Governance
  },
  optimisticMultisig: {
    artifactName: 'unknown',
    address: '0x35ED000468f397AA943009bD60cc6d2d9a7d32fF',
    category: AddressCategory.Governance
  },
  optimisticTimelock: {
    artifactName: 'OptimisticTimelock',
    address: '0xbC9C084a12678ef5B516561df902fdc426d95483',
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
  aaveEthPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0xb3D63876d95d3a5e591D4DE536dC410b97244086',
    category: AddressCategory.Peg
  },
  bondingCurve: {
    artifactName: 'EthBondingCurve',
    address: '0xB783c0E21763bEf9F2d04E6499abFbe23AdB7e1F',
    category: AddressCategory.Deprecated
  },
  compoundEthPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0xa84C8be28f3d560059339f06C6b6c5B23f53C58C',
    category: AddressCategory.Deprecated
  },
  daiPCVDripController: {
    artifactName: 'PCVDripController',
    address: '0x3e0f66c5687FF917809A3F7fA7096e1Bc409fB03',
    category: AddressCategory.Peg
  },
  daiPSM: {
    artifactName: 'PriceBoundPSM',
    address: '0x210300C158f95E1342fD008aE417ef68311c49C2',
    category: AddressCategory.Peg
  },
  ethPSM: {
    artifactName: 'EthPegStabilityModule',
    address: '0x98E5F5706897074a4664DD3a32eB80242d6E694B',
    category: AddressCategory.Peg
  },
  ethPSMRouter: {
    artifactName: 'PSMRouter',
    address: '0xFA6a07f3551bF0ceE88D494780ce793AF452Cbca',
    category: AddressCategory.Peg
  },
  ethReserveStabilizer: {
    artifactName: 'EthReserveStabilizer',
    address: '0x17305f0e18318994a57b494078CAC866A857F7b6',
    category: AddressCategory.Deprecated
  },
  tribeReserveStabilizer: {
    artifactName: 'TribeReserveStabilizer',
    address: '0xE1A468418f4D8D3F070A06d49b3575A9562b6CfD',
    category: AddressCategory.Peg
  },
  aaveEthPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0x5B86887e171bAE0C2C826e87E34Df8D558C079B9',
    category: AddressCategory.PCV_V1
  },
  aaveFeiPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0xaFBd7Bd91B4c1Dd289EE47a4F030FBeDfa7ABc12',
    category: AddressCategory.PCV_V1
  },
  aaveRaiPCVDeposit: {
    artifactName: 'AavePCVDeposit',
    address: '0xd2174d78637a40448112aa6B30F9B19e6CF9d1F9',
    category: AddressCategory.PCV_V1
  },
  compoundDaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xe0f73b8d76D2Ad33492F995af218b03564b8Ce20',
    category: AddressCategory.PCV_V1
  },
  compoundEthPCVDeposit: {
    artifactName: 'EthCompoundPCVDeposit',
    address: '0x4fCB1435fD42CE7ce7Af3cB2e98289F79d2962b3',
    category: AddressCategory.PCV_V1
  },
  ethLidoPCVDeposit: {
    artifactName: 'EthLidoPCVDeposit',
    address: '0xac38ee05c0204a1e119c625d0a560d6731478880',
    category: AddressCategory.PCV_V1
  },
  indexCoopFusePoolDpiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x3dD3d945C4253bAc5B4Cc326a001B7d3f9C4DD66',
    category: AddressCategory.PCV_V1
  },
  indexCoopFusePoolFeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xD6960adba53212bBE96E54a7AFeDA2066437D000',
    category: AddressCategory.PCV_V1
  },
  indexDelegator: {
    artifactName: 'SnapshotDelegatorPCVDeposit',
    address: '0x0ee81df08B20e4f9E0F534e50da437D24491c4ee',
    category: AddressCategory.PCV_V1
  },
  rariPool18FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x5A8CB4556e5D5935Af06beab8292905f48131479',
    category: AddressCategory.PCV_V1
  },
  rariPool24FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x1434F99EDB2bD03DECCCFe21288767b8324B7403',
    category: AddressCategory.PCV_V1
  },
  rariPool25FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xe1662531aA5de1DAD8ab5B5756b8F6c8F3C759Ca',
    category: AddressCategory.PCV_V1
  },
  rariPool26FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xFdCc96967C86250f333cE52Ba706Ec2961c3302f',
    category: AddressCategory.PCV_V1
  },
  rariPool27FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x91f50E3183a8CC30D2A981C3aFA85A2Bf6691c67',
    category: AddressCategory.PCV_V1
  },
  rariPool19DpiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x3dD3d945C4253bAc5B4Cc326a001B7d3f9C4DD66',
    category: AddressCategory.PCV_V1
  },
  rariPool19FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xD6960adba53212bBE96E54a7AFeDA2066437D000',
    category: AddressCategory.PCV_V1
  },
  rariPool6FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xB51f09B6F103D697dc5d64DC904Ad6a2Dad39987',
    category: AddressCategory.PCV_V1
  },
  rariPool7FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x74B235Fef146cDB5BE0D3786a9f3774674b3615E',
    category: AddressCategory.PCV_V1
  },
  rariPool8FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9',
    category: AddressCategory.PCV_V1
  },
  rariPool9FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xF2D8beE45f29A779cFB9F04ac233E703974a2C53',
    category: AddressCategory.PCV_V1
  },
  rariPool9RaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9aAdFfe00eAe6d8e59bB4F7787C6b99388A6960D',
    category: AddressCategory.PCV_V1
  },
  agEurAngleUniswapPCVDeposit: {
    artifactName: 'AngleUniswapPCVDeposit',
    address: '0x7AC2Ab8143634419c5bc230A9f9955C3e29f64Ef',
    category: AddressCategory.PCV
  },
  bammDeposit: {
    artifactName: 'BAMMDeposit',
    address: '0x374628EBE7Ef6AcA0574e750B618097531A26Ff8',
    category: AddressCategory.PCV
  },
  balancerDepositBalWeth: {
    artifactName: 'BalancerPCVDepositWeightedPool',
    address: '0xcd1Ac0014E2ebd972f40f24dF1694e6F528B2fD4',
    category: AddressCategory.PCV
  },
  d3poolConvexPCVDeposit: {
    artifactName: 'ConvexPCVDeposit',
    address: '0x5ae217dE26f6Ff5F481C6e10ec48b2cf2fc857C8',
    category: AddressCategory.PCV
  },
  d3poolCurvePCVDeposit: {
    artifactName: 'CurvePCVDepositPlainPool',
    address: '0x24F663c69Cd4B263cf5685A49013Ff5f1C898D24',
    category: AddressCategory.PCV
  },
  dpiUniswapPCVDeposit: {
    artifactName: 'UniswapPCVDeposit',
    address: '0x902199755219A9f8209862d09F1891cfb34F59a3',
    category: AddressCategory.PCV
  },
  ethTokemakPCVDeposit: {
    artifactName: 'EthTokemakPCVDeposit',
    address: '0x0961d2a545e0c1201B313d14C57023682a546b9D',
    category: AddressCategory.PCV
  },
  liquityFusePoolLusdPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x8C51E4532CC745cF3DFec5CEBd835D07E7BA1002',
    category: AddressCategory.PCV
  },
  rariPool28FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0xb0D5eBA35E1cecE568096064Ed68A49C6A24d961',
    category: AddressCategory.PCV
  },
  rariPool31FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x81DCB06eA4db474D1506Ca6275Ff7D870bA3A1Be',
    category: AddressCategory.PCV
  },
  rariPool72FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x4A5Af5A124E672C156241b76CAd4E41D09dd4883',
    category: AddressCategory.PCV
  },
  rariPool79FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x76dFcf06E7D7B8248094DC319b284fB244f06309',
    category: AddressCategory.PCV
  },
  rariPool7LusdPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x6026a1559CDd44a63C5CA9A078CC996a9eb68ABB',
    category: AddressCategory.PCV
  },
  rariPool90FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x61d26126D2F8A44b41c1D8E1B1F276551DC8EEc6',
    category: AddressCategory.PCV
  },
  rariPool91FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x2296a2417D1f02d394ab22aF794a0f426eD53436',
    category: AddressCategory.PCV
  },
  uniswapPCVDeposit: {
    artifactName: 'UniswapPCVDeposit',
    address: '0x15958381E9E6dc98bD49655e36f524D2203a28bD',
    category: AddressCategory.PCV
  },
  aaveEthPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x43Ef03755991056681F01EE2182234eF6aF1f658',
    category: AddressCategory.PCV
  },
  aaveFeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xFAc571b6054619053ac311dA8112939C9a374A85',
    category: AddressCategory.PCV
  },
  aaveRaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x1267B39c93711Dd374DEAB15e0127e4adB259BE0',
    category: AddressCategory.PCV
  },
  compoundDaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xfDe7077AAEcDaf2C4B85261Aa858c96A7E737a61',
    category: AddressCategory.PCV
  },
  compoundEthPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x0735e14D28eD395048d5Fa4a8dbe6e6EB9fc0470',
    category: AddressCategory.PCV
  },
  creamDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x3a1838Ac9EcA864054bebB82C32455Dd7d7Fc89c',
    category: AddressCategory.PCV
  },
  ethLidoPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xA271fF86426c7fdAaAE72603e6Ce68c892d69ED7',
    category: AddressCategory.PCV
  },
  ethReserveStabilizerWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xB24570Bc46efDf97b4Aa7f008B4268005Eb7A27E',
    category: AddressCategory.Deprecated
  },
  feiBuybackLensNoFee: {
    artifactName: 'BPTLens',
    address: '0x89DfBC12001b41985eFAbd7dFCae6a77B22E4Ec3',
    category: AddressCategory.PCV
  },
  feiOATimelockWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7Eb88140af813294aEDce981b6aC08fcd139d408',
    category: AddressCategory.PCV
  },
  rariPool18FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x07F2DD7E6A78D96c08D0a8212f4097dCC129d629',
    category: AddressCategory.PCV
  },
  rariPool19DpiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x9a774a1B1208C323EDeD05E6Daf592E6E59cAa55',
    category: AddressCategory.PCV
  },
  rariPool19FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7e39bBA9D0d967Ee55524fAe9e54900B02d9889a',
    category: AddressCategory.PCV
  },
  rariPool24FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x508f6fbd78B6569C29E9D75986a51558dE9E5865',
    category: AddressCategory.PCV
  },
  rariPool25FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xB4FFD10C4C290Dc13E8e30BF186F1509001515fD',
    category: AddressCategory.PCV
  },
  rariPool26FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x82aebeE64a52180d8541eB601A8381e012A1eD04',
    category: AddressCategory.PCV
  },
  rariPool27FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xe2e35097638F0Ff2EeCA2EF70F352Be37431945f',
    category: AddressCategory.PCV
  },
  rariPool6FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x7aA4b1558C3e219cFFFd6a356421C071F71966e7',
    category: AddressCategory.PCV
  },
  rariPool7FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xb13C755107301eBFeD6A93190aCdE09281b2f8A5',
    category: AddressCategory.PCV
  },
  rariPool8FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xD6598a23418c7FEf7c0Dc863265515B623B720F9',
    category: AddressCategory.PCV
  },
  rariPool9FeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0x96A657eE40A79A964c6b4eA551c895D98e885a75',
    category: AddressCategory.PCV
  },
  rariPool9RaiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xCCe230c087F31032fc17621a2CF5E425A0b80C96',
    category: AddressCategory.PCV
  },
  collateralizationOracle: {
    artifactName: 'CollateralizationOracle',
    address: '0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257',
    category: AddressCategory.Collateralization
  },
  collateralizationOracleGuardian: {
    artifactName: 'CollateralizationOracleGuardian',
    address: '0x81De6bA8df84A4B679061952E171a27F096F3eAe',
    category: AddressCategory.Collateralization
  },
  collateralizationOracleWrapper: {
    artifactName: 'CollateralizationOracleWrapper',
    address: '0xd1866289B4Bd22D453fFF676760961e0898EE9BF',
    category: AddressCategory.Collateralization
  },
  collateralizationOracleWrapperImpl: {
    artifactName: 'CollateralizationOracleWrapper',
    address: '0x656aA9c9875eB089b11869d4730d6963D25E76ad',
    category: AddressCategory.Collateralization
  },
  namedStaticPCVDepositWrapper: {
    artifactName: 'NamedStaticPCVDepositWrapper',
    address: '0x06dAcca04e201AD31393754E68dA04Dc14778Fa6',
    category: AddressCategory.Collateralization
  },
  balUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0xDe0407851AEC6F073A63D27C7D29805CCD59D3e0',
    category: AddressCategory.Oracle
  },
  chainlinkBALEthOracle: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x7261D245454Daa070C77B2a26eA192E3a4c8F655',
    category: AddressCategory.Oracle
  },
  chainlinkCREAMEthOracle: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xDE02522cDc4959117fe839a7326D80F9858f383C',
    category: AddressCategory.Oracle
  },
  chainlinkDaiUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x231aDa12E273eDf3fA54CbD90c5C1a73129D5bb9',
    category: AddressCategory.Oracle
  },
  chainlinkDpiUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xB594d2bd55Ede471e16b92AE6F7651648DA871c3',
    category: AddressCategory.Oracle
  },
  chainlinkEthUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xCd3c40AE1256922BA16C7872229385E20Bc8351e',
    category: AddressCategory.Oracle
  },
  chainlinkEurUsdOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xFb3a062236A7E08b572F17bc9Ad2bBc2becB87b1',
    category: AddressCategory.Oracle
  },
  chainlinkFeiEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x060Be7B51F78DFFd04749332fd306BA1228e7444',
    category: AddressCategory.Oracle
  },
  chainlinkLUSDOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0xe61d11ec732d556A26fb863B192052BEa03eF8B5',
    category: AddressCategory.Oracle
  },
  chainlinkRaiEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x3d49573ee6aFCBDe606F8a1c2AA1C498048E7190',
    category: AddressCategory.Oracle
  },
  chainlinkRaiUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x392b1d29eDab680c5CA778D3A32b8284859BFBB0',
    category: AddressCategory.Oracle
  },
  chainlinkTribeEthOracleWrapper: {
    artifactName: 'ChainlinkOracleWrapper',
    address: '0x061118ccabF0c2c62f05a2e3C2bd4379c0C70079',
    category: AddressCategory.Oracle
  },
  compositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x8721f9EAba0B9081069970bCBce38763D3D4f28E',
    category: AddressCategory.Oracle
  },
  creamUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0x2BDca027c7f57eD9AC1769Ba3a3D64600578bA49',
    category: AddressCategory.Oracle
  },
  oneConstantOracle: {
    artifactName: 'ConstantOracle',
    address: '0x2374800337c6BE8B935f96AA6c10b33f9F12Bd40',
    category: AddressCategory.Oracle
  },
  tribeUsdCompositeOracle: {
    artifactName: 'CompositeOracle',
    address: '0xD7B8207f8644ee5cc60095023a8fcb8BdCF54732',
    category: AddressCategory.Oracle
  },
  zeroConstantOracle: {
    artifactName: 'ConstantOracle',
    address: '0x43b99923CF06D6D9101110b595234670f73A4934',
    category: AddressCategory.Oracle
  },
  collateralizationOracleKeeper: {
    artifactName: 'CollateralizationOracleKeeper',
    address: '0x62378C316a6161A613D02E11F65290aED79B3eD5',
    category: AddressCategory.Keeper
  },
  aaveTribeIncentivesController: {
    artifactName: 'IAaveIncentivesController',
    address: '0xDee5c1662bBfF8f80f7c572D8091BF251b3B0dAB',
    category: AddressCategory.Rewards
  },
  aaveTribeIncentivesControllerImpl: {
    artifactName: 'IAaveIncentivesController',
    address: '0xFF865335401F12B88fa3FF5A3a51685A7f224191',
    category: AddressCategory.Rewards
  },
  autoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributor',
    address: '0x61be49dfbd869a601fea076e1a1379903e61a895',
    category: AddressCategory.Rewards
  },
  d3AutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0x9Fd318C3F8f8583Fd40a0C2fba058fB7097E11d4',
    category: AddressCategory.Rewards
  },
  fei3CrvAutoRewardsDistributor: {
    artifactName: 'AutoRewardsDistributorV2',
    address: '0x15f6D0d95aceCD7570e8Ff6128D953BC6aA3573C',
    category: AddressCategory.Rewards
  },
  erc20Dripper: {
    artifactName: 'ERC20Dripper',
    address: '0x3Fe0EAD3500e767F0F8bC2d3B5AF7755B1b21A6a',
    category: AddressCategory.Rewards
  },
  rariRewardsDistributorDelegate: {
    artifactName: 'IRewardsDistributorAdmin',
    address: '0x220f93183a69d1598e8405310cB361CFF504146F',
    category: AddressCategory.Rewards
  },
  rariRewardsDistributorDelegator: {
    artifactName: 'IRewardsDistributorAdmin',
    address: '0x73F16f0c0Cd1A078A54894974C5C054D8dC1A3d7',
    category: AddressCategory.Rewards
  },
  rewardsDistributorAdmin: {
    artifactName: 'RewardsDistributorAdmin',
    address: '0x4e979E8b136Cd7BdEBB83ea50a599C3BED1e15c0',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperBribeD3pool: {
    artifactName: 'StakingTokenWrapper',
    address: '0x462515dC7c21C728C8b7A777fDC89EEdAcF74537',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperFOXLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x3CD384ff1Fa1cbA8f06DF326AF4cbDA634aF94e8',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperGROLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x508629e8E0B96986Df4D0F1F60aadeF1d0FbaE96',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperKYLINLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0xFe266d143dB42a9835e2B1AB43B64a46278398cc',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperMStableLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x9B9ad20Cd99Cac3B536b94497A18346d66db0379',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperNEARLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x3b3591a4f7FD386E9987Eb48d898e29b57c30c47',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x6b018170311F3DA23c3fA62AFe1b2D0638522CCD',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperRari: {
    artifactName: 'StakingTokenWrapper',
    address: '0xd81Be1B9A7895C996704A8DDa794BbA4454EeB90',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperSYNLaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x5Db85e395735Bb42eEB720Fe2EE69627d246e300',
    category: AddressCategory.Rewards
  },
  stakingTokenWrapperUMALaaS: {
    artifactName: 'StakingTokenWrapper',
    address: '0x90B336dFF819b9e4b3D9A32cabdcAB0E92836065',
    category: AddressCategory.Rewards
  },
  fei3CrvStakingtokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0x7013dc2e3c0D5ca3c0a6a66F6B5883eD203ac49c',
    category: AddressCategory.Rewards
  },
  d3StakingTokenWrapper: {
    artifactName: 'StakingTokenWrapper',
    address: '0xAa267d0A5A0A56Ef0F17bB4A28f85a5C4e0394F6',
    category: AddressCategory.Rewards
  },
  stwBulkHarvest: {
    artifactName: 'STWBulkHarvest',
    address: '0x83433D925048d7e9D2D7Eec2A0Efbb4456Af2F93',
    category: AddressCategory.Rewards
  },
  tribalChief: {
    artifactName: 'TribalChief',
    address: '0x9e1076cC0d19F9B0b8019F384B0a29E48Ee46f7f',
    category: AddressCategory.Rewards
  },
  tribalChiefImpl: {
    artifactName: 'TribalChief',
    address: '0x2d91362e8bcAA8826b482B531dcb170FC9d17777',
    category: AddressCategory.Rewards
  },
  tribalChiefSyncV2: {
    artifactName: 'TribalChiefSyncV2',
    address: '0xb41c594f9a6a2E0882212598337AF8145f63731b',
    category: AddressCategory.Rewards
  },
  tribalChiefSyncExtension: {
    artifactName: 'TribalChiefSyncExtension',
    address: '0x7b834cA07f81d52bB52d98DaE560D1442b2d7dBa',
    category: AddressCategory.Rewards
  },
  votiumBriberD3pool: {
    artifactName: 'VotiumBriber',
    address: '0x0BEC570466B466aB689Ad33F1Ce5238CA43C8003',
    category: AddressCategory.Rewards
  },
  rariPool8Comptroller: {
    artifactName: 'Unitroller',
    address: '0xc54172e34046c1653d1920d40333dd358c7a1af4',
    category: AddressCategory.FeiRari
  },
  rariPool8MasterOracle: {
    artifactName: 'unknown',
    address: '0x4d10BC156FBaD2474a94f792fe0D6c3261469cdd',
    category: AddressCategory.FeiRari
  },
  curveLPTokenOracle: {
    artifactName: 'unknown',
    address: '0xa9f3faac3b8eDF7b3DCcFDBBf25033D6F5fc02F3',
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
  fuseGuardian: {
    artifactName: 'FuseGuardian',
    address: '0xc0c59A2d3F278445f27ed4a00E2727D6c677c43F',
    category: AddressCategory.FeiRari
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
  aFei: {
    artifactName: 'IERC20',
    address: '0x683923dB55Fead99A79Fa01A27EeC3cB19679cC3',
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
  angle: {
    artifactName: 'IERC20',
    address: '0x31429d1856ad1377a8a0079410b297e1a9e214c2',
    category: AddressCategory.External
  },
  angleAgEurFeiPool: {
    artifactName: 'IUniswapV2Pair',
    address: '0xF89CE5eD65737dA8440411544b0499c9FaD323B2',
    category: AddressCategory.External
  },
  anglePoolManager: {
    artifactName: 'IPoolManager',
    address: '0x53b981389Cfc5dCDA2DC2e903147B5DD0E985F44',
    category: AddressCategory.External
  },
  angleStableMaster: {
    artifactName: 'IStableMaster',
    address: '0x5adDc89785D75C86aB939E9e15bfBBb7Fc086A87',
    category: AddressCategory.External
  },
  angleStakingRewards: {
    artifactName: 'IStakingRewards',
    address: '0xBcb307F590972B1C3188b7916d2969Cf75309dc6',
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
  curve3Metapool: {
    artifactName: 'IERC20',
    address: '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655',
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
  curveMetapool: {
    artifactName: 'unknown',
    address: '0x06cb22615ba53e60d67bf6c341a0fd5e718e1655',
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
  fAAVE: {
    artifactName: 'IERC20',
    address: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
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
  gUniFeiDaiLP: {
    artifactName: 'unknown',
    address: '0x3D1556e84783672f2a3bd187a592520291442539',
    category: AddressCategory.External
  },
  index: {
    artifactName: 'IERC20',
    address: '0x0954906da0Bf32d5479e25f46056d22f08464cab',
    category: AddressCategory.External
  },
  indexCoopFusePoolDpi: {
    artifactName: 'CErc20Delegator',
    address: '0xf06f65a6b7d2c401fcb8b3273d036d21fe2a5963',
    category: AddressCategory.External
  },
  indexCoopFusePoolFei: {
    artifactName: 'CErc20Delegator',
    address: '0x04281F6715Dea6A8EbBCE143D86ea506FF326531',
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
  poolPartyFei: {
    artifactName: 'CErc20Delegator',
    address: '0x17b1A2E012cC4C31f83B90FF11d3942857664efc',
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
  reflexerStableAssetFusePoolRai: {
    artifactName: 'CErc20Delegator',
    address: '0x752F119bD4Ee2342CE35E2351648d21962c7CAfE',
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
    artifactName: 'IWETH',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    category: AddressCategory.External
  },
  wethERC20: {
    artifactName: 'IERC20',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    category: AddressCategory.External
  },
  aavePassthroughETH: {
    artifactName: 'AavePassthroughETH',
    address: '0x126AD2B5341A30D8115C443B3158E7661e4faD26',
    category: AddressCategory.Deprecated
  },
  aaveTribeIncentivesControllerProxy: {
    artifactName: 'TransparentUpgradeableProxy',
    address: '0xDee5c1662bBfF8f80f7c572D8091BF251b3B0dAB',
    category: AddressCategory.Deprecated
  },
  balDepositWrapper: {
    artifactName: 'ERC20PCVDepositWrapper',
    address: '0x7E28BA7a2D52Af88242E588d868E927119BA45dB',
    category: AddressCategory.Deprecated
  },
  compoundPassthroughETH: {
    artifactName: 'CompoundPassthroughETH',
    address: '0xF56B0B80ea6E986364c50177d396b988C3e41094',
    category: AddressCategory.Deprecated
  },
  coreV1: {
    artifactName: 'ICoreV1',
    address: '0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9',
    category: AddressCategory.Deprecated
  },
  daiBondingCurve: {
    artifactName: 'BondingCurve',
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
  creamFeiPCVDepositWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xFf419Bc27483edb94b7Ad5c97b7FaB5DB323c7E0',
    category: AddressCategory.Deprecated
  },
  defiPulseOTC: {
    artifactName: 'unknown',
    address: '0x673d140eed36385cb784e279f8759f495c97cf03',
    category: AddressCategory.Deprecated
  },
  dpiBondingCurve: {
    artifactName: 'BondingCurve',
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
    artifactName: 'IFeiRewardsDistributor',
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
  multisig: {
    artifactName: 'unknown',
    address: '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775',
    category: AddressCategory.Deprecated
  },
  oldEthBondingCurve: {
    artifactName: 'EthBondingCurve',
    address: '0xe1578B4a32Eaefcd563a9E6d0dc02a4213f673B7',
    category: AddressCategory.Deprecated
  },
  oldEthReserveStabilizer: {
    artifactName: 'EthReserveStabilizer',
    address: '0xa08A721dFB595753FFf335636674D76C455B275C',
    category: AddressCategory.Deprecated
  },
  poolPartyFeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x5A8CB4556e5D5935Af06beab8292905f48131479',
    category: AddressCategory.Deprecated
  },
  ratioPCVController: {
    artifactName: 'RatioPCVController',
    address: '0xB1410aeCe2c65fE9e107c58b5aa32e91B18f0BC7',
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
  oldRatioPCVController: {
    artifactName: 'RatioPCVController',
    address: '0xfC1aD6eb84351597cD3b9B65179633697d65B920',
    category: AddressCategory.Deprecated
  },
  raiBondingCurve: {
    artifactName: 'BondingCurve',
    address: '0x25d60212D47Dd8F6Ff0469367E4c6C98Cd3411A5',
    category: AddressCategory.Deprecated
  },
  raiBondingCurveWrapper: {
    artifactName: 'PCVDepositWrapper',
    address: '0xc42e155788f9f599Fd437C7455F63810A395a81f',
    category: AddressCategory.Deprecated
  },
  reflexerStableAssetFusePoolRaiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9aAdFfe00eAe6d8e59bB4F7787C6b99388A6960D',
    category: AddressCategory.Deprecated
  },
  staticPcvDepositWrapper: {
    artifactName: 'StaticPCVDepositWrapper',
    address: '0x8B41DcEfAe6064E6bc2A9B3ae20141d23EFD6cbd',
    category: AddressCategory.Deprecated
  },
  staticPcvDepositWrapper2: {
    artifactName: 'StaticPCVDepositWrapper',
    address: '0xe72EB93de743F819fe91277582d7d0Fa9bb9b023',
    category: AddressCategory.Deprecated
  },
  timelock: {
    artifactName: 'Timelock',
    address: '0x639572471f2f318464dc01066a56867130e45E25',
    category: AddressCategory.Deprecated
  },
  tribalChiefOptimisticMultisig: {
    artifactName: 'unknown',
    address: '0x35ED000468f397AA943009bD60cc6d2d9a7d32fF',
    category: AddressCategory.Deprecated
  },
  tribalChiefOptimisticTimelock: {
    artifactName: 'Timelock',
    address: '0x27Fae9E49AD955A24bB578B66Cdc962b5029fbA9',
    category: AddressCategory.Deprecated
  },
  tribalChiefSync: {
    artifactName: 'TribalChiefSync',
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
    artifactName: 'UniswapOracle',
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
  mergerGate: {
    artifactName: 'MergerGate',
    address: '0xC2d452A4Feb76B41659cd036D5746149B98453D6',
    category: AddressCategory.TBD
  },
  pegExchanger: {
    artifactName: 'PegExchanger',
    address: '0xc09BB5ECf865e6f69Fe62A43c27f036A426909f7',
    category: AddressCategory.TBD
  },
  pegExchangerDripper: {
    artifactName: 'PegExchangerDripper',
    address: '0xC416EEe663ECa29cEB726241caDFFe6a77D61E2D',
    category: AddressCategory.TBD
  },
  rariPool22FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x7CeBaB7b4B4399343f6D0D36B550EE097F60d7fE',
    category: AddressCategory.TBD
  },
  rariPool54FeiPCVDeposit: {
    artifactName: 'ERC20CompoundPCVDeposit',
    address: '0x9d28B8Cb17c3E25b6Cce17f88B259f75174b69f4',
    category: AddressCategory.TBD
  },
  tokeTokemakPCVDeposit: {
    artifactName: 'ERC20TokemakPCVDeposit',
    address: '0x45C8FaB07B64C78d03006591132Ac51DE82a4B22',
    category: AddressCategory.TBD
  }
};

export default MainnetAddresses;
