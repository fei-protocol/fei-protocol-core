pragma solidity ^0.8.0;

import "./../staking/ITribalChief.sol";
import "./RewardsDistributorAdmin.sol";
import "../refs/CoreRef.sol";
import "./IRewardsDistributorAdmin.sol";

/// @notice Controller Contract to set tribe per block in Rewards Distributor Admin on Rari
contract AutoRewardsDistributor is CoreRef {
    /// @notice rewards distributor admin contract
    IRewardsDistributorAdmin public rewardsDistributorAdmin;
    /// @notice tribal chief contract
    ITribalChief public tribalChief;
    /// @notice address of the CToken this contract controls rewards for
    address public cTokenAddress;
    /// @notice boolean which decides the action to incentivize
    bool public isBorrowIncentivized;
    /// @notice reward index on tribal chief to grab this staked token wrapper's index
    uint256 public tribalChiefRewardIndex;

    event SpeedChanged(bool borrowSpeedChanged, uint256 newSpeed, address cToken);

    /// @notice constructor function
    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorAdmin address rewards distributor admin contract
    /// @param _isBorrowIncentivized boolean to incentivize borrow or supply, but not both
    /// @param _tribalChiefRewardIndex uint of index for this contract's rewards in tribalchief
    /// @param _cTokenAddress address of ctoken contract
    /// @param _tribalChief address of tribalchief contract
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
    }

    function _deriveRequiredCompSpeed() internal view returns (uint256 compSpeed) {
        /// @notice call the TribalChief and grab the current allocation points for the stakedTokenWrapper
        (,,, uint120 allocPoints,) = tribalChief.poolInfo(tribalChiefRewardIndex);
        /// @notice get the total allocation points in the TribalChief
        uint256 totalAllocPoints = tribalChief.totalAllocPoint();
        /// @notice get the amount of tribe being distributed on a per block basis in the TribalChief
        uint256 tribePerBlock = tribalChief.tribePerBlock();

        /// @notice if tribe per block, total allocation points or this pools allocation points are equal to 0,
        /// then set compSpeed to 0
        if (tribePerBlock == 0 || totalAllocPoints == 0 || allocPoints == 0) {
            compSpeed = 0;
        } else {
            /// @notice calculate the amount per block that the Rari rewards distributor is receiving from the TribalChief
            compSpeed = (tribePerBlock * allocPoints) / totalAllocPoints;
        }
    }

    /// @notice function to get the new comp speed and figure out if an update is needed
    function getRewardSpeedDifference() public view returns (uint256 newCompSpeed, bool updateNeeded) {
        newCompSpeed = _deriveRequiredCompSpeed();
        uint256 actualCompSpeed;

        if (isBorrowIncentivized) {
            actualCompSpeed = rewardsDistributorAdmin.compBorrowSpeeds(cTokenAddress);
        } else {
            actualCompSpeed = rewardsDistributorAdmin.compSupplySpeeds(cTokenAddress);
        }

        /// if actual comp speed is not equal to required comp speed, then an update is needed
        if (actualCompSpeed != newCompSpeed) {
            updateNeeded = true;
        }
    }

    /// @notice function to automatically set the rewards speed on the RewardsDistributor contract
    /// through the RewardsDistributorAdmin
    function setAutoRewardsDistribution() external whenNotPaused {
        (uint256 compSpeed, bool updateNeeded) = getRewardSpeedDifference();
        require(updateNeeded, "AutoRewardsDistributor: update not needed");

        /// @notice call out to the rewards distributor admin and set the comp supply/borrow speed to the current value
        /// if the contract is borrow incentivized, set that speed, else, set the supply speed
        if (isBorrowIncentivized) {
            rewardsDistributorAdmin._setCompBorrowSpeed(cTokenAddress, compSpeed);
        } else {
            rewardsDistributorAdmin._setCompSupplySpeed(cTokenAddress, compSpeed);
        }
        emit SpeedChanged(isBorrowIncentivized, compSpeed, cTokenAddress);
    }

    /// @notice API to point to a new rewards distributor admin contract
    /// @param _rewardsDistributorAdmin the address of the new RewardsDistributorAdmin contract
    function setRewardsDistributorAdmin(
        RewardsDistributorAdmin _rewardsDistributorAdmin
    ) external onlyGovernorOrAdmin {
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
    }
}
