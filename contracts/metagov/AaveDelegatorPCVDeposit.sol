// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./DelegatorPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/aave/IAaveIncentivesController.sol";

interface IStkAave is IERC20 {
    function delegate(address delegatee) external;
    function stake(address onBehalfOf, uint256 amount) external;
    function redeem(address to, uint256 amount) external;
    function cooldown() external;
    function claimRewards(address to, uint256 amount) external;
    function stakerRewardsToClaim(address who) external returns (uint256);
}

/// @title Aave Delegator PCV Deposit
/// Should this contract receive AAVE, they can be staked to stkAAVE
/// permissionlessly. If this contract is paused, stkAAVE can also be unwrapped
/// to AAVE after the cooldown period of 10 days. After a cooldown is initiated,
/// and the 2-day redeem period opens, anyone can unwrap the stkAAVE to AAVE.
/// @author Fei Protocol
contract AaveDelegatorPCVDeposit is DelegatorPCVDeposit {

    /// @notice the Aave Incentives Controller.
    IAaveIncentivesController public constant aaveIncentivesController = IAaveIncentivesController(0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5);

    /// @notice the AAVE token address.
    IERC20 public constant aave = IERC20(0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9);
    /// @notice the stkAAVE token address.
    IStkAave public constant stkaave = IStkAave(0x4da27a545c0c5B758a6BA100e3a049001de870f5);

    /// @notice Aave Delegator PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _initialDelegate the initial delegate
    constructor(
        address _core,
        address _initialDelegate
    ) DelegatorPCVDeposit(
        _core,
        address(stkaave), // report balance and delegate stkAAVE
        _initialDelegate
    ) {}

    /// @notice Claim stkAAVE rewards (AAVE tokens) for this contract.
    function claimRewards() external {
        uint256 claimAmount = stkaave.stakerRewardsToClaim(address(this));
        stkaave.claimRewards(address(this), claimAmount);
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        // if the contract is paused, this contract may hold non-staked AAVE
        uint256 aaveBalance = aave.balanceOf(address(this));
        // under normal conditions, all AAVE are staked (stkAAVE)
        uint256 stkaaveBalance = stkaave.balanceOf(address(this));

        return aaveBalance + stkaaveBalance;
    }

    /// @notice If this contract holds AAVE, anyone can stake to stkAAVE.
    function stake() external whenNotPaused {
        uint256 amount = aave.balanceOf(address(this));
        aave.approve(address(stkaave), amount);
        stkaave.stake(address(this), amount);
    }

    /// @notice An admin can start the cooldown period to unwrap stkAAVE
    /// into AAVE after 10 days.
    function cooldown() external onlyGovernorOrAdmin {
        stkaave.cooldown();
    }

    /// @notice After the 10-days cooldown period is passed, anyone can call
    /// this function to unwrap stkAAVE held on this contract to AAVE.
    function redeem() external {
        uint256 amount = stkaave.balanceOf(address(this));
        stkaave.redeem(address(this), amount);
    }
}
