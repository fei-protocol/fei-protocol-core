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
import "hardhat/console.sol";

contract UniswapV3OracleTest is DSTest, StdLib {
  UniswapV3OracleWrapper private oracle;
  uint32 twapPeriod = 61;  // Min TWAP period is 60 seconds
  uint32[] secondsAgoRange = [twapPeriod, 0];
  int56[] tickCumulatives = [int56(12), int56(12)];
  uint160[] secondsPerLiqCumulatives = [10, 20];
  FeiTestAddresses addresses = getAddresses();
  Vm public constant vm = Vm(HEVM_ADDRESS);

  // Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a 
  // different Solidity version (Uniswap contracts written in different version, and rely on prior features)
  address private mockUniswapPool = deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json");
  
  function setUp() public {
    ICore core = getCore();
    address uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    UniswapV3OracleWrapper.OracleConfig memory oracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      minTwapPeriod: 0,
      maxTwapPeriod: 50000
    });    

    oracle = new UniswapV3OracleWrapper(address(core), mockUniswapPool, uniswapMathWrapper, oracleConfig);
  } 

  function testMetadataSet() public {
    assertEq(oracle.pool(), mockUniswapPool);
    assertEq(oracle.getTwapPeriod(), twapPeriod);
    assertFalse(oracle.isOutdated());
  }

  function testPausedFalseOnDeploy() public {    
    oracle.update();
    assertFalse(oracle.paused());
  }

  function testTwapPeriodBounds() public {
    (, , uint32 maxTwapPeriod) = oracle.oracleConfig();
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

  function testInsufficientObsSlots() public {
    (, , , uint16 observationCardinality, , , ) = IUniswapV3Pool(mockUniswapPool).slot0();
    uint16 approxBlockTime = uint16(11);
    uint32 newTwapPeriod = (observationCardinality * approxBlockTime) + 1;
    console.log(newTwapPeriod);

    vm.expectRevert(
      bytes("Insufficient pool observation slots")
    );
    vm.prank(addresses.governorAddress);
    oracle.setTwapPeriod(newTwapPeriod);
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