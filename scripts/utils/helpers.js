require('dotenv').config();

function check(flag, message) {
  if (flag) {
    console.log(`PASS: ${message}`);
  } else {
    throw Error(`FAIL: ${message}`);
  }
}

// The current version of the contracts in the repo uses readOracle as the api
// The old api was peg(), so the currently deployed contracts need manual calling until the upgrade
async function readOracle(oracleRef, web3) {
  const data = await web3.eth.call({to: oracleRef.address, data: web3.eth.abi.encodeFunctionSignature('peg()')});
  return (web3.eth.abi.decodeParameter({ Decimal: {value: 'uint256' }}, data))[0];
}

function getAddresses() {
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  let feiAddress;
  let ethUniswapPCVDepositAddress;
  let ethUniswapPCVControllerAddress;
  let oldEthUniswapPCVControllerAddress;
  let ethBondingCurveAddress;
  let ethPairAddress;
  let coreAddress;
  let timelockAddress;
  let rariPoolEightComptrollerAddress;
  let rariPoolEightFeiAddress;
  let rariPoolEightTribeAddress;
  let rariPoolEightEthAddress;
  let rariPoolEightDaiAddress;
  let proposerAddress;
  let voterAddress;
  let governorAlphaAddress;
  let feiEthPairAddress;
  let tribeReserveStabilizerAddress;
  let ethReserveStabilizerAddress;
  let ratioPCVControllerAddress;
  let pcvDripControllerAddress;
  let wethAddress;
  let uniswapRouterAddress;
  let uniswapOracleAddress;
  let chainlinkEthUsdOracleWrapperAddress;

  if (process.env.TESTNET_MODE) {
    feiAddress = process.env.RINKEBY_FEI;
    ethUniswapPCVDepositAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.RINKEBY_FEI_ETH_PAIR;
    coreAddress = process.env.RINKEBY_CORE;
    timelockAddress = process.env.RINKEBY_TIMELOCK;
    oldEthUniswapPCVControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER_OLD;
    ethUniswapPCVControllerAddress = process.env.RINKEBY_ETH_UNISWAP_PCV_CONTROLLER;
    rariPoolEightComptrollerAddress = process.env.RINKEBY_RARI_POOL_8_COMPTROLLER;
    rariPoolEightFeiAddress = process.env.RINKEBY_RARI_POOL_8_FEI;
    rariPoolEightTribeAddress = process.env.RINKEBY_RARI_POOL_8_TRIBE;
    rariPoolEightEthAddress = process.env.RINKEBY_RARI_POOL_8_ETH;
    rariPoolEightDaiAddress = process.env.RINKEBY_RARI_POOL_8_DAI;
    ethBondingCurveAddress = process.env.RINKEBY_ETH_BONDING_CURVE_ADDRESS;
    proposerAddress = process.env.RINKEBY_PROPOSER;
    voterAddress = process.env.RINKEBY_VOTER;
    governorAlphaAddress = process.env.RINKEBY_GOVERNOR_ALPHA;
    feiEthPairAddress = process.env.RINKEBY_FEI_ETH_PAIR;
    tribeReserveStabilizerAddress = process.env.RINKEBY_TRIBE_RESERVE_STABILIZER;
    ethReserveStabilizerAddress = process.env.RINKEBY_ETH_RESERVE_STABILIZER;
    ratioPCVControllerAddress = process.env.RINKEBY_RATIO_PCV_CONTROLLER;
    pcvDripControllerAddress = process.env.RINKEBY_PCV_DRIP_CONTROLLER;
    wethAddress = process.env.RINKEBY_WETH;
    uniswapOracleAddress = process.env.RINKEBY_UNISWAP_ORACLE;
    uniswapRouterAddress = process.env.RINKEBY_UNISWAP_ROUTER;
    chainlinkEthUsdOracleWrapperAddress = process.env.RINKEBY_ETH_USD_CHAINLINK_WRAPPER;
  } else {
    feiAddress = process.env.MAINNET_FEI;
    ethUniswapPCVDepositAddress = process.env.MAINNET_ETH_UNISWAP_PCV_DEPOSIT;
    ethPairAddress = process.env.MAINNET_FEI_ETH_PAIR;
    coreAddress = process.env.MAINNET_CORE;
    timelockAddress = process.env.MAINNET_TIMELOCK;
    oldEthUniswapPCVControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER_OLD;
    ethUniswapPCVControllerAddress = process.env.MAINNET_ETH_UNISWAP_PCV_CONTROLLER;
    rariPoolEightComptrollerAddress = process.env.MAINNET_RARI_POOL_8_COMPTROLLER;
    rariPoolEightFeiAddress = process.env.MAINNET_RARI_POOL_8_FEI;
    rariPoolEightTribeAddress = process.env.MAINNET_RARI_POOL_8_TRIBE;
    rariPoolEightEthAddress = process.env.MAINNET_RARI_POOL_8_ETH;
    rariPoolEightDaiAddress = process.env.MAINNET_RARI_POOL_8_DAI;
    ethBondingCurveAddress = process.env.MAINNET_ETH_BONDING_CURVE;
    proposerAddress = process.env.MAINNET_PROPOSER;
    voterAddress = process.env.MAINNET_VOTER;
    governorAlphaAddress = process.env.MAINNET_GOVERNOR_ALPHA;
    feiEthPairAddress = process.env.MAINNET_FEI_ETH_PAIR;
    tribeReserveStabilizerAddress = process.env.MAINNET_TRIBE_RESERVE_STABILIZER;
    ethReserveStabilizerAddress = process.env.MAINNET_ETH_RESERVE_STABILIZER;
    ratioPCVControllerAddress = process.env.MAINNET_RATIO_PCV_CONTROLLER;
    pcvDripControllerAddress = process.env.MAINNET_PCV_DRIP_CONTROLLER;
    wethAddress = process.env.MAINNET_WETH;
    uniswapOracleAddress = process.env.MAINNET_UNISWAP_ORACLE;
    uniswapRouterAddress = process.env.MAINNET_UNISWAP_ROUTER;
    chainlinkEthUsdOracleWrapperAddress = process.env.MAINNET_ETH_USD_CHAINLINK_WRAPPER;
  }

  return {
    zeroAddress,
    feiAddress,
    ethUniswapPCVDepositAddress,
    ethPairAddress,
    coreAddress,
    timelockAddress,
    oldEthUniswapPCVControllerAddress,
    ethUniswapPCVControllerAddress,
    rariPoolEightComptrollerAddress,
    rariPoolEightFeiAddress,
    rariPoolEightTribeAddress,
    rariPoolEightEthAddress,
    rariPoolEightDaiAddress,
    ethBondingCurveAddress,
    proposerAddress,
    voterAddress,
    governorAlphaAddress,
    feiEthPairAddress,
    tribeReserveStabilizerAddress,
    ethReserveStabilizerAddress,
    ratioPCVControllerAddress,
    pcvDripControllerAddress,
    wethAddress,
    uniswapRouterAddress,
    uniswapOracleAddress,
    chainlinkEthUsdOracleWrapperAddress
  };
}

module.exports = {
  check,
  getAddresses,
  readOracle
};
