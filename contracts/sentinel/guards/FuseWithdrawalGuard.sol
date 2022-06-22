// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IGuard.sol";
import "../../pcv/compound/ERC20CompoundPCVDeposit.sol";
import "../../pcv/PCVGuardian.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract FuseWithdrawalGuard is IGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct WithdrawInfo {
        address destination;
        uint96 liquidityToLeave;
    }

    mapping(address => WithdrawInfo) public withdrawInfo;

    EnumerableSet.AddressSet private fuseDeposits;

    PCVGuardian public constant pcvGuardian = PCVGuardian(0x02435948F84d7465FB71dE45ABa6098Fc6eC2993);

    function check() external view override returns (bool) {
        for (uint256 i = 0; i < fuseDeposits.length(); ) {
            if (getAmountToWithdraw(ERC20CompoundPCVDeposit(fuseDeposits.at(i))) > 0) return true;
            unchecked {
                ++i;
            }
        }
        return false;
    }

    function getAmountToWithdraw(ERC20CompoundPCVDeposit deposit) public view returns (uint256) {
        IERC20 underlying = IERC20(deposit.balanceReportedIn());
        uint256 liquidity = underlying.balanceOf(address(deposit.cToken()));
        uint256 liquidityToLeave = withdrawInfo[address(deposit)].liquidityToLeave;
        if (liquidity <= liquidityToLeave) {
            return 0;
        }
        liquidity -= liquidityToLeave;

        uint256 withdrawAmount = deposit.balance();
        if (withdrawAmount > liquidity) {
            withdrawAmount = liquidity;
        }
        return withdrawAmount;
    }

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
        for (uint256 i = 0; i < fuseDeposits.length(); ) {
            uint256 amount = getAmountToWithdraw(ERC20CompoundPCVDeposit(fuseDeposits.at(i)));
            if (amount > 0) {
                targets = new address[](1);
                targets[0] = address(pcvGuardian);
                datas = new bytes[](1);
                datas[0] = abi.encodeWithSelector(
                    PCVGuardian.withdrawToSafeAddress.selector,
                    fuseDeposits.at(i),
                    withdrawInfo[fuseDeposits.at(i)].destination,
                    amount,
                    false,
                    false
                );
                values = new uint256[](1);
                return (targets, datas, values);
            }
            unchecked {
                ++i;
            }
        }
    }
}
