// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IUniswapWrapper} from "../../oracle/uniswap/IUniswapWrapper.sol";
import {ICore} from "../../core/ICore.sol";
import {Decimal} from "../../oracle/IOracle.sol";

import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";

import {getCore} from "../utils/fixtures/Fei.sol";
import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";
import {Vm} from "../utils/Vm.sol";
import "hardhat/console.sol";

contract UniswapV3OracleIntegrationTest is DSTest, StdLib {
  ICore core;
    
  UniswapV3OracleWrapper private daiOracle;  
  UniswapV3OracleWrapper private ethOracle;  
  UniswapV3OracleWrapper private wbtcOracle;  

  address private uniswapMathWrapper;
  Vm public constant vm = Vm(HEVM_ADDRESS);

  uint32 private twapPeriod = 10 minutes;

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

  function setUp() public {
    core = getCore();
    uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    // ---------------       Deploy DAI-USDC oracle      -------------------
    UniswapV3OracleWrapper.OracleConfig memory daiUsdOracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
      minPoolLiquidity: daiUsdcPool.liquidity()
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
      minPoolLiquidity: usdcEthPool.liquidity()
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
      minPoolLiquidity: wbtcUsdcPool.liquidity()
    });  

    wbtcOracle = new UniswapV3OracleWrapper(
      address(core),
      wbtc, // Note, the order here matters. First token should be the input (i.e. PSM asset), not dollar tracker
      usdc,
      uniswapMathWrapper,
      wbtcUsdcOracleConfig
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
      minPoolLiquidity: daiUsdcPool.liquidity()
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

  function testZeroTwapPeriodPrice() public {
    console.log();
  }

  // Correct to some precision. Some accuracy being lost. 
  // Should be 1.0001, reports 1
  function testPriceIsCorrectForDaiUsdc() public {
    (Decimal.D256 memory price, bool valid) = daiOracle.read();
    console.log("dai price:", price.value);
    assertTrue(valid);

    // Confirm DAI price is >0.90 and < 1.1
    assertGt(price.value, 9e17);
    assertLt(price.value, 1e18 + 1e17);
  }

  // Incorrect
  function testPriceIsCorrectForEthUsdc() public {
    (Decimal.D256 memory price, bool valid) = ethOracle.read();
    console.log("eth price:", price.value);
    assertTrue(valid);

    assertGt(price.value, 2500e18);
    assertLt(price.value, 3200e18);
  }

  // Correct
  function testPriceIsCorrectForWbtcUsdc() public {
    (Decimal.D256 memory price, bool valid) = wbtcOracle.read();
    console.log("wbtc price:", price.value);
    assertTrue(valid);

    assertGt(price.value, 40000e18);
    assertLt(price.value, 50000e18);
  }
}
