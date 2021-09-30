pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "./IRewardsDistributorAdmin.sol";

contract RewardsDistributorAdmin is IRewardsDistributorAdmin, CoreRef {
    /// @notice rewards distributor contract address
    IRewardsDistributorAdmin public rewardsDistributorContract;

    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorContract address of the admin rewards distributor contract
    constructor(
        address coreAddress,
        IRewardsDistributorAdmin _rewardsDistributorContract
    ) CoreRef(coreAddress) {
        rewardsDistributorContract = _rewardsDistributorContract;
        /// @notice Create new admin role for this contract
        /// grant this role to all AutoRewardsDistributors so that they can call 
        _setContractAdminRole(keccak256("REWARDS_DISTRIBUTOR_ADMIN_ROLE"));
    }

    /**
      * @notice Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
      * @dev Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
      * @param newPendingAdmin New pending admin.
      */
    function _setPendingAdmin(address newPendingAdmin) external override onlyGovernor {
        rewardsDistributorContract._setPendingAdmin(newPendingAdmin);
    }

    /**
      * @notice Accepts transfer of admin rights. msg.sender must be pendingAdmin
      * @dev Admin function for pending admin to accept role and update admin
      */
    function _acceptAdmin() public override onlyGovernorOrAdmin {
        rewardsDistributorContract._acceptAdmin();
    }

    /*** Comp Distribution ***/
   /*** Comp Distribution Admin ***/

    /**
     * @notice Transfer COMP to the recipient
     * @dev Note: If there is not enough COMP, we do not perform the transfer all.
     * @param recipient The address of the recipient to transfer COMP to
     * @param amount The amount of COMP to (possibly) transfer
     */
    function _grantComp(address recipient, uint amount) external override onlyGovernor {
        rewardsDistributorContract._grantComp(recipient, amount);
    }

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     */
    function _setCompSupplySpeed(address cToken, uint256 compSpeed) external override onlyGovernorOrAdmin {
        rewardsDistributorContract._setCompSupplySpeed(cToken, compSpeed);
    }

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     */
    function _setCompBorrowSpeed(address cToken, uint256 compSpeed) external override onlyGovernorOrAdmin {
        rewardsDistributorContract._setCompBorrowSpeed(cToken, compSpeed);
    }

    /**
     * @notice Set COMP speed for a single contributor
     * @param contributor The contributor whose COMP speed to update
     * @param compSpeed New COMP speed for contributor
     */
    function _setContributorCompSpeed(address contributor, uint compSpeed) external override onlyGovernorOrAdmin {
        rewardsDistributorContract._setContributorCompSpeed(contributor, compSpeed);
    }

    /**
     * @notice Add a default market to claim rewards for in `claimRewards()`
     * @param cToken The market to add
     */
    function _addMarket(address cToken) external override onlyGovernorOrAdmin {
        rewardsDistributorContract._addMarket(cToken);
    }

    /**
     * @notice view function to get the comp supply speeds from the rewards distributor contract
     * @param cToken The market to view
     */
    function compSupplySpeeds(address cToken) external view override returns(uint256) {
        return rewardsDistributorContract.compSupplySpeeds(cToken);
    }

    /**
     * @notice view function to get the comp borrow speeds from the rewards distributor contract
     * @param cToken The market to view
     */
    function compBorrowSpeeds(address cToken) external view override returns(uint256) {
        return rewardsDistributorContract.compBorrowSpeeds(cToken);
    }
}
