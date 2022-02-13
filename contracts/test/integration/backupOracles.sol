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

contract UniswapV3OracleIntegrationTest is DSTest, StdLib {
  ICore core;
    
  UniswapV3OracleWrapper private oracle;  
  address private uniswapMathWrapper;
  Vm public constant vm = Vm(HEVM_ADDRESS);

  uint32 private twapPeriod = 61;
  IUniswapV3Pool daiUsdcPool = IUniswapV3Pool(0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168);
  address dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

  function setUp() public {
    core = getCore();

    uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    UniswapV3OracleWrapper.OracleConfig memory oracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
      minPoolLiquidity: daiUsdcPool.liquidity()
    });    
    
    
    oracle = new UniswapV3OracleWrapper(
      address(core),
      dai,
      usdc,
      uniswapMathWrapper,
      oracleConfig
    );
  }

  function testMismatchedPoolTokens() public {
    address incorrectPoolToken0 = address(0x3);
    address incorrectPoolToken1 = address(0x4);

    UniswapV3OracleWrapper.OracleConfig memory oracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(daiUsdcPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
      minPoolLiquidity: daiUsdcPool.liquidity()
    });  


    vm.expectRevert(
      bytes("Incorrect pool for tokens")
    );
    oracle = new UniswapV3OracleWrapper(
      address(core),
      incorrectPoolToken0,
      incorrectPoolToken1,
      uniswapMathWrapper,
      oracleConfig
    );
  }

  function testPriceIsCorrectForDaiUsdc() public {
    (Decimal.D256 memory price, bool valid) = oracle.read();
    assertTrue(valid);
    assertEq(price.value, 1e18);
  }

  function testPriceIsCorrectForEthUsdc() public {
    
  }

}
