pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
// import {MockObservable} from "@uniswap/v3-periphery/contracts/test/MockObservable.sol";

import {IOracle, Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore} from "../utils/fixtures/fei.sol";
import {StdLib} from "../utils/StdLib.sol";
import "hardhat/console.sol";

contract UniswapV3OracleTest is DSTest, StdLib {
  // MockUniswapV3Pool private mockUniswapPool;
  address mockUniswapPool = address(0x02);
  UniswapV3OracleWrapper private oracle;

  uint32 secondsAgo = 3;  
  uint32[] secondsAgoRange = [secondsAgo, 0];
  int56[] tickCumulatives = [int56(12), int56(12)];
  uint160[] secondsPerLiqCumulatives = [10, 20];

  function setUp() public {
    ICore core = getCore();


    // UniswapMathWrapper compiled with different Solidity version. Deploy code from artifact
    address uniswapMathWrapper = deployCode("./out/UniswapMathWrapper.sol/UniswapMathWrapper.json");
    oracle = new UniswapV3OracleWrapper(address(core), address(mockUniswapPool), secondsAgo, uniswapMathWrapper);
  } 

  function testPausedFalseOnDeploy() public {    
    oracle.update();
    assertFalse(oracle.paused());
  }

  function testMetadataSet() public {
    assertEq(oracle.pool(), address(mockUniswapPool));
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
}