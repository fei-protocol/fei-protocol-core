pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

import {IOracle, Decimal} from "../../oracle/IOracle.sol";
import {ICore} from "../../core/ICore.sol";
import {UniswapV3OracleWrapper} from "../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {IUniswapWrapper} from "../../oracle/uniswap/IUniswapWrapper.sol";
import {FeiTestAddresses, getAddresses, getCore} from "../utils/fixtures/Fei.sol";

import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";
import {Vm} from "../utils/Vm.sol";

contract UniswapV3OracleTest is DSTest, StdLib {
  // Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a 
  // different Solidity version (Uniswap contracts written in different version, and rely on prior features)
  address private mockUniswapPool = deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json");
  UniswapV3OracleWrapper private oracle;

  Vm public constant vm = Vm(HEVM_ADDRESS);

  uint32 secondsAgo = 3;  
  uint32[] secondsAgoRange = [secondsAgo, 0];
  int56[] tickCumulatives = [int56(12), int56(12)];
  uint160[] secondsPerLiqCumulatives = [10, 20];

  function setUp() public {
    ICore core = getCore();
    address uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");
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

  function testSetSecondsAgo() public {
    FeiTestAddresses memory addresses = getAddresses();
    
    vm.prank(addresses.governorAddress);
    uint32 newSecondsAgo = 5;
    oracle.setSecondsAgo(newSecondsAgo);

    assertEq(oracle.secondsAgo(), newSecondsAgo);
  }

  function testSetSecondsAgoWrongAuth() public {    
    uint32 newSecondsAgo = 5;
    
    vm.expectRevert(
      bytes("CoreRef: Caller is not a guardian or governor")
    );
    oracle.setSecondsAgo(newSecondsAgo);
  }

  function testInsufficientObsSlots() public {
      // Request much larger time range than available
      FeiTestAddresses memory addresses = getAddresses();

      (, , , uint16 observationCardinality, , , ) = IUniswapV3Pool(mockUniswapPool).slot0();
      uint16 approxBlockTime = uint16(11);
      uint32 newSecondsAgo = (observationCardinality * approxBlockTime) + 1;

      vm.expectRevert(
        bytes("Insufficient pool observation slots")
      );
      vm.prank(addresses.governorAddress);
      oracle.setSecondsAgo(newSecondsAgo);
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