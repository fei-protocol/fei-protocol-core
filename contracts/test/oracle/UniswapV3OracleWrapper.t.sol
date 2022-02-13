pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {IOracle, Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {IUniswapWrapper} from "../../oracle/uniswap/IUniswapWrapper.sol";

import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {FeiTestAddresses, getAddresses, getCore} from "../utils/fixtures/Fei.sol";

import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";
import {Vm} from "../utils/Vm.sol";
import "hardhat/console.sol";

// Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a 
// different Solidity version (Uniswap contracts written in different version, and rely on prior features)

contract UniswapV3OracleTest is DSTest, StdLib {
  
  // IUniswapV3Pool private mockUniswapPool;
  address private uniswapMathWrapper;
  ICore core;

  uint32 private twapPeriod = 61; // Min TWAP period is 60 seconds
  UniswapV3OracleWrapper private oracle;  
  FeiTestAddresses addresses = getAddresses();
  Vm public constant vm = Vm(HEVM_ADDRESS);

  // Uniswap fixture setup
  uint32[] secondsAgoRange = [twapPeriod, 0];
  int56[] tickCumulatives = [int56(12), int56(12)];
  uint160[] secondsPerLiqCumulatives = [10, 20];

  IUniswapV3Pool daiUsdcPool = IUniswapV3Pool(0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168);
  address dai = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
  address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
  
  function setUp() public {
    core = getCore();
    // mockUniswapPool = IUniswapV3Pool(deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json"));
    
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

  function testMetadataSet() public {
    assertEq(oracle.pool(), address(daiUsdcPool));
    assertEq(oracle.getTwapPeriod(), twapPeriod);
    assertFalse(oracle.isOutdated());
  }

  function testPausedFalseOnDeploy() public {    
    oracle.update();
    assertFalse(oracle.paused());
  }

  function testMinLiquidity() public {
    UniswapV3OracleWrapper.OracleConfig memory highMinLiquidityConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
      minPoolLiquidity: daiUsdcPool.liquidity() + 1,
      uniswapPool: address(daiUsdcPool)
    });    
    
    vm.expectRevert(
      bytes("Pool has insufficient liquidity")
    );
    oracle = new UniswapV3OracleWrapper(
      address(core),
      dai,
      usdc,
      uniswapMathWrapper,
      highMinLiquidityConfig
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

  function testTwapPeriodBounds() public {
    (, , uint32 maxTwapPeriod, , ) = oracle.oracleConfig();
    uint32 newTwapPeriod = maxTwapPeriod + 1;

    vm.prank(addresses.governorAddress);
    vm.expectRevert(
      bytes("TWAP period out of bounds")
    );
    oracle.setTwapPeriod(newTwapPeriod);
  }
  
  function testUpdateNoop() public {
    assertFalse(oracle.isOutdated());
    oracle.update();
    assertFalse(oracle.isOutdated());
  }

  function testSetTwapPeriod() public {
    
    vm.prank(addresses.governorAddress);
    uint32 newTwapPeriod = 100;
    oracle.setTwapPeriod(newTwapPeriod);

    assertEq(oracle.getTwapPeriod(), newTwapPeriod);
  }

  function testSetTwapPeriodWrongAuth() public {    
    uint32 newTwapPeriod = 100;
    
    vm.expectRevert(
      bytes("CoreRef: Caller is not a guardian or governor")
    );
    oracle.setTwapPeriod(newTwapPeriod);
  }

  function testReadIsValid() public {
    (, bool valid) = oracle.read();
    assertTrue(valid);
  }

  function testPriceIsCorrect() public {
    (Decimal.D256 memory price, bool valid) = oracle.read();
    assertTrue(valid);

    console.log("price");
    console.log(price.value);

    assertEq(price.value, 1);
  }
}