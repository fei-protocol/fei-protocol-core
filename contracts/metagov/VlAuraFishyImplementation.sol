// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IAuraLocker.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

// Hidden Hand Aura bribe contract
interface IAuraBribe {
    function setRewardForwarding(address to) external;

    function getBribe(
        bytes32 proposal,
        uint256 proposalDeadline,
        address token
    ) external view returns (address bribeToken, uint256 bribeAmount);
}

/// @author eswak
contract VlAuraFishyImplementation {
    address public constant AURA = 0xC0c293ce456fF0ED870ADd98a0828Dd4d2903DBF;
    address public constant VLAURA = 0x3Fa73f1E5d8A792C80F426fc8F84FBF7Ce9bBCAC;

    // TODO: Update this before deploying, Fishy.
    address public constant OWNER = 0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148;

    modifier onlyOwner() {
        require(msg.sender == OWNER, "!OWNER");
        _;
    }

    /// @notice delegate vlAURA voting power to an address
    function delegate(address delegatee) external onlyOwner {
        ERC20Votes(VLAURA).delegate(delegatee);
    }

    /// @notice returns the balance of locked + unlocked AURA
    function balances() external view returns (uint256 balanceLocked, uint256 balanceUnlocked) {
        balanceLocked = IERC20(VLAURA).balanceOf(address(this));
        balanceUnlocked = IERC20(AURA).balanceOf(address(this));
        return (balanceLocked, balanceUnlocked);
    }

    /// @notice exit lock after it has expired
    function unlock() external onlyOwner {
        IAuraLocker(VLAURA).processExpiredLocks(false);
    }

    /// @notice emergency withdraw if system is shut down
    function emergencyWithdraw() external onlyOwner {
        IAuraLocker(VLAURA).emergencyWithdraw();
    }

    /// @notice get rewards & stake them (rewards claiming is permissionless)
    function getReward() external {
        IAuraLocker(VLAURA).getReward(address(this), true);
    }

    /// @notice withdraw ERC20 from the contract
    function sweep(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }

    /// @notice forward rewards to an eoa on Hidden Hand
    function setRewardForwarding(address briber, address to) external onlyOwner {
        // note: briber for aura is currently 0x642c59937A62cf7dc92F70Fd78A13cEe0aa2Bd9c
        IAuraBribe(briber).setRewardForwarding(to);
    }

    /// @notice arbitrary call
    function call(
        address to,
        uint256 value,
        bytes calldata data
    ) external onlyOwner {
        (bool success, ) = payable(to).call{value: value}(data);
        require(success, "Error in external call");
    }
}
