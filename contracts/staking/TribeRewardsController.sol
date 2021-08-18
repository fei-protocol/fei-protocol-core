pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "../pcv/utils/PCVSplitter.sol";
import "../pcv/uniswap/IPCVSwapper.sol";
import "../utils/Timed.sol";
import "../utils/Incentivized.sol";
import "../oracle/ICollateralizationOracle.sol";

/// @title TribeRewardsController
/// @notice 
contract TribeRewardsController is CoreRef, PCVSplitter, Timed, Incentivized {
    
    uint256 private constant SECONDS_PER_YEAR = 365 days;

    ICollateralizationOracle public collateralizationOracle;

    uint256 public aprBasisPoints;

    IPCVSwapper public swapper;

    constructor(
        address _core,
        ICollateralizationOracle _collateralizationOracle,
        IPCVSwapper _swapper,
        uint256 _aprBasisPoints,
        uint256 _incentive,
        uint256 _duration,
        address[] memory _pcvDeposits,
        uint256[] memory _ratios
    ) 
        CoreRef(_core)
        PCVSplitter(_pcvDeposits, _ratios)
        Timed(_duration)
        Incentivized(_incentive)
    {
        collateralizationOracle = _collateralizationOracle;
        aprBasisPoints = _aprBasisPoints;
        swapper = _swapper;
    }

    function buy() public whenNotPaused afterTime {
        collateralizationOracle.update();
        
        // TODO make signed and cast
        uint256 equity = collateralizationOracle.pcvEquityValue();
        uint256 amount = equity * aprBasisPoints / ALLOCATION_GRANULARITY * duration / SECONDS_PER_YEAR;

        fei().mint(address(swapper), amount);
        swapper.swap();

        allocate();

        _initTimed();
        _incentivize();
    }

    /// @notice batch allocate held PCV
    function allocate() public whenNotPaused {
        _allocate(tribeBalance());
    }
    
    function _allocateSingle(uint256 amount, address pcvDeposit) internal override {
        tribe().transfer(pcvDeposit, amount);        
    }
}