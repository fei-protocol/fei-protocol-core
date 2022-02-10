pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {DSTest} from "../utils/DSTest.sol";
import {getCore} from "../utils/Fixtures.sol";
import {IOracle} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {MockUniswapV3Pool} from "../../mock/MockUniswapV3Pool.sol";
import {UniswapV3OracleWrapper} from "../../oracle/UniswapV3OracleWrapper.sol";

contract UniswapV3OracleTest is DSTest {
  IOracle private oracleWrapper;
  uint256 internal secondsAgo = 500;


  function setupTest() public {
    // Deploy the oracle wrapper
    // Deploy a mock Uniswap oracle
    ICore memory core = getCore();
    IUniswapV3Pool memory uniswapPool = new MockUniswapV3Pool();
    // How to test accounting logic? 
    
    oracleWrapper = new UniswapV3OracleWrapper(address(core), address(uniswapPool), secondsAgo);

  } 

  function testPausedFalseOnDeploy() public {
    assertTrue(!oracleWrapper.paused());
  } 

  function testIsOutdatedFalse() public {
    assertTrue(!oracleWrapper.isOutdated());
  }

  function testUpdateDoesNothing() public {
    assertTrue(!oracleWrapper.update());
  }

  function testReadIsValid() public {
    bool isValid = oracleWrapper.read();
    assertTrue(isValid);
  }
}