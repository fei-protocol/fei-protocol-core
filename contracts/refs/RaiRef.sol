// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../pcv/reflexer/IGebSafeManager.sol";
import "../pcv/reflexer/GeneralUnderlyingMaxUniswapV3SafeSaviourLike.sol";

abstract contract RaiRef {

    uint256 public constant WAD = 10**18;
    uint256 public constant RAY = 10**27;
    bytes32 public constant COLLATERAL_TYPE = "ETH-A";

    IGebSafeManager public safeManager;

    ICollateralJoin1 public collateralJoin;
    ICoinJoin public coinJoin;
    address public systemCoin;
    uint256 public safeId;

    constructor(
        address _collateralJoin,
        address _coinJoin,
        address _safeManager
    ) {
        collateralJoin = ICollateralJoin1(_collateralJoin);
        coinJoin = ICoinJoin(_coinJoin);
        safeManager = IGebSafeManager(_safeManager);
        systemCoin = address(coinJoin.systemCoin());
        safeId = safeManager.openSAFE(COLLATERAL_TYPE, address(this));
    }

    //// @notice deposit ETH in SAFE and generates debt (or RAI)
    /// @param _safeId safeID
    /// @param _collateralToLock [wad]
    /// @param _debtToGen [wad]
    function _lockETHAndGenerateDebt(
        uint256 _safeId,
        uint256 _collateralToLock,
        uint256 _debtToGen
    ) internal {
        // Join collateral to safeHandler
        if (_collateralToLock > 0) collateralJoin.join(safeHandler(), _collateralToLock);
        // Modify SAFE
        safeManager.modifySAFECollateralization(_safeId, int256(_collateralToLock), int256(_debtToGen));
        // Transfer internal balances and exit COIN
        if (_debtToGen > 0) {
            safeManager.transferInternalCoins(_safeId, address(this), _debtToGen * RAY);
            coinJoin.exit(address(this), _debtToGen);
        }
    }

    /// @param _safeId safeID
    /// @param _collateralToFree [wad]
    /// @param _debtToRepay [wad]
    function _freeETHAndRepayDebt(
        uint256 _safeId,
        uint256 _collateralToFree,
        uint256 _debtToRepay
    ) internal {
        // Join coin
        if (_debtToRepay > 0) coinJoin.join(safeHandler(), _debtToRepay);
        // Modify SAFE
        safeManager.modifySAFECollateralization(_safeId, -int256(_collateralToFree), -int256(_debtToRepay));
        // Transfer internal blanaces and exit collateral
        if (_collateralToFree > 0) {
            safeManager.transferCollateral(_safeId, address(this), _collateralToFree);
            collateralJoin.exit(address(this), _collateralToFree);
        }
    }

    function _getDebtDesired(uint256 _collateral, uint256 _cRatio) internal view returns (uint256) {
        require(_cRatio != 0, "RaiRef: cratio zero");
        (, , uint256 safetyPrice, , , ) = safeEngine().collateralTypes(COLLATERAL_TYPE);
        // (((wad  *  ray) / ray) * wad) / wad
        return (((_collateral * safetyPrice) / RAY) * WAD) / _cRatio;
    }

    function _getCollateralRequired(uint256 _safeDebt, uint256 _cRatio) internal view returns (uint256) {
        (, uint256 accumulatedRate, uint256 safetyPrice, , , ) = safeEngine().collateralTypes(COLLATERAL_TYPE);
        // wad = (wad * ray / ray) * wad / wad * ray / ray
        return (((((_safeDebt * accumulatedRate) / RAY) * _cRatio) / WAD) * RAY) / safetyPrice;
    }

    function safeData() public view returns (uint256 safeCollateral, uint256 safeDebt) {
        (safeCollateral, safeDebt) = safeEngine().safes(COLLATERAL_TYPE, safeHandler());
    }

    function getCRatio() public view returns (uint256) {
        SAFEEngineLike _safeEngine = safeEngine();

        (uint256 safeCollateral, uint256 safeDebt) = _safeEngine.safes(COLLATERAL_TYPE, safeHandler());
        (, uint256 accumulatedRate, uint256 safetyPrice, , , ) = _safeEngine.collateralTypes(COLLATERAL_TYPE);
        // wad * ray * wad / (wad * ray)
        return (safeCollateral * safetyPrice * WAD) / (safeDebt * accumulatedRate);
    }

    function safeHandler() public view returns (address) {
        return safeManager.safes(safeId);
    }

    function safeEngine() public view returns (SAFEEngineLike) {
        return SAFEEngineLike(safeManager.safeEngine());
    }
}
