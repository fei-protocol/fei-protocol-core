pragma solidity ^0.8.0;

import {CToken} from "../../external/fuse/CToken.sol";

interface IRewardsDistributorDelegator {
    /// @notice The portion of compRate that each market currently receives
    function compSupplySpeeds(address) external view returns (uint256);

    /// @notice The portion of compRate that each market currently receives
    function compBorrowSpeeds(address) external view returns (uint256);

    /// @notice Role for AutoRewardsDistributor contracts
    function AUTO_REWARDS_DISTRIBUTOR_ROLE() external view returns (bytes32);

    /*** Set Admin ***/

    /**
     * @notice Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @dev Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @param newPendingAdmin New pending admin.
     */
    function _setPendingAdmin(address newPendingAdmin) external;

    /**
     * @notice Accepts transfer of admin rights. msg.sender must be pendingAdmin
     * @dev Admin function for pending admin to accept role and update admin
     */
    function _acceptAdmin() external;

    /**
     * @notice Keeps the flywheel moving pre-mint and pre-redeem
     * @dev Called by the Comptroller
     * @param cToken The relevant market
     * @param supplier The minter/redeemer
     */
    function flywheelPreSupplierAction(address cToken, address supplier) external;

    /**
     * @notice Keeps the flywheel moving pre-borrow and pre-repay
     * @dev Called by the Comptroller
     * @param cToken The relevant market
     * @param borrower The borrower
     */
    function flywheelPreBorrowerAction(address cToken, address borrower) external;

    /**
     * @notice Keeps the flywheel moving pre-transfer and pre-seize
     * @dev Called by the Comptroller
     * @param cToken The relevant market
     * @param src The account which sources the tokens
     * @param dst The account which receives the tokens
     */
    function flywheelPreTransferAction(
        address cToken,
        address src,
        address dst
    ) external;

    /**
     * @notice Calculate additional accrued COMP for a contributor since last accrual
     * @param contributor The address to calculate contributor rewards for
     */
    function updateContributorRewards(address contributor) external;

    /**
     * @notice Claim all the comp accrued by holder in all markets
     * @param holder The address to claim COMP for
     */
    function claimRewards(address holder) external;

    /**
     * @notice Claim all the comp accrued by holder in the specified markets
     * @param holder The address to claim COMP for
     * @param cTokens The list of markets to claim COMP in
     */
    function claimRewards(address holder, CToken[] memory cTokens) external;

    /**
     * @notice Claim all comp accrued by the holders
     * @param holders The addresses to claim COMP for
     * @param cTokens The list of markets to claim COMP in
     * @param borrowers Whether or not to claim COMP earned by borrowing
     * @param suppliers Whether or not to claim COMP earned by supplying
     */
    function claimRewards(
        address[] memory holders,
        CToken[] memory cTokens,
        bool borrowers,
        bool suppliers
    ) external;

    /*** Comp Distribution Admin ***/

    /**
     * @notice Transfer COMP to the recipient
     * @dev Note: If there is not enough COMP, we do not perform the transfer all.
     * @param recipient The address of the recipient to transfer COMP to
     * @param amount The amount of COMP to (possibly) transfer
     */
    function _grantComp(address recipient, uint256 amount) external;

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     * @param compSpeed New COMP speed for market
     */
    function _setCompSupplySpeed(CToken cToken, uint256 compSpeed) external;

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     * @param compSpeed New COMP speed for market
     */
    function _setCompBorrowSpeed(CToken cToken, uint256 compSpeed) external;

    /**
     * @notice Set COMP borrow and supply speeds for the specified markets.
     * @param cTokens The markets whose COMP speed to update.
     * @param supplySpeeds New supply-side COMP speed for the corresponding market.
     * @param borrowSpeeds New borrow-side COMP speed for the corresponding market.
     */
    function _setCompSpeeds(
        CToken[] memory cTokens,
        uint256[] memory supplySpeeds,
        uint256[] memory borrowSpeeds
    ) external;

    /**
     * @notice Set COMP speed for a single contributor
     * @param contributor The contributor whose COMP speed to update
     * @param compSpeed New COMP speed for contributor
     */
    function _setContributorCompSpeed(address contributor, uint256 compSpeed) external;

    /*** Helper Functions */

    function getBlockNumber() external view returns (uint256);

    /**
     * @notice Returns an array of all markets.
     */
    function getAllMarkets() external view returns (CToken[] memory);
}
