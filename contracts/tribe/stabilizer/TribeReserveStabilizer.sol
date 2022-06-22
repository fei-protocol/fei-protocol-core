// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ReserveStabilizer.sol";
import "./ITribeReserveStabilizer.sol";
import "../../tribe/ITribeMinter.sol";
import "../../utils/Timed.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title implementation for a TRIBE Reserve Stabilizer
/// @author Fei Protocol
contract TribeReserveStabilizer is ITribeReserveStabilizer, ReserveStabilizer, Timed {
    using Decimal for Decimal.D256;

    /// @notice a collateralization oracle
    ICollateralizationOracle public override collateralizationOracle;

    /// @notice the TRIBE minter address
    ITribeMinter public immutable tribeMinter;

    Decimal.D256 private _collateralizationThreshold;

    /// @notice Tribe Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _tribeOracle the TRIBE price oracle to reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _usdPerFeiBasisPoints the USD price per FEI to sell TRIBE at
    /// @param _collateralizationOracle the collateralization oracle to reference
    /// @param _collateralizationThresholdBasisPoints the collateralization ratio below which the stabilizer becomes active. Reported in basis points (1/10000)
    /// @param _tribeMinter the tribe minter contract
    /// @param _osmDuration the amount of delay time before the TribeReserveStabilizer begins minting TRIBE
    constructor(
        address _core,
        address _tribeOracle,
        address _backupOracle,
        uint256 _usdPerFeiBasisPoints,
        ICollateralizationOracle _collateralizationOracle,
        uint256 _collateralizationThresholdBasisPoints,
        ITribeMinter _tribeMinter,
        uint256 _osmDuration
    )
        ReserveStabilizer(_core, _tribeOracle, _backupOracle, IERC20(address(0)), _usdPerFeiBasisPoints)
        Timed(_osmDuration)
    {
        collateralizationOracle = _collateralizationOracle;
        emit CollateralizationOracleUpdate(address(0), address(_collateralizationOracle));

        _collateralizationThreshold = Decimal.ratio(
            _collateralizationThresholdBasisPoints,
            Constants.BASIS_POINTS_GRANULARITY
        );
        emit CollateralizationThresholdUpdate(0, _collateralizationThresholdBasisPoints);

        // Setting token here because it isn't available until after CoreRef is constructed
        // This does skip the _setDecimalsNormalizerFromToken call in ReserveStabilizer constructor, but it isn't needed because TRIBE is 18 decimals
        token = tribe();

        tribeMinter = _tribeMinter;
    }

    /// @notice exchange FEI for minted TRIBE
    /// @dev the timer counts down from first time below threshold and opens after window
    function exchangeFei(uint256 feiAmount) public override afterTime returns (uint256) {
        require(isCollateralizationBelowThreshold(), "TribeReserveStabilizer: Collateralization ratio above threshold");
        return super.exchangeFei(feiAmount);
    }

    /// @dev reverts. Held TRIBE should only be released by exchangeFei or mint
    function withdraw(address, uint256) external pure override {
        revert("TribeReserveStabilizer: can't withdraw TRIBE");
    }

    /// @notice check whether collateralization ratio is below the threshold set
    /// @dev returns false if the oracle is invalid
    function isCollateralizationBelowThreshold() public view override returns (bool) {
        (Decimal.D256 memory ratio, bool valid) = collateralizationOracle.read();

        return valid && ratio.lessThanOrEqualTo(_collateralizationThreshold);
    }

    /// @notice delay the opening of the TribeReserveStabilizer until oracle delay duration is met
    function startOracleDelayCountdown() external override {
        require(isCollateralizationBelowThreshold(), "TribeReserveStabilizer: Collateralization ratio above threshold");
        require(!isTimeStarted(), "TribeReserveStabilizer: timer started");
        _initTimed();
    }

    /// @notice reset the opening of the TribeReserveStabilizer oracle delay as soon as above CR target
    function resetOracleDelayCountdown() external override {
        require(
            !isCollateralizationBelowThreshold(),
            "TribeReserveStabilizer: Collateralization ratio under threshold"
        );
        require(isTimeStarted(), "TribeReserveStabilizer: timer started");
        _pauseTimer();
    }

    /// @notice set the Collateralization oracle
    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle)
        external
        override
        onlyGovernor
    {
        require(address(newCollateralizationOracle) != address(0), "TribeReserveStabilizer: zero address");
        address oldCollateralizationOracle = address(collateralizationOracle);
        collateralizationOracle = newCollateralizationOracle;
        emit CollateralizationOracleUpdate(oldCollateralizationOracle, address(newCollateralizationOracle));
    }

    /// @notice set the collateralization threshold below which exchanging becomes active
    function setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints)
        external
        override
        onlyGovernor
    {
        uint256 oldCollateralizationThresholdBasisPoints = _collateralizationThreshold
            .mul(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();
        _collateralizationThreshold = Decimal.ratio(
            newCollateralizationThresholdBasisPoints,
            Constants.BASIS_POINTS_GRANULARITY
        );
        emit CollateralizationThresholdUpdate(
            oldCollateralizationThresholdBasisPoints,
            newCollateralizationThresholdBasisPoints
        );
    }

    /// @notice the collateralization threshold below which exchanging becomes active
    function collateralizationThreshold() external view override returns (Decimal.D256 memory) {
        return _collateralizationThreshold;
    }

    // Call out to TRIBE minter for transferring
    function _transfer(address to, uint256 amount) internal override {
        tribeMinter.mint(to, amount);
    }

    function _pauseTimer() internal {
        // setting start time to 0 means isTimeStarted is false
        startTime = 0;
        emit TimerReset(0);
    }
}
