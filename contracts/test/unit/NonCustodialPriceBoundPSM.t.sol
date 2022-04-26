// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {MockPCVDepositV2} from "../../mock/MockPCVDepositV2.sol";
import {IPCVDeposit} from "../../pcv/IPCVDeposit.sol";
import {MockERC20} from "../../mock/MockERC20.sol";
import {ICore} from "../../core/ICore.sol";
import {ConstantOracle} from "../../oracle/ConstantOracle.sol";
import {Core} from "../../core/Core.sol";
import {IFei, Fei} from "../../fei/Fei.sol";
import {NonCustodialPSM, GlobalRateLimitedMinter} from "../../peg/NonCustodialPSM.sol";
import {NonCustodialPriceBoundPSM} from "../../peg/NonCustodialPriceBoundPSM.sol";
import {Vm} from "./../utils/Vm.sol";
import {DSTest} from "./../utils/DSTest.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./../utils/Fixtures.sol";

contract NonCustodialPriceBoundPSMTest is DSTest {
    using SafeCast for *;

    GlobalRateLimitedMinter private rateLimitedMinter;
    NonCustodialPriceBoundPSM private psm;
    ICore private core;
    IFei private fei;

    /// ------------ Minting and RateLimited System Params ------------

    uint256 public constant mintAmount = 10_000_000e18;
    uint256 public constant bufferCap = 10_000_000e18;
    uint256 public constant individualMaxBufferCap = 5_000_000e18;
    uint256 public constant rps = 10_000e18;
    uint256 public constant price_floor = 1000;
    uint256 public constant price_ceiling = 2000;

    /// ------------ Oracle System Params ------------

    /// @notice prices during test will increase 1% monthly
    int256 public constant monthlyChangeRateBasisPoints = 100;
    uint256 public constant maxDeviationThresholdBasisPoints = 1_000;

    MockERC20 public underlyingToken;
    MockPCVDepositV2 public pcvDeposit;
    ConstantOracle public oracle;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        core = getCore();

        fei = core.fei();

        oracle = new ConstantOracle(address(core), 10000);

        NonCustodialPSM.OracleParams memory oracleParams = NonCustodialPSM
            .OracleParams({
                coreAddress: address(core),
                oracleAddress: address(oracle),
                backupOracle: address(0),
                decimalsNormalizer: 0
            });

        NonCustodialPSM.RateLimitedParams
            memory multiRateLimitedParams = NonCustodialPSM.RateLimitedParams({
                maxRateLimitPerSecond: rps,
                rateLimitPerSecond: rps,
                bufferCap: bufferCap
            });

        NonCustodialPSM.PSMParams memory PSMParams = NonCustodialPSM.PSMParams({
            mintFeeBasisPoints: 0,
            redeemFeeBasisPoints: 0,
            underlyingToken: underlyingToken,
            pcvDeposit: pcvDeposit,
            rateLimitedMinter: rateLimitedMinter
        });

        /// create PSM
        psm = new NonCustodialPriceBoundPSM(
            oracleParams,
            multiRateLimitedParams,
            PSMParams,
            price_floor,
            price_ceiling
        );

        vm.startPrank(addresses.governorAddress);

        /// grant the PSM the PCV Controller role
        core.grantMinter(addresses.governorAddress);
        core.grantMinter(address(rateLimitedMinter));
        core.grantPCVController(address(psm));
        core.grantPCVController(addresses.governorAddress);
        rateLimitedMinter.addAddress(
            address(psm),
            uint112(rps),
            uint112(bufferCap)
        );

        /// mint fei to the user
        fei.mint(address(this), mintAmount);

        vm.stopPrank();

        /// mint the PSM and user some stable coins
        underlyingToken.mint(address(pcvDeposit), mintAmount);
        underlyingToken.mint(address(this), mintAmount);

        /// invest all excess tokens in the PCV deposit
        pcvDeposit.deposit();
    }
}
