pragma solidity ^0.8.0;

import "../../staking/ITribalChief.sol";
import "../../refs/CoreRef.sol";
import "../../external/fuse/Unitroller.sol";
import "../../staking/StakingTokenWrapper.sol";
import "./IRewardsDistributorAdmin.sol";

/// @notice Controller Contract to set tribe per block in Rewards Distributor Admin on Rari
contract AutoRewardsDistributorV2 is CoreRef {
    /// @notice rewards distributor admin contract
    IRewardsDistributorAdmin public rewardsDistributorAdmin;
    /// @notice tribal chief contract
    ITribalChief public immutable tribalChief;
    /// @notice address of the underlying token for the cToken this contract controls rewards for
    address public immutable underlying;
    /// @notice boolean which decides the action to incentivize
    bool public immutable isBorrowIncentivized;

    /// @notice address of the comptroller, used to determine cToken
    Unitroller public immutable comptroller;

    /// @notice address of the stakedTokenWrapper
    StakingTokenWrapper public immutable stakedTokenWrapper;

    /// @notice address of the cToken this contract controls rewards for
    address public cTokenAddress;

    /// @notice reward index on tribal chief to grab this staked token wrapper's index
    uint256 public tribalChiefRewardIndex;

    event SpeedChanged(uint256 newSpeed);
    event RewardsDistributorAdminChanged(
        IRewardsDistributorAdmin oldRewardsDistributorAdmin,
        IRewardsDistributorAdmin newRewardsDistributorAdmin
    );

    /// @notice constructor function
    /// @param coreAddress address of core contract
    /// @param _rewardsDistributorAdmin address of rewards distributor admin contract
    /// @param _tribalChief address of tribalchief contract
    /// @param _stakedTokenWrapper the stakedTokenWrapper this contract controls rewards for
    /// @param _underlying address of the underlying for the cToken
    /// @param _isBorrowIncentivized boolean that incentivizes borrow or supply
    /// @param _comptroller address of the comptroller contract
    constructor(
        address coreAddress,
        IRewardsDistributorAdmin _rewardsDistributorAdmin,
        ITribalChief _tribalChief,
        StakingTokenWrapper _stakedTokenWrapper,
        address _underlying,
        bool _isBorrowIncentivized,
        Unitroller _comptroller
    ) CoreRef(coreAddress) {
        isBorrowIncentivized = _isBorrowIncentivized;
        underlying = _underlying;
        stakedTokenWrapper = _stakedTokenWrapper;
        rewardsDistributorAdmin = _rewardsDistributorAdmin;
        tribalChief = _tribalChief;
        comptroller = _comptroller;

        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
    }

    function init() external {
        tribalChiefRewardIndex = stakedTokenWrapper.pid();
        require(tribalChiefRewardIndex != 0, "pid");

        cTokenAddress = comptroller.cTokensByUnderlying(underlying);
        require(cTokenAddress != address(0), "ctoken");
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
        require(cTokenAddress != address(0), "init");
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
