// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./ReserveStabilizer.sol";
import "./ITribeReserveStabilizer.sol";

interface ITribe is IERC20 {
    function mint(address to, uint256 amount) external;
    function setMinter(address newMinter) external;
}

/// @title implementation for a TRIBE Reserve Stabilizer
/// @author Fei Protocol
contract TribeReserveStabilizer is ITribeReserveStabilizer, ReserveStabilizer {
    using Decimal for Decimal.D256;

    /// @notice a FEI oracle reporting USD per FEI
    IOracle public override feiOracle;

    Decimal.D256 private _feiPriceThreshold;

    /// @notice Tribe Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _tribeOracle the TRIBE price oracle to reference
    /// @param _usdPerFeiBasisPoints the USD price per FEI to sell TRIBE at
    /// @param _feiOracle the FEI price oracle to reference
    /// @param _feiPriceThresholdBasisPoints the FEI price below which the stabilizer becomes active. Reported in basis points (1/10000)
    constructor(
        address _core,
        address _tribeOracle,
        uint256 _usdPerFeiBasisPoints,
        IOracle _feiOracle,
        uint256 _feiPriceThresholdBasisPoints
    ) ReserveStabilizer(_core, _tribeOracle, IERC20(address(0)), _usdPerFeiBasisPoints) {
        feiOracle = _feiOracle;
        _feiPriceThreshold = Decimal.ratio(_feiPriceThresholdBasisPoints, BASIS_POINTS_GRANULARITY);
    }

    /// @notice exchange FEI for minted TRIBE
    /// @dev FEI oracle price must be below threshold
    function exchangeFei(uint256 feiAmount) public override returns(uint256) {
        require(isFeiBelowThreshold(), "TribeReserveStabilizer: FEI price too high");
        return super.exchangeFei(feiAmount);
    }

    /// @dev reverts because this contract doesn't hold any TRIBE
    function withdraw(address, uint256) external pure override {
        revert("TribeReserveStabilizer: nothing to withdraw");
    }

    /// @notice returns the amount of the held TRIBE
    function balance() public view override returns(uint256) {
        return tribeBalance();
    }

    /// @notice check whether FEI price is below the threshold set relative to USD
    /// @dev returns false if the FEI oracle is invalid
    function isFeiBelowThreshold() public override view returns(bool) {
        (Decimal.D256 memory price, bool valid) = feiOracle.read();

        return valid && price.lessThanOrEqualTo(_feiPriceThreshold);
    }

    /// @notice set the FEI oracle
    function setFeiOracle(IOracle _feiOracle) external override onlyGovernor {
        feiOracle = _feiOracle;
        emit FeiOracleUpdate(address(_feiOracle));
    }
    
    /// @notice set the FEI price threshold below which exchanging becomes active
    function setFeiPriceThreshold(uint256 _feiPriceThresholdBasisPoints) external override onlyGovernor {
        _feiPriceThreshold = Decimal.ratio(_feiPriceThresholdBasisPoints, BASIS_POINTS_GRANULARITY);
        emit FeiPriceThresholdUpdate(_feiPriceThresholdBasisPoints);
    }

    /// @notice the FEI price threshold below which exchanging becomes active
    function feiPriceThreshold() external view override returns(Decimal.D256 memory) {
        return _feiPriceThreshold;
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
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.setMinter(newMinter);
    }

    function _transfer(address to, uint256 amount) internal override {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        ITribe _tribe = ITribe(address(tribe()));
        _tribe.mint(to, amount);
    }
}
