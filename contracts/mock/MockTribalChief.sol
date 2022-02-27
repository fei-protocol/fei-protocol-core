pragma solidity ^0.8.0;
pragma solidity ^0.8.0;

contract MockTribalChief {
    /// @dev allocation points of the pool
    uint120 public poolAllocPoints;
    /// @dev Total allocation points. Must be the sum of all allocation points in all pools.
    uint256 public totalAllocPoint;

    /// @dev Amount of tribe to give out per block
    uint256 private tribalChiefTribePerBlock;

    constructor(
        uint256 _tribalChiefTribePerBlock,
        uint256 _totalAllocPoint,
        uint120 _poolAllocPoints
    ) {
        tribalChiefTribePerBlock = _tribalChiefTribePerBlock;
        poolAllocPoints = _poolAllocPoints;
        totalAllocPoint = _totalAllocPoint;
    }

    function poolInfo(uint256 _index)
        external
        view
        returns (
            uint256,
            uint256,
            uint128,
            uint120,
            bool
        )
    {
        return (0, 0, 0, poolAllocPoints, false);
    }

    /// @notice Calculates and returns the `amount` of TRIBE per block.
    function tribePerBlock() public view returns (uint256) {
        return tribalChiefTribePerBlock;
    }

    /// @notice set the total alloc points
    function setTotalAllocPoint(uint256 newTotalAllocPoint) external {
        totalAllocPoint = newTotalAllocPoint;
    }

    /// @notice set the pool alloc points
    function setPoolAllocPoints(uint120 newPoolAllocPoint) external {
        poolAllocPoints = newPoolAllocPoint;
    }

    /// @notice set the tribe per block
    function setTribePerBlock(uint256 newTribePerBlock) external {
        tribalChiefTribePerBlock = newTribePerBlock;
    }
}
