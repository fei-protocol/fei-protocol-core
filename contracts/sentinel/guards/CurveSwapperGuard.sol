// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IGuard.sol";
import "../../refs/CoreRef.sol";
import "../../pcv/PCVGuardian.sol";
import "../../pcv/curve/ICurvePool.sol";
import "../../pcv/curve/CurveSwapper.sol";

/// @notice Guard that can trigger a Curve swapper under certain conditions.
contract CurveSwapperGuard is IGuard, CoreRef {
    /// @notice the PCV mover contract exposed to guardian role
    address public immutable pcvGuardian;
    /// @notice the Curve swapper to call
    address public immutable curveSwapper;
    /// @notice the source deposit to withdraw from
    address public immutable sourceDeposit;
    /// @notice the minimum amount of tokens to keep on the source deposit
    uint256 public immutable minSourceBalance;
    /// @notice the max amount of tokens to swap per tx
    uint256 public immutable maxSwapSize;

    constructor(
        address _core,
        address _pcvGuardian,
        address _curveSwapper,
        address _sourceDeposit,
        uint256 _minSourceBalance,
        uint256 _maxSwapSize
    ) CoreRef(_core) {
        pcvGuardian = _pcvGuardian;
        curveSwapper = _curveSwapper;
        sourceDeposit = _sourceDeposit;
        minSourceBalance = _minSourceBalance;
        maxSwapSize = _maxSwapSize;
    }

    /// @notice check if contract can be called. If any deposit has a nonzero withdraw amount available, then return true.
    function check() external view override returns (bool) {
        uint256 balance = IPCVDeposit(sourceDeposit).balance();
        return balance > minSourceBalance;
    }

    /// @notice return calldata to perform 1 swap
    function getProtecActions()
        external
        view
        override
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        )
    {
        uint256 balance = IPCVDeposit(sourceDeposit).balance();
        if (balance > minSourceBalance) {
            uint256 swapSize = maxSwapSize;
            uint256 remainingBalanceToSwap = balance - minSourceBalance;
            if (remainingBalanceToSwap < maxSwapSize) {
                swapSize = remainingBalanceToSwap;
            }

            // initialize arrays
            targets = new address[](2);
            datas = new bytes[](2);
            values = new uint256[](2);

            // first call: witdraw from sourceDeposit to swapper
            targets[0] = address(pcvGuardian);
            datas[0] = abi.encodeWithSelector(
                PCVGuardian.withdrawToSafeAddress.selector,
                sourceDeposit,
                curveSwapper,
                swapSize,
                false,
                false
            );
            // second call: perform swap
            targets[1] = address(curveSwapper);
            datas[1] = abi.encodeWithSelector(CurveSwapper.swap.selector);

            return (targets, datas, values);
        }
    }
}
