// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IUniswapWrapper} from "../../oracle/uniswap/IUniswapWrapper.sol";
import {ICore} from "../../core/ICore.sol";
import {Decimal} from "../../oracle/IOracle.sol";

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

  // USDT-AVINOC (used to test decimals normalising)
  IUniswapV3Pool usdtAvinocPool = IUniswapV3Pool(0x2Eb8f5708f238B0A2588f044ade8DeA7221639ab);
  address usdt = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
  address avinoc = 0xF1cA9cb74685755965c7458528A36934Df52A3EF;


  function setUp() public {
    core = getCore();
    uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    // ---------------       Deploy DAI-USDC oracle      -------------------
    UniswapV3OracleWrapper.OracleConfig memory daiUsdOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
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
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
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
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
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
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
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
  }

  function testMismatchedPoolTokens() public {
    address incorrectPoolToken0 = address(0x3);
    address incorrectPoolToken1 = address(0x4);

    UniswapV3OracleWrapper.OracleConfig memory daiUsdOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
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

  // Note: These price tests themselves are not strict as price changes
  // Exact price is logged and checked manually against spot prices on Uniswap
  function testPriceForDaiUsdc() public {
    (Decimal.D256 memory price, bool valid) = daiOracle.read();
    console.log("dai price:", price.value / precision);
    assertTrue(valid);

    // Confirm DAI price is >0.90 and < 1.1
    assertGt(price.value, 9e17);
    assertLt(price.value, 1e18 + 1e17);
  }

  function testPriceForEthUsdc() public {
    (Decimal.D256 memory price, bool valid) = ethOracle.read();
    console.log("eth price:", price.value / precision);
    assertTrue(valid);

    assertGt(price.value, 2500e18);
    assertLt(price.value, 3200e18);
  }

  function testPriceForWbtcUsdc() public {
    (Decimal.D256 memory price, bool valid) = wbtcOracle.read();
    console.log("wbtc price:", price.value / precision);
    assertTrue(valid);

    assertGt(price.value, 40000e18);
    assertLt(price.value, 50000e18);
  }

  function testPriceForLowDecimalsFirst() public {
    (Decimal.D256 memory price, bool valid) = usdtAvinocOracle.read();
    console.log("usdt/avinoc price:", price.value);

    assertTrue(valid);
    assertGt(price.value, 2e18 + 5e17);
    assertLt(price.value, 3e18 + 5e17);
  }
}
