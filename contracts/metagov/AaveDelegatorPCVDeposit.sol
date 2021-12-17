// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./SnapshotDelegatorPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAaveIncentivesController {
    function getRewardsBalance(
        address[] calldata assets,
        address user
    ) external view returns (uint256);
    function claimRewardsOnBehalf(
        address[] calldata assets,
        uint256 amount,
        address user,
        address to
    ) external;
}

interface IStkAave is IERC20 {
    function stake(address onBehalfOf, uint256 amount) external;
    function redeem(address to, uint256 amount) external;
    function cooldown() external;
}

/// @title Aave Delegator PCV Deposit
/// This contract delegates the voting power it holds in the Aave governance.
/// This contract is designed to be whitelisted as the rewards claimer for the
/// PCVDeposits that deposit on Aave protocol. This contract will pull rewards
/// (mostly stkAAVE) directly on this contract, claiming on behalf of other
/// deposits. Should this contract receive AAVE, they can be staked to stkAAVE
/// permissionlessly. If this contract is paused, stkAAVE can also be unwrapped
/// to AAVE after the cooldown period of 10 days. After a cooldown is initiated,
/// and the 2-day redeem period opens, anyone can unwrap the stkAAVE to AAVE.
/// @author Fei Protocol
contract DelegatorPCVDeposit is SnapshotDelegatorPCVDeposit {

    /// @notice the Aave Incentives Controller.
    IAaveIncentivesController public constant aaveIncentivesController = IAaveIncentivesController(address(0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5));

    /// @notice the AAVE token address.
    IERC20 public constant aave = IERC20(address(0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9));
    /// @notice the stkAAVE token address.
    IStkAave public constant stkaave = IStkAave(address(0x4da27a545c0c5B758a6BA100e3a049001de870f5));

    /// @notice Aave Delegator PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _initialDelegate the initial delegate
    constructor(
        address _core,
        address _initialDelegate
    ) SnapshotDelegatorPCVDeposit(
        _core,
        aave, // report balance in AAVE
        bytes32(0x616176652e657468000000000000000000000000000000000000000000000000), // aave.eth
        _initialDelegate
    ) {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view virtual override returns (uint256) {
        // if the contract is paused, this contract may hold non-staked AAVE
        uint256 aaveBalance = aave.balanceOf(address(this));
        // under normal conditions, all AAVE are staked (stkAAVE)
        uint256 stkaaveBalance = stkaave.balanceOf(address(this));

        return aaveBalance + stkaaveBalance;
    }

    /// @notice Claim rewards on behalf of a PCVDeposit, and send them to this
    /// contract. Note: the Aave team have to whitelist manually this contract
    /// as an authorized claimer for each PCVDeposits that earn rewards before
    /// calling this function, or it will revert.
    /// @param pcvDeposit address of the pcvDeposit to claim rewards for
    /// @param aaveAsset address of the aToken held by the PCVDeposit
    /// @param amount amount of rewards to claim (look offchain to save gas)
    function claimRewards(address pcvDeposit, address aaveAsset, uint256 amount) public whenNotPaused {
        address[] memory assets = new address[](1);
        assets[0] = aaveAsset;

        aaveIncentivesController.claimRewardsOnBehalf(
            assets, // assets
            amount, // amount
            pcvDeposit, // user
            address(this) // to
        );
    }

    /// @notice If this contract holds AAVE, anyone can stake to stkAAVE.
    function stakeAave() external whenNotPaused {
        uint256 amount = aave.balanceOf(address(this));
        aave.approve(address(stkaave), amount);
        stkaave.stake(address(this), amount);
    }

    /// @notice A PCVController can start the cooldown period to unwrap stkAAVE
    /// into AAVE after 10 days.
    function cooldown() external onlyPCVController {
        stkaave.cooldown();
    }

    /// @notice After the 10-days cooldown period is passed, anyone can call
    /// this function to unwrap stkAAVE held on this contract to AAVE.
    function unstakeAave() external {
        uint256 amount = stkaave.balanceOf(address(this));
        stkaave.redeem(address(this), amount);
    }
}
