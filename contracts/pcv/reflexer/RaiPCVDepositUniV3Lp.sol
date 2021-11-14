// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../../refs/UniV3Ref.sol";
import "../../refs/RaiRef.sol";
import "../PCVDeposit.sol";
import "./IRaiPCVDeposit.sol";

import "./IGebSafeManager.sol";
import "./GeneralUnderlyingMaxUniswapV3SafeSaviourLike.sol";

import "./uni-v3/ISwapRouter.sol";
import "./uni-v3/IUniswapV3PoolState.sol";
import "./uni-v3/LiquidityAmounts.sol";
import "./uni-v3/PositionKey.sol";
import "./uni-v3/TickMath.sol";
import "./uni-v3/PoolAddress.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract RaiPCVDepositUniV3Lp is IRaiPCVDeposit, PCVDeposit, RaiRef, UniV3Ref {
    using Decimal for Decimal.D256;

    uint24 private constant POOL_FEE = 500;

    /// @dev V3 router
    ISwapRouter public router;

    /// @notice PCV assets address approved to swap those for RAI
    address[] public tokenSpents;

    /// @notice mapping PCV assets address to params
    mapping(address => SwapParams) public tokenSwapParams;

    /// @dev SAFE saviour https://docs.reflexer.finance/liquidation-protection/safe-protection
    address public safeSaviour;

    // @dev position range
    int24 public positionTickLower;
    int24 public positionTickUpper;

    uint256 public override maxBasisPointsFromPegLP = 100;
    uint256 public override maxSlippageBasisPoints = 100;

    uint256 public maximumAvailableETH = 100 ether;
    uint256 public targetCRatio = 2 * WAD;

    constructor(
        address _core,
        address _positionManager,
        address _oracle,
        address _backupOracle,
        address _collateralJoin,
        address _coinJoin,
        address _safeSaviour,
        address _safeManager,
        address _router
    )
        RaiRef(_collateralJoin, _coinJoin, _safeManager)
        UniV3Ref(_core, _positionManager, address(ICoinJoin(_coinJoin).systemCoin()), _oracle, _backupOracle)
    {
        safeSaviour = _safeSaviour;
        router = ISwapRouter(_router);

        // Approve position manager using RAI
        _approveToken(systemCoin, _positionManager);

        // Approve position manager using FEI
        _approveToken(address(fei()), _positionManager);

        // Approve CollateralJoin using WETH for join()/exit()
        _approveToken(positionManager.WETH9(), _collateralJoin);

        // Approve coinJoin using RAI
        _approveToken(systemCoin, _coinJoin);

        safeEngine().approveSAFEModification(_coinJoin);
    }

    receive() external payable {}

    function deposit() external override whenNotPaused {
        updateOracle();
        uint256 deltaCollateral = address(this).balance;
        (uint256 safeCollateral, uint256 safeDebt) = safeData();
        require(
            maximumAvailableETH > safeCollateral + deltaCollateral,
            "RaiPCVDepositUniV3Lp:exceed maximum available eth"
        );

        uint256 debtDesired = _getDebtDesired(deltaCollateral + safeCollateral, targetCRatio);
        uint256 debtToGenerate = debtDesired > safeDebt ? debtDesired - safeDebt : 0;
        _wrap(deltaCollateral);
        _lockETHAndGenerateDebt(safeId, deltaCollateral, debtToGenerate);

        // LP threshold: 150 RAI (about 500$)
        if (debtToGenerate > 150 * WAD) {
            // safetyPrice means rai per eth token [ray]
            (, , uint256 safetyPrice, , , ) = safeEngine().collateralTypes(COLLATERAL_TYPE);
            uint256 feiAmount = readOracle().mul(RAY).div(safetyPrice).mul(debtToGenerate).asUint256();
            address owner;
            uint128 liquidity;
            uint256 _tokenId = tokenId;
            if (_tokenId != 0) {
                owner = positionManager.ownerOf(_tokenId);
                (, , , , , , , liquidity, , , , ) = _position(_tokenId);
            }
            if (liquidity == 0) {
                // If protection was exercised, withdraw left tokens
                if (owner == safeSaviour) {
                    _withdrawDusts(safeId);
                }
                // Add liquidity and protect SAFE
                (_tokenId, , , ) = _mintLiquidity(positionTickLower, positionTickUpper, debtToGenerate, feiAmount);
                tokenId = _tokenId;
                positionManager.approve(safeSaviour, _tokenId);
                _protectSAFE(safeId, _tokenId);
            } else if (owner == safeSaviour) {
                // GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).withdraw(safeId, _tokenId, address(this));
                _increaseLiquidity(_tokenId, debtToGenerate, feiAmount);
            }

            _burnFeiHeld(); // burn any FEI dust from LP
        }

        emit Deposit(msg.sender, debtToGenerate);
    }

    // ----------- PCV Controller only state changing api -----------

    function withdraw(address to, uint256 amount) public override onlyPCVController whenNotPaused {
        require(to != address(0), "RaiPCVDepositUniV3Lp: to address zero");
        (uint256 safeCollateral, uint256 safeDebt) = safeData();
        require(safeCollateral >= amount, "RaiPCVDepositUniV3Lp: exceed withdrawable collateral");
        uint256 safeCollateralRequired = _getCollateralRequired(safeDebt, targetCRatio);

        // If there is room in target collateral rate and current one, there’s no need to repay debt.
        if (safeCollateral >= safeCollateralRequired && (safeCollateral - safeCollateralRequired) >= amount) {
            _freeETH(safeId, amount);
        } else {
            uint256 debtRepaid = safeDebt - _getDebtDesired(safeCollateral - amount, targetCRatio);
            uint256 raiBalance = IERC20(systemCoin).balanceOf(address(this));
            // Remove LP position if there is not enough RAI to repay in this contract
            if (raiBalance < debtRepaid) {
                uint256 _tokenId = tokenId;
                if (_tokenId != 0 && positionManager.ownerOf(_tokenId) == safeSaviour) {
                    tokenId = 0; // Effect
                    (, , , , , , , uint128 liquidity, , , , ) = _position(_tokenId);
                    // if liquidity equals 0, protection was exercised
                    if (liquidity == 0) {
                        _withdrawDusts(safeId); // withdraw left tokens in saviour
                    } else {
                        // Protection was not exercised, withdraw NFT LP and remove liquidity
                        GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).withdraw(
                            safeId,
                            _tokenId,
                            address(this)
                        );
                        _removeLiquidityAndCollect(_tokenId, liquidity);
                    }

                    raiBalance = IERC20(systemCoin).balanceOf(address(this));
                }
            }
            // Swap PCV assets if there is not enough RAI to repay by simply removing LP due to IL.
            if (raiBalance < debtRepaid) {
                address token;
                bool native;
                uint256 amountIn;
                uint256 amountOut;
                (, , uint256 safetyPrice, , , ) = safeEngine().collateralTypes(COLLATERAL_TYPE);
                for (uint256 i; i < tokenSpents.length; i++) {
                    token = tokenSpents[i];
                    native = token == positionManager.WETH9();
                    amountIn = native ? address(this).balance : IERC20(token).balanceOf(address(this));

                    if (amountIn >= tokenSwapParams[token].minimumAmountIn) {
                        amountOut = router.exactInputSingle{value: native ? amountIn : 0}(
                            ISwapRouter.ExactInputSingleParams({
                                tokenIn: token,
                                tokenOut: systemCoin,
                                fee: tokenSwapParams[token].poolFee,
                                recipient: address(this),
                                deadline: block.timestamp,
                                amountIn: amountIn,
                                amountOutMinimum: _getMinAcceptableAmountOut(token, safetyPrice, amountIn),
                                sqrtPriceLimitX96: 0 // Set this to zero - which makes this parameter inactive. this value can be used to set the limit for the price the swap will push the pool to, which can help protect against price impact
                            })
                        );
                        raiBalance += amountOut;
                        if (raiBalance >= debtRepaid) break;
                    }
                }
                require(raiBalance >= debtRepaid, "RaiPCVDepositUniV3Lp: insufficient balance to repay");
            }
            _freeETHAndRepayDebt(safeId, amount, debtRepaid);
        }

        _unwrap(amount);
        _burnFeiHeld();
        Address.sendValue(payable(to), amount);

        emit Withdrawal(msg.sender, to, amount);
    }

    // ----------- Governor only state changing api -----------

    function closeSAFE(address to) public onlyGovernor {
        (uint256 safeCollateral, ) = safeData();
        withdraw(to, safeCollateral);
    }

    /// @notice sets the new slippage parameter for depositing liquidity
    /// @param _maxBasisPointsFromPegLP the new distance in basis points (1/10000) from peg beyond which a liquidity provision will fail
    function setMaxBasisPointsFromPegLP(uint256 _maxBasisPointsFromPegLP) public override onlyGovernorOrAdmin {
        require(
            _maxBasisPointsFromPegLP <= Constants.BASIS_POINTS_GRANULARITY,
            "RaiPCVDepositUniV3Lp: basis points from peg too high"
        );

        uint256 oldMaxBasisPointsFromPegLP = maxBasisPointsFromPegLP;
        maxBasisPointsFromPegLP = _maxBasisPointsFromPegLP;

        emit MaxBasisPointsFromPegLPUpdate(oldMaxBasisPointsFromPegLP, _maxBasisPointsFromPegLP);
    }

    /// @notice sets the new slippage parameter for swaping
    /// @param _maxSlipageBasisPoints the new slipage
    function setMaxSlipageBasisPoints(uint256 _maxSlipageBasisPoints) external override onlyGovernorOrAdmin {
        require(_maxSlipageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RaiPCVDepositUniV3Lp: slipage too high");

        uint256 oldMaxSlipageBasisPoints = maxSlippageBasisPoints;
        maxSlippageBasisPoints = _maxSlipageBasisPoints;

        emit MaxSlippageUpdate(oldMaxSlipageBasisPoints, _maxSlipageBasisPoints);
    }

    /// @param tokens token addresses to swap for RAI.
    /// @param newSwapParamsData data that include its oracle and mimimum input amount
    function setSwapTokenApproval(address[] memory tokens, SwapParams[] memory newSwapParamsData)
        external
        override
        onlyGovernor
    {
        _setSwapTokenApproval(tokens, newSwapParamsData);
    }

    /// @param _tickLower Position tick lower
    /// @param _tickUpper Position tick upper
    function setPositionTicks(int24 _tickLower, int24 _tickUpper) external onlyGovernor {
        require(_tickUpper > _tickLower, "RaiPCVDepositUniV3Lp: tick reversed order");
        require(
            _tickLower >= TickMath.MIN_TICK && TickMath.MAX_TICK >= _tickUpper,
            "RaiPCVDepositUniV3Lp: out of max/min tick range"
        );

        int24 oldTickLower = positionTickLower;
        int24 oldTickUpper = positionTickUpper;
        positionTickLower = _tickLower;
        positionTickUpper = _tickUpper;

        emit PositionTicksUpdate(oldTickLower, oldTickUpper, positionTickLower, positionTickUpper);

        uint256 _tokenId = tokenId;
        if (_tokenId != 0 && positionManager.ownerOf(_tokenId) == safeSaviour) {
            tokenId = 0;
            (, , , , , , , uint128 liquidity, , , , ) = _position(_tokenId);
            if (liquidity == 0) {
                _withdrawDusts(safeId);
            } else {
                GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).withdraw(safeId, _tokenId, address(this));
                _removeLiquidityAndCollect(_tokenId, liquidity);
            }
        }
    }

    /// @param _maximumAvailableETH eth collateral ceiling that this contract can use
    function setMaxAvailableETH(uint256 _maximumAvailableETH) external override onlyGovernor {
        require(_maximumAvailableETH > WAD, "RaiPCVDepositUniV3Lp: invalid maximum available ETH");

        uint256 oldMaximumAvailableETH = maximumAvailableETH;
        maximumAvailableETH = _maximumAvailableETH;

        emit MaximumAvailableETHUpdate(oldMaximumAvailableETH, maximumAvailableETH);
    }

    /// @param _targetCRatio target collateral ratio, e.g. cRatio 100% => 1e18
    function setTargetCollateralRatio(uint256 _targetCRatio) external override onlyGovernor {
        require(_targetCRatio > WAD, "RaiPCVDepositUniV3Lp: target collateral ratio too low");

        uint256 oldTargetCRatio = targetCRatio;
        targetCRatio = _targetCRatio;

        emit TargetCollateralRatioUpdate(oldTargetCRatio, targetCRatio);
    }

    // ----------- Getters -----------

    function getPositionAmounts() public view returns (uint256 amount0, uint256 amount1) {
        uint256 _tokenId = tokenId;
        if (_tokenId != 0) {
            (, , , , , , , uint128 liquidity, , , uint128 tokensOwed0, uint128 tokensOwed1) = _position(_tokenId);
            if (liquidity > 0) {
                (amount0, amount1) = _amountsForLiquidity(
                    PoolAddress.computeAddress(
                        positionManager.factory(),
                        PoolAddress.getPoolKey(systemCoin, address(fei()), POOL_FEE)
                    ),
                    positionTickLower,
                    positionTickUpper,
                    liquidity
                );
            }
            amount0 += tokensOwed0;
            amount1 += tokensOwed1;
        }
    }

    /// @notice gets the token address in which this deposit returns its balance
    function balanceReportedIn() external view override returns (address) {
        return systemCoin;
    }

    /// @notice gets the effective balance of "balanceReportedIn" token if the deposit were fully withdrawn
    function balance() public view override returns (uint256) {
        (uint256 amount0, uint256 amount1) = getPositionAmounts();
        return address(fei()) < systemCoin ? amount1 : amount0;
    }

    /// @notice gets the resistant token balance and protocol owned fei of this deposit
    /// @return amount0 number of other token in pool
    /// @return amount1 number of FEI in pool
    function resistantBalanceAndFei() public view override returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = getPositionAmounts();
        amount0 += IERC20(systemCoin).balanceOf(address(this));
        amount1 += IERC20(address(fei())).balanceOf(address(this));
    }

    /// @dev Wrapper around `INonfungiblePositionManager.positions()`
    function position()
        external
        view
        override
        returns (
            uint96,
            address,
            address,
            address,
            uint24,
            int24,
            int24,
            uint128,
            uint256,
            uint256,
            uint128,
            uint128
        )
    {
        return _position(tokenId);
    }

    /// @notice Return liquidity owned
    /// @dev If liquidity is not provided, return 0
    function liquidityOwned() public view override returns (uint256) {
        uint256 _tokenId = tokenId;
        if (_tokenId == 0) {
            return 0;
        }
        (, , , , , , , uint128 liquidity, , , , ) = _position(tokenId);
        return uint256(liquidity);
    }

    // ----------- Internal functions -----------

    function _setSwapTokenApproval(address[] memory _tokens, SwapParams[] memory _swapParamsData) internal {
        require(_tokens.length == _swapParamsData.length, "RaiPCVDepositUniV3Lp: not same length");
        address token;
        tokenSpents = _tokens;
        for (uint256 i; i < _swapParamsData.length; i++) {
            token = _tokens[i];
            require(token != address(0), "RaiPCVDepositUniV3Lp: token address zero");
            require(address(_swapParamsData[i].oracle) != address(0), "RaiPCVDepositUniV3Lp: oracle address zero");

            tokenSwapParams[token] = _swapParamsData[i];
            emit SwapTokenApprovalUpdate(token);

            _approveToken(token, address(router));
        }
    }

    // #### UniswapV3 ####

    /// @dev Wrapper around `INonfungiblePositionManager.mint`
    function _mintLiquidity(
        int24 _tickLower,
        int24 _tickUpper,
        uint256 _tokenAmount,
        uint256 _feiAmount
    )
        internal
        returns (
            uint256,
            uint128,
            uint256,
            uint256
        )
    {
        (address token0, address token1, uint256 amount0, uint256 amount1) = address(fei()) < systemCoin
            ? (address(fei()), systemCoin, _feiAmount, _tokenAmount)
            : (systemCoin, address(fei()), _tokenAmount, _feiAmount);

        _mintFei(address(this), _feiAmount);

        return
            positionManager.mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: POOL_FEE,
                    tickLower: _tickLower,
                    tickUpper: _tickUpper,
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: _getMinLiquidity(amount0), // @note
                    amount1Min: _getMinLiquidity(amount1),
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );
    }

    /// @dev Wrapper around `INonfungiblePositionManager.increaseLiquidity`
    function _increaseLiquidity(
        uint256 _tokenId,
        uint256 _tokenAmount,
        uint256 _feiAmount
    ) internal {
        _mintFei(address(this), _feiAmount);

        (uint256 amount0, uint256 amount1) = address(fei()) < systemCoin
            ? (_feiAmount, _tokenAmount)
            : (_tokenAmount, _feiAmount);
        positionManager.increaseLiquidity(
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: _tokenId,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: _getMinLiquidity(amount0),
                amount1Min: _getMinLiquidity(amount1),
                deadline: block.timestamp
            })
        );
    }

    /// @notice Remove specified tokenId liquidity and collect fees
    /// @dev Wrapper around `INonfungiblePositionManager.decreaseLiquidity` and `INonfungiblePositionManager.collect`
    function _removeLiquidityAndCollect(uint256 _tokenId, uint128 _liquidity)
        internal
        returns (
            uint256 amount0,
            uint256 amount1,
            uint256 collectedFee0,
            uint256 collectedFee1
        )
    {
        (amount0, amount1) = _amountsForLiquidity(
            PoolAddress.computeAddress(
                positionManager.factory(),
                PoolAddress.getPoolKey(systemCoin, address(fei()), POOL_FEE)
            ),
            positionTickLower,
            positionTickUpper,
            _liquidity
        );
        positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: _tokenId,
                liquidity: _liquidity,
                amount0Min: amount0,
                amount1Min: amount1,
                deadline: block.timestamp
            })
        );
        (collectedFee0, collectedFee1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
    }

    /// @dev Wrapper around `LiquidityAmounts.getAmountsForLiquidity()`.
    function _amountsForLiquidity(
        address _pool,
        int24 _tickLower,
        int24 _tickUpper,
        uint128 _liquidity
    ) internal view returns (uint256, uint256) {
        (uint160 sqrtRatioX96, , , , , , ) = IUniswapV3PoolState(_pool).slot0();
        return
            LiquidityAmounts.getAmountsForLiquidity(
                sqrtRatioX96,
                TickMath.getSqrtRatioAtTick(_tickLower),
                TickMath.getSqrtRatioAtTick(_tickUpper),
                _liquidity
            );
    }

    /// @dev Wrapper around `INonfungiblePositionManager.positions()`
    function _position(uint256 _tokenId)
        internal
        view
        returns (
            uint96,
            address,
            address,
            address,
            uint24,
            int24,
            int24,
            uint128,
            uint256,
            uint256,
            uint128,
            uint128
        )
    {
        return positionManager.positions(_tokenId);
    }

    /// @notice used as slippage protection when adding liquidity to the pool
    function _getMinLiquidity(uint256 _amount) internal view returns (uint256) {
        return
            (_amount * (Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)) /
            Constants.BASIS_POINTS_GRANULARITY;
    }

    /// @notice used as slippage protection when swap pcv asset for RAI
    /// @param _token ChainLink oracle wrapper that Fei is managing.
    ///     this oracle is expected to return 0 decimals price denominated in USD. for example DPI/USD oracle sholud return "400"
    /// @param _safetyPrice ETH collateral price denominated in RAI
    /// @param _amountIn amount of token to swap for RAI
    function _getMinAcceptableAmountOut(
        address _token,
        uint256 _safetyPrice,
        uint256 _amountIn
    ) internal view returns (uint256) {
        (Decimal.D256 memory oraclePrice, bool valid) = tokenSwapParams[_token].oracle.read();
        require(valid, "RaiPCVDepositUniV3Lp: oracle returned invalid price");

        uint256 scaleFactor = 10**IERC20Metadata(_token).decimals();

        // (usdPerToken [0] * safeyPrice [ray]) * wad / usdPerEth [wad]
        Decimal.D256 memory raiPerToken = oraclePrice.mul(_safetyPrice).div(readOracle()); // [ray]
        Decimal.D256 memory amountOut = raiPerToken.mul(_amountIn).div(10**9).div(scaleFactor); // 18 decimals
        Decimal.D256 memory maxSlippage = Decimal.ratio(
            Constants.BASIS_POINTS_GRANULARITY - maxSlippageBasisPoints,
            Constants.BASIS_POINTS_GRANULARITY
        );
        Decimal.D256 memory acceptableAmountOut = maxSlippage.mul(amountOut);
        return acceptableAmountOut.asUint256();
    }

    // #### Reflexer ####

    /// @notice Register saviour and insure SAFE. Specified NFT LP will be transfered to saviour.
    /// @param _safeId safeId
    /// @param _tokenId UniswapV3 NFT to deposit
    function _protectSAFE(uint256 _safeId, uint256 _tokenId) internal {
        safeManager.protectSAFE(
            _safeId,
            address(GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).liquidationEngine()),
            safeSaviour
        );
        GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).deposit(_safeId, _tokenId);
    }

    /// @notice Withdraw left tokens from saviour because LP position is removed when saviour exercises the protectin
    /// @param _safeId safeId that given by SAFEManager
    function _withdrawDusts(uint256 _safeId) internal {
        address[] memory tokens = new address[](2);
        tokens[0] = systemCoin;
        tokens[1] = address(fei());
        GeneralUnderlyingMaxUniswapV3SafeSaviourLike(safeSaviour).getReserves(_safeId, tokens, address(this));
    }

    // #### WETH ####
    function _wrap(uint256 amount) internal {
        IWETH(positionManager.WETH9()).deposit{value: amount}();
    }

    function _unwrap(uint256 amount) internal {
        IWETH(positionManager.WETH9()).withdraw(amount);
    }

    // #### Utils ####

    /// @notice approves a token for the router
    function _approveToken(address token, address spender) internal {
        uint256 maxTokens = type(uint256).max;
        IERC20(token).approve(spender, maxTokens);
    }
}
