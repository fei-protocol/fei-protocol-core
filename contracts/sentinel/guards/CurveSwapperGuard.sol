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
    /// @notice the PCV Deposit to read balance from
    address public immutable inspectedDeposit;
    /// @notice the minimum balance under which a swap can be triggered
    uint256 public immutable inspectedDepositMinBalance;
    /// @notice the amount of tokens to swap
    uint256 public immutable swapSize;

    constructor(
        address _core,
        address _pcvGuardian,
        address _curveSwapper,
        address _sourceDeposit,
        address _inspectedDeposit,
        uint256 _inspectedDepositMinBalance,
        uint256 _swapSize
    ) CoreRef(_core) {
        pcvGuardian = _pcvGuardian;
        curveSwapper = _curveSwapper;
        sourceDeposit = _sourceDeposit;
        inspectedDeposit = _inspectedDeposit;
        inspectedDepositMinBalance = _inspectedDepositMinBalance;
        swapSize = _swapSize;
    }

    /// @notice check if contract can be called. If any deposit has a nonzero withdraw amount available, then return true.
    function check() external view override returns (bool) {
        uint256 balance = IPCVDeposit(inspectedDeposit).balance();
        return balance < inspectedDepositMinBalance && balance >= swapSize;
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
        uint256 balance = IPCVDeposit(inspectedDeposit).balance();
        if (balance < inspectedDepositMinBalance && balance >= swapSize) {
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
