// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IUniswapWrapper} from "../../oracle/uniswap/IUniswapWrapper.sol";
import {Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";

import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";

import {getCore} from "../utils/fixtures/FeiFixture.sol";
import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";
import {Vm} from "../utils/Vm.sol";
import "hardhat/console.sol";

contract UniswapV3OracleIntegrationTest is DSTest, StdLib {
  ICore core;
    
  UniswapV3OracleWrapper private daiOracle;  
  UniswapV3OracleWrapper private ethOracle;  
  UniswapV3OracleWrapper private wbtcOracle;  
  UniswapV3OracleWrapper private usdtAvinocOracle;  
  UniswapV3OracleWrapper private feiOracle;  

  address private uniswapMathWrapper;
  Vm public constant vm = Vm(HEVM_ADDRESS);

  uint32 private twapPeriod = 10 minutes;
  uint256 private precision = 10**18;


  // DAI-USDC 
  IUniswapV3Pool daiUsdcPool = IUniswapV3Pool(0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168);
  address dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  // USDC-ETH
  IUniswapV3Pool usdcEthPool = IUniswapV3Pool(0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640);
  address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

  // WBTC-USDC
  IUniswapV3Pool wbtcUsdcPool = IUniswapV3Pool(0x99ac8cA7087fA4A2A1FB6357269965A2014ABc35);
  address wbtc = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;

  // USDT-AVINOC
  IUniswapV3Pool usdtAvinocPool = IUniswapV3Pool(0x2Eb8f5708f238B0A2588f044ade8DeA7221639ab);
  address usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address avinoc = 0xF1cA9cb74685755965c7458528A36934Df52A3EF;

  // USDC-FEI
  IUniswapV3Pool usdcFeiPool = IUniswapV3Pool(0xdf50Fbde8180c8785842C8E316EBe06F542D3443);
  address fei = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;



  function setUp() public {
    core = getCore();
    uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    // ---------------       Deploy DAI-USDC oracle      -------------------
    UniswapV3OracleWrapper.OracleConfig memory daiUsdOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minPoolLiquidity: daiUsdcPool.liquidity(),
      precision: precision
    });    
    
    daiOracle = new UniswapV3OracleWrapper(
      address(core),
      dai, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      usdc,
      uniswapMathWrapper,
      daiUsdOracleConfig
    );

    // ---------------       Deploy USDC-ETH oracle   -------------------
    UniswapV3OracleWrapper.OracleConfig memory usdcEthOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(usdcEthPool),
      minPoolLiquidity: usdcEthPool.liquidity(),
      precision: precision
    });  

    ethOracle = new UniswapV3OracleWrapper(
      address(core),
      weth, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      usdc, 
      uniswapMathWrapper,
      usdcEthOracleConfig
    );


    // ---------------       Deploy WBTC-USDC oracle   -------------------
    UniswapV3OracleWrapper.OracleConfig memory wbtcUsdcOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(wbtcUsdcPool),
      minPoolLiquidity: wbtcUsdcPool.liquidity(),
      precision: precision
    });  

    wbtcOracle = new UniswapV3OracleWrapper(
      address(core),
      wbtc, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      usdc,
      uniswapMathWrapper,
      wbtcUsdcOracleConfig
    );

    // ---------------       Deploy USDT-AVINOC oracle   -------------------
    UniswapV3OracleWrapper.OracleConfig memory usdtAvinocOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(usdtAvinocPool),
      minPoolLiquidity: usdtAvinocPool.liquidity(),
      precision: precision
    });  

    usdtAvinocOracle = new UniswapV3OracleWrapper(
      address(core),
      usdt, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      avinoc,
      uniswapMathWrapper,
      usdtAvinocOracleConfig
    ); 

    // ---------------       Deploy USDC-FEI oracle   -------------------
    UniswapV3OracleWrapper.OracleConfig memory usdcFeiOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(usdcFeiPool),
      minPoolLiquidity: usdcFeiPool.liquidity(),
      precision: precision
    });  

    feiOracle = new UniswapV3OracleWrapper(
      address(core),
      usdc, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      fei,
      uniswapMathWrapper,
      usdcFeiOracleConfig
    ); 
  }

  function testMismatchedPoolTokens() public {
    address incorrectPoolToken0 = address(0x3);
    address incorrectPoolToken1 = address(0x4);

    UniswapV3OracleWrapper.OracleConfig memory daiUsdOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minPoolLiquidity: daiUsdcPool.liquidity(),
      precision: precision
    });  


    vm.expectRevert(
      bytes("Incorrect pool for tokens")
    );
    daiOracle = new UniswapV3OracleWrapper(
      address(core),
      incorrectPoolToken0,
      incorrectPoolToken1,
      uniswapMathWrapper,
      daiUsdOracleConfig
    );
  }

  function testAddPoolSupport() public {
    uint32 highTwapPeriod = 4000;

    UniswapV3OracleWrapper.OracleConfig memory highTwapPeriodConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: highTwapPeriod,
      uniswapPool: address(daiUsdcPool),
      minPoolLiquidity: daiUsdcPool.liquidity(),
      precision: precision
    });  

    UniswapV3OracleWrapper highTwapOracle = new UniswapV3OracleWrapper(
      address(core),
      dai,
      usdc,
      uniswapMathWrapper,
      highTwapPeriodConfig
    );

    ( , , , , uint16 observationCardinalityNext, , ) = daiUsdcPool.slot0();

    uint32 meanBlockTime = highTwapOracle.meanBlockTime();
    uint16 expectedCardinalityForMaxTwapPeriod = uint16(highTwapPeriod / meanBlockTime) + uint16(10);
    assertEq(observationCardinalityNext, expectedCardinalityForMaxTwapPeriod);
  }

  /// @notice The below price tests themselves are not strict as price changes
  /// Exact price is logged and checked manually against spot prices on Uniswap
  
  /// @dev Each test is designed to test a different path in the price calculation logic.
  /// There are 4 possible paths that can be taken in the price calculations, depending on 
  /// whether the inversion factors (a) Invert price ratio, b) Invert decimals) are set
  /// The paths are:
  /// 1. Invert price ratio: True, Invert decimals: False
  /// 2. Invert price ratio: True, Invert decimals: True
  /// 3. Invert price ratio: False, Invert decimals: False
  /// 4. Invert price ratio: False, Invert decimals: True
  
  /// token0: usdc
  /// token1: weth
  /// inputTokenDecimals (weth): 18
  /// outputTokenDecimals (usdc): 6
  /// ----------  Path  --------------
  /// Invert price ratio: True, Invert decimals: False
  function testPriceForEthUsdc() public {
    (Decimal.D256 memory price, bool valid) = ethOracle.read();
    console.log("eth price:", price.value / precision);
    assertTrue(valid);

    assertGt(price.value, 2000e18);
    assertLt(price.value, 5000e18);
  }

  /// token0: fei
  /// token1: usdc
  /// inputTokenDecimals (usdc): 6
  /// outputTokenDecimals (fei): 18 
  /// ----------  Path  --------------
  /// Invert price ratio: True, Invert decimals: True
  function testPriceForFei() public {
    (Decimal.D256 memory price, bool valid) = feiOracle.read();
    console.log("fei price:", price.value);
    
    assertTrue(valid);
    // Confirm FEI price is >0.90 and < 1.1
    assertGt(price.value, 9e17);
    assertLt(price.value, 1e18 + 1e17);
  }


  /// token0: dai
  /// token1: usdc
  /// inputTokenDecimals (dai): 18
  /// outputTokenDecimals (usdc): 6
  /// ----------  Path  --------------
  /// Invert price ratio: False, Invert decimals: False
  function testPriceForDaiUsdc() public {
    (Decimal.D256 memory price, bool valid) = daiOracle.read();
    console.log("dai price:", price.value / precision);
    assertTrue(valid);

    // Confirm DAI price is >0.90 and < 1.1
    assertGt(price.value, 9e17);
    assertLt(price.value, 1e18 + 1e17);
  }

  /// token0: usdt
  /// token1: avinoc
  /// inputTokenDecimals (usdt): 6
  /// outputTokenDecimals (avinoc): 18
  /// ----------  Path  --------------
  /// Invert price ratio: False, Invert decimals: True
  function testPriceForUsdtAvinoc() public {
    (Decimal.D256 memory price, bool valid) = usdtAvinocOracle.read();
    console.log("usdt/avinoc price:", price.value);

    assertTrue(valid);
    assertGt(price.value, 2e18 + 5e17);
    assertLt(price.value, 3e18 + 5e17);
  }

  /// token0: wbtc
  /// token1: usdc
  /// inputTokenDecimals (wbtc): 8
  /// outputTokenDecimals (usdc): 6
  /// ----------  Path  --------------
  /// Invert price ratio: False, Invert decimals: False
  function testPriceForWbtcUsdc() public {
    (Decimal.D256 memory price, bool valid) = wbtcOracle.read();
    console.log("wbtc price:", price.value / precision);
    assertTrue(valid);

    assertGt(price.value, 40000e18);
    assertLt(price.value, 50000e18);
  }
}
