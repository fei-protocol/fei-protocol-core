pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import {IOracle, Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {MockUniswapV3Pool} from "../../mock/MockUniswapV3Pool.sol";
import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore} from "../utils/Fixtures.sol";
import {StdLib} from "../utils/StdLib.sol";
import "hardhat/console.sol";

contract UniswapV3OracleTest is DSTest, StdLib {
  MockUniswapV3Pool private uniswapPool;
  UniswapV3OracleWrapper private oracleWrapper;
  uint32 internal secondsAgo = 500;

  function setUp() public {
    ICore core = getCore();
    uniswapPool = new MockUniswapV3Pool();
    
    // UniswapMathWrapper compiled with different Solidity version. Deploy code from artifact
    address uniswapMathWrapper = deployCode("./out/UniswapMathWrapper.sol/UniswapMathWrapper.json");
    
    oracleWrapper = new UniswapV3OracleWrapper(address(core), address(uniswapPool), secondsAgo, uniswapMathWrapper);
  } 

  function testPausedFalseOnDeploy() public {
    address result = oracleWrapper.testRead();
    console.log("after test read");
    console.logAddress(result);
    // oracleWrapper.update();
    // console.log("called update");
    // console.logAddress(oracleWrapper.pool());
    // console.log("uniswap pool address");
    // console.logAddress(address(uniswapPool));
    // assertEq(oracleWrapper.pool(), address(uniswapPool));
    // assertFalse(oracleWrapper.paused());
  } 

  // function testIsOutdatedFalse() public {
  //   assertTrue(!oracleWrapper.isOutdated());
  // }

  // function testReadIsValid() public {
  //   (Decimal.D256 memory value, bool isValid) = oracleWrapper.read();
  //   assertTrue(isValid);
  // }
}