pragma solidity ^0.8.0;

import "./../staking/TribalChief.sol";
import "../refs/CoreRef.sol";
import "../fuse/rewards/IRewardsDistributorAdmin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockRewardsDistributor is IRewardsDistributorAdmin, Ownable {
    event successSetAdmin(address pendingAdmin);
    event successAcceptPendingAdmin(address newlyAppointedAdmin);
    event successGrantComp(address compGrantee, uint256 compAmount);
    event successSetCompSupplySpeed();
    event successSetCompBorrowSpeed();
    event successSetCompContributorSpeed();
    event successAddMarket();

    bytes32 public constant override AUTO_REWARDS_DISTRIBUTOR_ROLE =
        keccak256("AUTO_REWARDS_DISTRIBUTOR_ROLE");

    uint256 public compSupplySpeed;
    uint256 public compBorrowSpeed;

    address public pendingNewAdmin;
    address public newAdmin;

    address public implementation;
    address public newMarket;

    address public newContributor;
    uint256 public newCompSpeed;

    address public newCompGrantee;
    uint256 public newCompGranteeAmount;

    constructor() Ownable() {}

    /**
     * @notice Begins transfer of admin rights. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @dev Admin function to begin change of admin. The newPendingAdmin must call `_acceptAdmin` to finalize the transfer.
     * @param _newPendingAdmin New pending admin.
     */
    function _setPendingAdmin(address _newPendingAdmin)
        external
        override
        onlyOwner
    {
        pendingNewAdmin = _newPendingAdmin;
        emit successSetAdmin(pendingNewAdmin);
    }

    /**
     * @notice Accepts transfer of admin rights. msg.sender must be pendingAdmin
     * @dev Admin function for pending admin to accept role and update admin
     */
    function _acceptAdmin() external override onlyOwner {
        newAdmin = pendingNewAdmin;
        pendingNewAdmin = address(0);
        emit successAcceptPendingAdmin(newAdmin);
    }

    /*** Comp Distribution ***/
    /*** Comp Distribution Admin ***/

    /**
     * @notice Transfer COMP to the recipient
     * @dev Note: If there is not enough COMP, we do not perform the transfer all.
     * @param recipient The address of the recipient to transfer COMP to
     * @param amount The amount of COMP to (possibly) transfer
     */
    function _grantComp(address recipient, uint256 amount)
        external
        override
        onlyOwner
    {
        newCompGrantee = recipient;
        newCompGranteeAmount = amount;
        emit successGrantComp(recipient, amount);
    }

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     */
    function _setCompSupplySpeed(address cToken, uint256 compSpeed)
        external
        override
        onlyOwner
    {
        compSupplySpeed = compSpeed;
        emit successSetCompSupplySpeed();
    }

    /**
     * @notice Set COMP speed for a single market
     * @param cToken The market whose COMP speed to update
     */
    function _setCompBorrowSpeed(address cToken, uint256 compSpeed)
        external
        override
        onlyOwner
    {
        compBorrowSpeed = compSpeed;
        emit successSetCompBorrowSpeed();
    }

    /**
     * @notice Set COMP speed for a single contributor
     * @param contributor The contributor whose COMP speed to update
     * @param compSpeed New COMP speed for contributor
     */
    function _setContributorCompSpeed(address contributor, uint256 compSpeed)
        external
        override
        onlyOwner
    {
        newContributor = contributor;
        newCompSpeed = compSpeed;
        emit successSetCompContributorSpeed();
    }

    /**
     * @notice Add a default market to claim rewards for in `claimRewards()`
     * @param cToken The market to add
     */
    function _addMarket(address cToken) external override onlyOwner {
        newMarket = cToken;
        emit successAddMarket();
    }

    /**
     * @notice view function to get the comp supply speeds from the rewards distributor contract
     * @param cToken The market to view
     */
    function compSupplySpeeds(address cToken)
        external
        view
        override
        returns (uint256)
    {
        return compSupplySpeed;
    }

    /**
     * @notice view function to get the comp borrow speeds from the rewards distributor contract
     * @param cToken The market to view
     */
    function compBorrowSpeeds(address cToken)
        external
        view
        override
        returns (uint256)
    {
        return compBorrowSpeed;
    }

    /// @notice admin function
    function setCompSupplySpeed(uint256 newSpeed) external {
        compSupplySpeed = newSpeed;
    }

    function setCompBorrowSpeed(uint256 newSpeed) external {
        compBorrowSpeed = newSpeed;
    }

    /**
     * @notice Set the implementation contract the RewardsDistributorDelegator delegate calls
     * @param implementation_ the logic contract address
     */
    function _setImplementation(address implementation_)
        external
        override
        onlyOwner
    {
        implementation = implementation_;
    }
}
