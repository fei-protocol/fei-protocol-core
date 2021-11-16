// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../pcv/reflexer/IGebSafeManager.sol";

abstract contract RaiRef {

    uint256 internal constant WAD = 10**18;
    uint256 internal constant RAY = 10**27;
    bytes32 internal constant COLLATERAL_TYPE = "ETH-A";

    address internal _systemCoin;
    ICollateralJoin1 internal _collateralJoin;
    ICoinJoin internal _coinJoin;
    IGebSafeManager public safeManager;

    uint256 public safeId;

    constructor(
        address collateralJoin_,
        address coinJoin_,
        address safeManager_
    ) {
        _coinJoin = ICoinJoin(coinJoin_);
        _collateralJoin = ICollateralJoin1(collateralJoin_);
        _systemCoin = address(_coinJoin.systemCoin());
        safeManager = IGebSafeManager(safeManager_);

        safeId = safeManager.openSAFE(COLLATERAL_TYPE, address(this));
        _safeEngine().approveSAFEModification(coinJoin_);
    }

    function safeData() public view returns (uint256 safeCollateral, uint256 safeDebt) {
        (safeCollateral, safeDebt) = _safeEngine().safes(COLLATERAL_TYPE, _safeHandler());
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
        if (_collateralToLock > 0) _collateralJoin.join(_safeHandler(), _collateralToLock);
        // Modify SAFE
        safeManager.modifySAFECollateralization(_safeId, int256(_collateralToLock), int256(_debtToGen));
        // Transfer internal balances and exit COIN
        if (_debtToGen > 0) {
            safeManager.transferInternalCoins(_safeId, address(this), _debtToGen * RAY);
            _coinJoin.exit(address(this), _debtToGen);
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
        if (_debtToRepay > 0) _coinJoin.join(_safeHandler(), _debtToRepay);
        // Modify SAFE
        safeManager.modifySAFECollateralization(_safeId, -int256(_collateralToFree), -int256(_debtToRepay));
        // Transfer internal blanaces and exit collateral
        if (_collateralToFree > 0) {
            safeManager.transferCollateral(_safeId, address(this), _collateralToFree);
            _collateralJoin.exit(address(this), _collateralToFree);
        }
    }

    function _getDebtDesired(uint256 _collateral, uint256 _cRatio) internal view returns (uint256) {
        require(_cRatio != 0, "RaiRef: cratio zero");
        (, , uint256 safetyPrice, , , ) = _safeEngine().collateralTypes(COLLATERAL_TYPE);
        // (((wad  *  ray) / ray) * wad) / wad
        return (((_collateral * safetyPrice) / RAY) * WAD) / _cRatio;
    }

    function _getCollateralRequired(uint256 _safeDebt, uint256 _cRatio) internal view returns (uint256) {
        (, uint256 accumulatedRate, uint256 safetyPrice, , , ) = _safeEngine().collateralTypes(COLLATERAL_TYPE);
        // wad = (wad * ray / ray) * wad / wad * ray / ray
        return (((((_safeDebt * accumulatedRate) / RAY) * _cRatio) / WAD) * RAY) / safetyPrice;
    }

    function _safeEngine() internal view returns (SAFEEngineLike) {
        return SAFEEngineLike(safeManager.safeEngine());
    }

    function _safeHandler() private view returns (address) {
        return safeManager.safes(safeId);
    }
}
