// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ReserveStabilizer.sol";
import "./ITribeReserveStabilizer.sol";
import "../utils/RateLimited.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface ITribe is IERC20 {
    function mint(address to, uint256 amount) external;
    function setMinter(address newMinter) external;
}

/// @title implementation for a TRIBE Reserve Stabilizer
/// @author Fei Protocol
contract TribeReserveStabilizer is ITribeReserveStabilizer, ReserveStabilizer, RateLimited {
    using Decimal for Decimal.D256;

    /// @notice a collateralization oracle
    ICollateralizationOracle public override collateralizationOracle;

    Decimal.D256 private _collateralizationThreshold;

    /// @notice Tribe Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _tribeOracle the TRIBE price oracle to reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _usdPerFeiBasisPoints the USD price per FEI to sell TRIBE at
    /// @param _collateralizationOracle the collateralization oracle to reference
    /// @param _collateralizationThresholdBasisPoints the collateralization ratio below which the stabilizer becomes active. Reported in basis points (1/10000)
    constructor(
        address _core,
        address _tribeOracle,
        address _backupOracle,
        uint256 _usdPerFeiBasisPoints,
        ICollateralizationOracle _collateralizationOracle,
        uint256 _collateralizationThresholdBasisPoints,
        uint256 _maxRateLimitPerSecond,
        uint256 _rateLimitPerSecond,
        uint256 _bufferCap
    ) 
      ReserveStabilizer(_core, _tribeOracle, _backupOracle, IERC20(address(0)), _usdPerFeiBasisPoints) 
      RateLimited(_maxRateLimitPerSecond, _rateLimitPerSecond, _bufferCap, false)
    {
        collateralizationOracle = _collateralizationOracle;
        emit CollateralizationOracleUpdate(address(0), address(_collateralizationOracle));
    
        _collateralizationThreshold = Decimal.ratio(_collateralizationThresholdBasisPoints, Constants.BASIS_POINTS_GRANULARITY);
        emit CollateralizationThresholdUpdate(0, _collateralizationThresholdBasisPoints);
        
        // Setting token here because it isn't available until after CoreRef is constructed
        // This does skip the _setDecimalsNormalizerFromToken call in ReserveStabilizer constructor, but it isn't needed because TRIBE is 18 decimals
        token = tribe();
    }

    /// @notice exchange FEI for minted TRIBE
    /// @dev Collateralization oracle price must be below threshold
    function exchangeFei(uint256 feiAmount) public override returns(uint256) {
        require(isCollateralizationBelowThreshold(), "TribeReserveStabilizer: Collateralization ratio above threshold");
        return super.exchangeFei(feiAmount);
    }

    /// @dev reverts. Held TRIBE should only be released by exchangeFei or mint
    function withdraw(address, uint256) external pure override {
        revert("TribeReserveStabilizer: can't withdraw TRIBE");
    }

    /// @dev reverts if _token is TRIBE. Held TRIBE should only be released by exchangeFei or mint
    function withdrawERC20(address _token, address _to, uint256 _amount) public override {
        require(_token != address(token), "TribeReserveStabilizer: can't withdraw TRIBE");
        super.withdrawERC20(_token, _to, _amount);
    }

    /// @notice check whether collateralization ratio is below the threshold set
    /// @dev returns false if the oracle is invalid
    function isCollateralizationBelowThreshold() public override view returns(bool) {
        (Decimal.D256 memory ratio, bool valid) = collateralizationOracle.read();

        return valid && ratio.lessThanOrEqualTo(_collateralizationThreshold);
    }

    /// @notice set the Collateralization oracle
    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) external override onlyGovernor {
        require(address(newCollateralizationOracle) != address(0), "TribeReserveStabilizer: zero address");
        address oldCollateralizationOracle = address(collateralizationOracle);
        collateralizationOracle = newCollateralizationOracle;
        emit CollateralizationOracleUpdate(oldCollateralizationOracle, address(newCollateralizationOracle));
    }
    
    /// @notice set the collateralization threshold below which exchanging becomes active
    function setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints) external override onlyGovernor {        
        uint256 oldCollateralizationThresholdBasisPoints = _collateralizationThreshold.mul(Constants.BASIS_POINTS_GRANULARITY).asUint256();
        _collateralizationThreshold = Decimal.ratio(newCollateralizationThresholdBasisPoints, Constants.BASIS_POINTS_GRANULARITY);
        emit CollateralizationThresholdUpdate(oldCollateralizationThresholdBasisPoints, newCollateralizationThresholdBasisPoints);
    }

    /// @notice the collateralization threshold below which exchanging becomes active
    function collateralizationThreshold() external view override returns(Decimal.D256 memory) {
        return _collateralizationThreshold;
    }

    /// @notice mints TRIBE to the target address
    /// @param to the address to send TRIBE to
    /// @param amount the amount of TRIBE to send
    function mint(address to, uint256 amount) external override onlyGovernor {
        _mint(to, amount);
    }

    /// @notice changes the TRIBE minter address
    /// @param newMinter the new minter address
    function setMinter(address newMinter) external override onlyGovernor {
        require(newMinter != address(0), "TribeReserveStabilizer: zero address");
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.setMinter(newMinter);
    }

    // Transfer held TRIBE first, then mint to cover remainder
    function _transfer(address to, uint256 amount) internal override {
        _depleteBuffer(amount);
        uint256 _tribeBalance = balance();
        uint256 mintAmount = amount;
        if(_tribeBalance != 0) {
            uint256 transferAmount = Math.min(_tribeBalance, amount);

            _withdrawERC20(address(token), to, transferAmount);

            mintAmount = mintAmount - transferAmount;
            assert(mintAmount + transferAmount == amount);
        }
        if (mintAmount != 0) {
            _mint(to, mintAmount);
        }
    }

    function _mint(address to, uint256 amount) internal {
        ITribe _tribe = ITribe(address(token));
        _tribe.mint(to, amount);
    }
}
