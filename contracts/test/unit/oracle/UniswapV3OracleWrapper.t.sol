// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IMockUniswapV3Pool} from "../../../mock/IMockUniswapV3Pool.sol";
import {IOracle, Decimal} from "../../../oracle/IOracle.sol";
import {ICore} from "../../../core/ICore.sol";
import {IUniswapWrapper} from "../../../oracle/uniswap/IUniswapWrapper.sol";

import {MockERC20} from "../../../mock/MockERC20.sol";
import {UniswapV3OracleWrapper} from "../../../oracle/uniswap/UniswapV3OracleWrapper.sol";
import {FeiTestAddresses, getAddresses, getCore} from "../../utils/fixtures/FeiFixture.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {StdLib} from "../../utils/StdLib.sol";
import {Vm} from "../../utils/Vm.sol";

// Note: Where deployCode() is used, it's a workaround to deploy a contract necessarily compiled with a
// different Solidity version (Uniswap contracts written in different version, and rely on prior features)

contract UniswapV3OracleTest is DSTest, StdLib {
    IMockUniswapV3Pool private mockUniswapPool;
    address private uniswapMathWrapper;
    ICore core;

    uint32 private twapPeriod = 61;
    uint256 private precision = 10**18;

    UniswapV3OracleWrapper private oracle;
    FeiTestAddresses addresses = getAddresses();
    Vm public constant vm = Vm(HEVM_ADDRESS);

    MockERC20 private tokenA = new MockERC20();
    MockERC20 private tokenB = new MockERC20();

    function setUp() public {
        core = getCore();
        mockUniswapPool = IMockUniswapV3Pool(
            deployCode("./out/MockUniV3Pool.sol/MockUniV3Pool.json")
        );
        mockUniswapPool.mockSetTokens(address(tokenA), address(tokenB));
        uniswapMathWrapper = deployCode(
            "./out/UniswapWrapper.sol/UniswapWrapper.json"
        );

        UniswapV3OracleWrapper.OracleConfig
            memory oracleConfig = UniswapV3OracleWrapper.OracleConfig({
                twapPeriod: twapPeriod,
                uniswapPool: address(mockUniswapPool),
                minPoolLiquidity: mockUniswapPool.liquidity(),
                precision: precision
            });

        oracle = new UniswapV3OracleWrapper(
            address(core),
            address(tokenA),
            address(tokenB),
            uniswapMathWrapper,
            oracleConfig
        );
    }

    /// @notice Validate that oracle contract metadata is set
    function testMetadataSet() public {
        assertEq(oracle.pool(), address(mockUniswapPool));
        assertEq(oracle.getTwapPeriod(), twapPeriod);
        assertFalse(oracle.isOutdated());
        assertEq(oracle.inputToken(), address(tokenA));
        assertEq(oracle.outputToken(), address(tokenB));
        assertEq(oracle.pool(), address(mockUniswapPool));

        (
            uint32 _twapPeriod,
            uint128 minPoolLiquidity,
            address uniswapPool,
            uint256 _precision
        ) = oracle.oracleConfig();
        assertEq(_twapPeriod, twapPeriod);
        assertEq(minPoolLiquidity, mockUniswapPool.liquidity());
        assertEq(uniswapPool, address(mockUniswapPool));
        assertEq(_precision, precision);
    }

    /// @notice Validate that the oracle is not paused when deployed
    function testPausedFalseOnDeploy() public {
        oracle.update();
        assertFalse(oracle.paused());
    }

    /// @notice Validate that TWAPs of 0s are rejected (requesting a spot price)
    function testZeroTwapPeriod() public {
        UniswapV3OracleWrapper.OracleConfig
            memory zeroTwapConfig = UniswapV3OracleWrapper.OracleConfig({
                twapPeriod: 0,
                uniswapPool: address(mockUniswapPool),
                minPoolLiquidity: mockUniswapPool.liquidity(),
                precision: precision
            });

        vm.expectRevert(bytes("Twap period must be greater than 0"));
        oracle = new UniswapV3OracleWrapper(
            address(core),
            address(tokenA),
            address(tokenB),
            uniswapMathWrapper,
            zeroTwapConfig
        );
    }

    /// @notice Validate that a pool with different tokens to the oracle is rejected
    function testWrongPoolToken0Detected() public {
        UniswapV3OracleWrapper.OracleConfig
            memory config = UniswapV3OracleWrapper.OracleConfig({
                twapPeriod: 0,
                uniswapPool: address(mockUniswapPool),
                minPoolLiquidity: mockUniswapPool.liquidity(),
                precision: precision
            });

        vm.expectRevert(bytes("Incorrect pool for tokens"));
        oracle = new UniswapV3OracleWrapper(
            address(core),
            address(0x2),
            address(tokenB),
            uniswapMathWrapper,
            config
        );
    }

    /// @notice Validate that a pool with different tokens to the oracle is rejected
    function testWrongPoolToken1Detected() public {
        UniswapV3OracleWrapper.OracleConfig
            memory config = UniswapV3OracleWrapper.OracleConfig({
                twapPeriod: 0,
                uniswapPool: address(mockUniswapPool),
                minPoolLiquidity: mockUniswapPool.liquidity(),
                precision: precision
            });

        vm.expectRevert(bytes("Incorrect pool for tokens"));
        oracle = new UniswapV3OracleWrapper(
            address(core),
            address(tokenA),
            address(0x2),
            uniswapMathWrapper,
            config
        );
    }

    /// @notice Validate that connecting an oracle to a low liquidity pool is rejected
    function testMinLiquidity() public {
        UniswapV3OracleWrapper.OracleConfig
            memory highMinLiquidityConfig = UniswapV3OracleWrapper
                .OracleConfig({
                    twapPeriod: twapPeriod,
                    minPoolLiquidity: mockUniswapPool.liquidity() + 1,
                    uniswapPool: address(mockUniswapPool),
                    precision: precision
                });

        vm.expectRevert(bytes("Pool has insufficient liquidity"));
        oracle = new UniswapV3OracleWrapper(
            address(core),
            address(tokenA),
            address(tokenB),
            uniswapMathWrapper,
            highMinLiquidityConfig
        );
    }

    /// @notice Validate that isOutdated returns false
    function testUpdateNoop() public {
        assertFalse(oracle.isOutdated());
        oracle.update();
        assertFalse(oracle.isOutdated());
    }

    /// @notice Validate that TWAP period can be set by authorised users
    function testSetTwapPeriod() public {
        vm.prank(addresses.governorAddress);
        uint32 newTwapPeriod = 100;
        oracle.setTwapPeriod(newTwapPeriod);

        assertEq(oracle.getTwapPeriod(), newTwapPeriod);
    }

    /// @notice Validate that access control on `setTwapPeriod()` is enforced
    function testSetTwapAccessControl() public {
        vm.prank(addresses.userAddress);
        uint32 newTwapPeriod = 100;

        vm.expectRevert(bytes("UNAUTHORIZED"));
        oracle.setTwapPeriod(newTwapPeriod);
    }

    /// @notice Validate that `read()` is valid
    function testReadIsValid() public {
        (, bool valid) = oracle.read();
        assertTrue(valid);
    }
}
