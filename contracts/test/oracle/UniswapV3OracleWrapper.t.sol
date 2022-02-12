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

contract UniswapV3OracleTest is DSTest, StdLib {
  
  IUniswapV3Pool private mockUniswapPool;
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

  address inputToken = address(0x1);
  address outputToken = address(0x2);
  
  function setUp() public {
    core = getCore();

    // Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a 
    // different Solidity version (Uniswap contracts written in different version, and rely on prior features)
    mockUniswapPool = IUniswapV3Pool(deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json"));
    uniswapMathWrapper = deployCode("./out/UniswapWrapper.sol/UniswapWrapper.json");

    UniswapV3OracleWrapper.OracleConfig memory oracleConfig = UniswapV3OracleWrapper.OracleConfig({
      twapPeriod: twapPeriod,
      uniswapPool: address(mockUniswapPool),
      minTwapPeriod: 0,
      maxTwapPeriod: 50000,
      minPoolLiquidity: mockUniswapPool.liquidity()
    });    
    
    
    oracle = new UniswapV3OracleWrapper(
      address(core),
      inputToken,
      outputToken,
      uniswapMathWrapper,
      oracleConfig
    );
  } 

  function testMetadataSet() public {
    assertEq(oracle.pool(), address(mockUniswapPool));
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
      minPoolLiquidity: mockUniswapPool.liquidity() + 1,
      uniswapPool: address(mockUniswapPool)
    });    
    
    vm.expectRevert(
      bytes("Pool has insufficient liquidity")
    );
    oracle = new UniswapV3OracleWrapper(
      address(core),
      inputToken,
      outputToken,
      uniswapMathWrapper,
      highMinLiquidityConfig
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
    (Decimal.D256 memory value, bool valid) = oracle.read();
    assertTrue(valid);
  }

  function testPriceIsDecimal() public {
    (Decimal.D256 memory value, bool valid) = oracle.read();
    // TODO
  }
}