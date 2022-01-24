// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../oracle/IOracle.sol";
import "./IAngleStableMaster.sol";
import "./IAnglePoolManager.sol";

/// @title implementation for Angle AgEUR Burner
/// @author Fei Protocol
contract AgEurBurner is CoreRef {
    using Decimal for Decimal.D256;

    /// @notice the oracle reference for EUR USD price conversions
    IOracle public oracle;

    /// @notice maximum accepted slippage compared to oracle value, in basis points
    uint256 public maxSlippage;

    /// @notice the Angle StableMaster contract
    IAngleStableMaster public immutable stableMaster;

    /// @notice the Angle PoolManager contract
    IAnglePoolManager public poolManager;

    /// @notice AgEurBurner constructor
    /// @param _core the Fei Protocol core
    /// @param _oracle oracle for reference
    /// @param _maxSlippage maximum slippage tolerated vs oracle
    /// @param _stableMaster the Angle stableMaster for agEUR
    /// @param _poolManager the Angle poolManager for FEI
    constructor(
        address _core,
        IOracle _oracle,
        uint256 _maxSlippage,
        IAngleStableMaster _stableMaster,
        IAnglePoolManager _poolManager
    ) CoreRef(_core) {
        oracle = _oracle;
        maxSlippage = _maxSlippage;
        stableMaster = _stableMaster;
        poolManager = _poolManager;
        require(_poolManager.token() == address(fei()), "AngleUniswapPCVDeposit: invalid poolManager");
        require(_stableMaster.agToken() == address(0x1a7e4e63778B4f12a199C062f3eFdD288afCBce8), "AngleUniswapPCVDeposit: invalid stableMaster - not agEUR");
    }

    /// @notice burn agToken for FEI, then burn FEI held
    /// @dev the call will revert if slippage is too high compared to oracle
    function burn(uint256 amountAgToken) public {
      (Decimal.D256 memory oracleValue, bool oracleValid) = oracle.read();
      require(oracleValid, "OracleRef: oracle invalid");

        // compute minimum of FEI out for agTokens burnt
        uint256 minFeiOut = oracleValue // FEI per X
          .mul(amountAgToken)
          .mul(Constants.BASIS_POINTS_GRANULARITY - maxSlippage)
          .div(Constants.BASIS_POINTS_GRANULARITY)
          .asUint256();

        // burn agTokens for FEI
        stableMaster.burn(
            amountAgToken,
            address(this),
            address(this),
            poolManager,
            minFeiOut
        );

        // burn FEI held (after redeeming agTokens, we have some)
        _burnFeiHeld();
    }
}
