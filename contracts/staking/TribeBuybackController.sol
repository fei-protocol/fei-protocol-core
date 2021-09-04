pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "../pcv/utils/PCVSplitter.sol";
import "../pcv/uniswap/IPCVSwapper.sol";
import "../utils/Timed.sol";
import "../utils/Incentivized.sol";
import "../oracle/ICollateralizationOracle.sol";
import "./ITribeBuybackController.sol";

/// @title TribeBuybackController
/// @notice 
contract TribeBuybackController is ITribeBuybackController, CoreRef, PCVSplitter, Timed, Incentivized {
    
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MAX_APR_BASIS_POINTS = 2000; // Max 20% per year
    uint256 public constant MIN_SWAP_FREQUENCY = 1 hours; // Min 1 hour per swap call
    uint256 public constant MAX_SWAP_FREQUENCY = 30 days; // Max 1 month per swap call

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

        _initTimed();

        // TODO make signed and cast
        uint256 equity = collateralizationOracle.pcvEquityValue();

        require(equity > 0, "TribeRewardsController: Equity is nonpositive");

        uint256 amount = equity * aprBasisPoints / ALLOCATION_GRANULARITY * duration / SECONDS_PER_YEAR;

        fei().mint(address(swapper), amount);
        swapper.swap();

        allocate();

        _incentivize();
    }

    function setAPRBasisPoints(uint256 newAprBasisPoints) external onlyGovernorOrAdmin {
        require(newAprBasisPoints != 0, "TribeRewardsController: zero APR");
        require(newAprBasisPoints <= MAX_APR_BASIS_POINTS, "TribeRewardsController: APR above max");

        uint256 oldAprBasisPoints = aprBasisPoints;
        aprBasisPoints = newAprBasisPoints;
        // TODO emit event
    }

    /// @notice set the collateralization oracle
    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) external onlyGovernor {
        require(address(newCollateralizationOracle) != address(0), "TribeRewardsController: zero address");
        address oldCollateralizationOracle = address(collateralizationOracle);
        collateralizationOracle = newCollateralizationOracle;
        // TODO emit event
    }

    /// @notice set the new pcv swapper
    function setSwapper(IPCVSwapper newSwapper) external onlyGovernor {
        require(address(newSwapper) != address(0), "TribeRewardsController: zero address");
        address oldSwapper = address(swapper);
        swapper = newSwapper;
        // TODO emit event
    }

    /// @notice set the mint frequency
    function setFrequency(uint256 newFrequency) external onlyGovernorOrAdmin {
        require(newFrequency >= MIN_SWAP_FREQUENCY, "TribeRewardsController: frequency low");
        require(newFrequency <= MAX_SWAP_FREQUENCY, "TribeRewardsController: frequency high");

        _setDuration(newFrequency);
    }

    /// @notice batch allocate held PCV
    function allocate() public whenNotPaused {
        _allocate(tribeBalance());
    }
    
    function _allocateSingle(uint256 amount, address pcvDeposit) internal override {
        tribe().transfer(pcvDeposit, amount);        
    }
}