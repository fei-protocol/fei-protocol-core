pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import {IOracle, Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore} from "../utils/fixtures/fei.sol";
import {StdLib} from "../utils/StdLib.sol";

contract UniswapV3OracleTest is DSTest, StdLib {
  // Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a 
  // different Solidity version (Uniswap contracts written in different version, and rely on prior features)
  address private mockUniswapPool = deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json");
  UniswapV3OracleWrapper private oracle;

  uint32 secondsAgo = 3;  
  uint32[] secondsAgoRange = [secondsAgo, 0];
  int56[] tickCumulatives = [int56(12), int56(12)];
  uint160[] secondsPerLiqCumulatives = [10, 20];

  function setUp() public {
    ICore core = getCore();
    address uniswapMathWrapper = deployCode("./out/UniswapMathWrapper.sol/UniswapMathWrapper.json");
    oracle = new UniswapV3OracleWrapper(address(core), mockUniswapPool, secondsAgo, uniswapMathWrapper);
  } 

  function testPausedFalseOnDeploy() public {    
    oracle.update();
    assertFalse(oracle.paused());
  }

  function testMetadataSet() public {
    assertEq(oracle.pool(), mockUniswapPool);
    assertEq(oracle.secondsAgo(), secondsAgo);
    assertFalse(oracle.isOutdated());
  }
  
  function testUpdateNoop() public {
    assertFalse(oracle.isOutdated());
    oracle.update();
    assertFalse(oracle.isOutdated());
  }

  function testReadIsValid() public {
    (Decimal.D256 memory value, bool valid) = oracle.read();
    assertTrue(valid);
  }

  function testPriceIsDecimal() public {
    (Decimal.D256 memory value, bool valid) = oracle.read();
    // TODO
  }
}