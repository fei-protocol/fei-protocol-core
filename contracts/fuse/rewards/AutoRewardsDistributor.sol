pragma solidity ^0.8.0;

import "../../staking/ITribalChief.sol";
import "../../refs/CoreRef.sol";
import "./IRewardsDistributorAdmin.sol";

/// @notice Controller Contract to set tribe per block in Rewards Distributor Admin on Rari
contract AutoRewardsDistributor is CoreRef {
    /// @notice rewards distributor admin contract
    IRewardsDistributorAdmin public rewardsDistributorAdmin;
    /// @notice tribal chief contract
    ITribalChief public immutable tribalChief;
    /// @notice address of the CToken this contract controls rewards for
    address public immutable cTokenAddress;
    /// @notice boolean which decides the action to incentivize
    bool public immutable isBorrowIncentivized;
    /// @notice reward index on tribal chief to grab this staked token wrapper's index
    uint256 public immutable tribalChiefRewardIndex;

    event SpeedChanged(uint256 newSpeed);
    event RewardsDistributorAdminChanged(
        IRewardsDistributorAdmin oldRewardsDistributorAdmin,
        IRewardsDistributorAdmin newRewardsDistributorAdmin
    );

    /// @notice constructor function
    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorAdmin address of rewards distributor admin contract
    /// @param _tribalChief address of tribalchief contract
    /// @param _tribalChiefRewardIndex index for this contract's rewards in tribalchief
    /// @param _cTokenAddress address of ctoken contract to incentivize
    /// @param _isBorrowIncentivized boolean that incentivizes borrow or supply
    constructor(
        address coreAddress,
        IRewardsDistributorAdmin _rewardsDistributorAdmin,
        ITribalChief _tribalChief,
        uint256 _tribalChiefRewardIndex,
        address _cTokenAddress,
        bool _isBorrowIncentivized
    ) CoreRef(coreAddress) {
        isBorrowIncentivized = _isBorrowIncentivized;
        cTokenAddress = _cTokenAddress;
        tribalChiefRewardIndex = _tribalChiefRewardIndex;
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
        tribalChief = _tribalChief;

        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
    }

    /// @notice helper function that gets all needed state from the TribalChief contract
    /// based on this state, it then calculates what the compSpeed should be.
    function _deriveRequiredCompSpeed()
        internal
        view
        returns (uint256 compSpeed)
    {
        (, , , uint120 poolAllocPoints, ) = tribalChief.poolInfo(
            tribalChiefRewardIndex
        );
        uint256 totalAllocPoints = tribalChief.totalAllocPoint();
        uint256 tribePerBlock = tribalChief.tribePerBlock();

        if (totalAllocPoints == 0) {
            compSpeed = 0;
        } else {
            compSpeed = (tribePerBlock * poolAllocPoints) / totalAllocPoints;
        }
    }

    /// @notice function to get the new comp speed and figure out if an update is needed
    /// @return newCompSpeed the newly calculated compSpeed based on allocation points in the TribalChief
    /// @return updateNeeded boolean indicating whether the new compSpeed is not equal to the existing compSpeed
    function getNewRewardSpeed()
        public
        view
        returns (uint256 newCompSpeed, bool updateNeeded)
    {
        newCompSpeed = _deriveRequiredCompSpeed();
        uint256 actualCompSpeed;

        if (isBorrowIncentivized) {
            actualCompSpeed = rewardsDistributorAdmin.compBorrowSpeeds(
                cTokenAddress
            );
        } else {
            actualCompSpeed = rewardsDistributorAdmin.compSupplySpeeds(
                cTokenAddress
            );
        }

        if (actualCompSpeed != newCompSpeed) {
            updateNeeded = true;
        }
    }

    /// @notice function to automatically set the rewards speed on the RewardsDistributor contract
    /// through the RewardsDistributorAdmin
    function setAutoRewardsDistribution() external whenNotPaused {
        (uint256 compSpeed, bool updateNeeded) = getNewRewardSpeed();
        require(updateNeeded, "AutoRewardsDistributor: update not needed");

        if (isBorrowIncentivized) {
            rewardsDistributorAdmin._setCompBorrowSpeed(
                cTokenAddress,
                compSpeed
            );
        } else {
            rewardsDistributorAdmin._setCompSupplySpeed(
                cTokenAddress,
                compSpeed
            );
        }
        emit SpeedChanged(compSpeed);
    }

    /// @notice API to point to a new rewards distributor admin contract
    /// @param _newRewardsDistributorAdmin the address of the new RewardsDistributorAdmin contract
    function setRewardsDistributorAdmin(
        IRewardsDistributorAdmin _newRewardsDistributorAdmin
    ) external onlyGovernorOrAdmin {
        IRewardsDistributorAdmin oldRewardsDistributorAdmin = rewardsDistributorAdmin;
        rewardsDistributorAdmin = _newRewardsDistributorAdmin;
        emit RewardsDistributorAdminChanged(
            oldRewardsDistributorAdmin,
            _newRewardsDistributorAdmin
        );
    }
}
