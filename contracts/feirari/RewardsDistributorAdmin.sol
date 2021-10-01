pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "./IRewardsDistributorAdmin.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract RewardsDistributorAdmin is IRewardsDistributorAdmin, CoreRef, AccessControlEnumerable {

    bytes32 public constant override AUTO_REWARDS_DISTRIBUTOR = keccak256("AUTO_REWARDS_DISTRIBUTOR");

    /// @notice rewards distributor contract
    IRewardsDistributorAdmin public rewardsDistributorContract;

    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorContract admin rewards distributor contract
    constructor(
        address coreAddress,
        IRewardsDistributorAdmin _rewardsDistributorContract,
        address[] memory _autoRewardDistributors
    ) CoreRef(coreAddress) {
        rewardsDistributorContract = _rewardsDistributorContract;
        /// @notice Governance should create new admin role for this contract
        /// and then grant this role to all AutoRewardsDistributors so that they can call this contract
        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
        /// assign the admin role of AUTO_REWARDS_DISTRIBUTOR to DEFAULT_ADMIN_ROLE
        _setRoleAdmin(AUTO_REWARDS_DISTRIBUTOR, DEFAULT_ADMIN_ROLE);

        /// give all AutoRewardsDistributor contracts the proper role so that they can set borrow and supply speeds
        for (uint256 i = 0; i < _autoRewardDistributors.length; i++) {
            _setupRole(AUTO_REWARDS_DISTRIBUTOR, _autoRewardDistributors[i]);
        }
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
    function _acceptAdmin() external override {
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
     * @notice Set COMP speed for a single market.
     * Callable only by users with auto rewards distributor role
     * @param cToken The market whose COMP speed to update
     */
    function _setCompSupplySpeed(address cToken, uint256 compSpeed) external override onlyRole(AUTO_REWARDS_DISTRIBUTOR) whenNotPaused {
        rewardsDistributorContract._setCompSupplySpeed(cToken, compSpeed);
    }

    /**
     * @notice Set COMP speed for a single market
     * Callable only by users with auto rewards distributor role
     * @param cToken The market whose COMP speed to update
     */
    function _setCompBorrowSpeed(address cToken, uint256 compSpeed) external override onlyRole(AUTO_REWARDS_DISTRIBUTOR) whenNotPaused {
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
     * @notice Set the implementation contract the RewardsDistributorDelegator delegate calls
     * @param implementation_ the logic contract address
     */
    function _setImplementation(address implementation_) external override onlyGovernor {
        rewardsDistributorContract._setImplementation(implementation_);
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

    /**
     * @notice allow admin or governor to assume auto reward distributor admin role
     */
    function becomeAdmin() public onlyGovernorOrAdmin {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
