// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../../refs/UniV3Ref.sol";
import "../../refs/RaiRef.sol";
import "../PCVDeposit.sol";

import { GeneralUnderlyingMaxUniswapV3SafeSaviourLike } from "./GeneralUnderlyingMaxUniswapV3SafeSaviourLike.sol";

import "./uni-v3/ISwapRouter.sol";
import "./uni-v3/IUniswapV3PoolState.sol";
import "./uni-v3/LiquidityAmounts.sol";
import "./uni-v3/TickMath.sol";
import "./uni-v3/PoolAddress.sol";

import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

contract RaiPCVDepositUniV3Lp is PCVDeposit, RaiRef, UniV3Ref {
    using Decimal for Decimal.D256;

    struct SwapParams {
        uint256 minimumAmountIn;
        IOracle oracle;
        uint24 poolFee;
    }

    uint24 private constant POOL_FEE = 500;

    /// @notice position range
    int24 private _positionTickLower = -887272;
    int24 private _positionTickUpper = 887272;

    /// @dev SAFE saviour https://docs.reflexer.finance/liquidation-protection/safe-protection
    address private _safeSaviour;

    /// @dev V3 router
    ISwapRouter public router;

    uint256 public maxSlippageBasisPoints = 1000;

    /// @notice PCV assets address approved to swap those for RAI
    address[10] public tokenSpents;

    /// @notice mapping PCV assets address to params
    mapping(address => SwapParams) public tokenSwapParams;

    uint256 public maximumAvailableETH = 100 ether;
    uint256 public targetCRatio = 2 * WAD;

    event MaxSlippageUpdate(uint256 oldMaxSlippage, uint256 newMaximumSlippageBasisPoints);
    event PositionTicksUpdate(int24 oldTickLower, int24 oldTickUpper, int24 newTickLower, int24 newTickUpper);
    event MaximumAvailableETHUpdate(uint256 oldMaximumAvailableETH, uint256 newMaximumAvailableETH);
    event TargetCollateralRatioUpdate(uint256 oldCRatio, uint256 newCRatio);
    event SwapTokenApprovalUpdate(address token);

    constructor(
        address core_,
        address positionManager_,
        address oracle_,
        address backupOracle_,
        address collateralJoin_,
        address coinJoin_,
        address safeSaviour_,
        address safeManager_,
        address router_
    )
        RaiRef(collateralJoin_, coinJoin_, safeManager_)
        UniV3Ref(core_, positionManager_, address(ICoinJoin(coinJoin_).systemCoin()), oracle_, backupOracle_)
    {
        _safeSaviour = safeSaviour_;
        router = ISwapRouter(router_);

        // Approve position manager using RAI
        _approveToken(_systemCoin, positionManager_);

        // Approve position manager using FEI
        _approveToken(address(fei()), positionManager_);

        // Approve CollateralJoin using WETH for join()/exit()
        _approveToken(positionManager.WETH9(), collateralJoin_);

        // Approve coinJoin using RAI
        _approveToken(_systemCoin, coinJoin_);
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
            (, , uint256 safetyPrice, , , ) = _safeEngine().collateralTypes(COLLATERAL_TYPE);
            uint256 feiAmount = readOracle().mul(RAY).div(safetyPrice).mul(debtToGenerate).asUint256();

            address owner;
            uint128 liquidity;
            uint256 _tokenId = tokenId;
            if (_tokenId != 0) {
                owner = positionManager.ownerOf(_tokenId);
                (, , , , , , , liquidity, , , , ) = _position(_tokenId);
            }
            if (liquidity == 0) {
                uint256 _safeId = safeId;

                // If protection was exercised, withdraw left tokens
                if (owner == _safeSaviour) {
                    _withdrawDusts(_safeId);
                }
                // Add liquidity and protect SAFE
                (_tokenId, , , ) = _mintLiquidity(debtToGenerate, feiAmount);
                tokenId = _tokenId;

                // Protect SAFE using UniV3 position NFT
                positionManager.approve(_safeSaviour, _tokenId);
                safeManager.protectSAFE(
                    _safeId,
                    address(GeneralUnderlyingMaxUniswapV3SafeSaviourLike(_safeSaviour).liquidationEngine()),
                    _safeSaviour
                );
                GeneralUnderlyingMaxUniswapV3SafeSaviourLike(_safeSaviour).deposit(_safeId, _tokenId);
            } else if (owner == _safeSaviour) {
                _increaseLiquidity(_tokenId, debtToGenerate, feiAmount);
            }

            _burnFeiHeld(); // burn any FEI dust from LP
        }

        emit Deposit(msg.sender, debtToGenerate);
    }

    // ----------- PCV Controller only state changing api -----------

    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        require(to != address(0), "RaiPCVDepositUniV3Lp: to address zero");
        (uint256 safeCollateral, uint256 safeDebt) = safeData();
        require(safeCollateral >= amount, "RaiPCVDepositUniV3Lp: exceed withdrawable collateral");
        uint256 safeCollateralRequired = _getCollateralRequired(safeDebt, targetCRatio);

        // If there is room in target collateral rate and current one, there’s no need to repay debt.
        uint256 debtRepaid;
        if (!(safeCollateral >= safeCollateralRequired && (safeCollateral - safeCollateralRequired) >= amount)) {
            debtRepaid = safeDebt - _getDebtDesired(safeCollateral - amount, targetCRatio);
            uint256 raiBalance = _balanceSystemCoin();
            // Remove LP position if there is not enough RAI to repay in this contract
            if (raiBalance < debtRepaid) {
                uint256 _tokenId = tokenId;
                if (_tokenId != 0 && positionManager.ownerOf(_tokenId) == _safeSaviour) {
                    tokenId = 0; // Effect
                    _removeProtection(safeId, _tokenId);
                    raiBalance = _balanceSystemCoin();
                }
            }
            // Swap PCV assets if there is not enough RAI to repay by simply removing LP due to IL.
            if (raiBalance < debtRepaid) {
                address token;
                bool native;
                uint256 amountIn;
                uint256 amountOut;
                for (uint256 i; i < 10; i++) {
                    token = tokenSpents[i];
                    if (tokenSpents[i] == address(0)) break;
                    native = token == positionManager.WETH9();
                    amountIn = native ? address(this).balance : IERC20(token).balanceOf(address(this));

                    if (amountIn >= tokenSwapParams[token].minimumAmountIn) {
                        amountOut = router.exactInputSingle{value: native ? amountIn : 0}(
                            ISwapRouter.ExactInputSingleParams({
                                tokenIn: token,
                                tokenOut: _systemCoin,
                                fee: tokenSwapParams[token].poolFee,
                                recipient: address(this),
                                deadline: block.timestamp,
                                amountIn: amountIn,
                                amountOutMinimum: _getMinAmountOut(token, amountIn),
                                sqrtPriceLimitX96: 0 // Set this to zero - which makes this parameter inactive. this value can be used to set the limit for the price the swap will push the pool to, which can help protect against price impact
                            })
                        );
                        raiBalance += amountOut;
                        if (raiBalance >= debtRepaid) break;
                    }
                }
                require(raiBalance >= debtRepaid, "RaiPCVDepositUniV3Lp: insufficient balance to repay");
            }
        }

        _freeETHAndRepayDebt(safeId, amount, debtRepaid);
        _unwrap(amount);
        _burnFeiHeld();
        Address.sendValue(payable(to), amount);

        emit Withdrawal(msg.sender, to, amount);
    }

    // ----------- Governor only state changing api -----------

    /// @notice sets the new slippage parameter for swaping
    /// @param _maxSlipageBasisPoints the new slipage
    function setMaxSlippageBasisPoints(uint256 _maxSlipageBasisPoints) external onlyGovernorOrAdmin {
        require(_maxSlipageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RaiPCVDepositUniV3Lp: slipage too high");

        uint256 oldMaxSlipageBasisPoints = maxSlippageBasisPoints;
        maxSlippageBasisPoints = _maxSlipageBasisPoints;

        emit MaxSlippageUpdate(oldMaxSlipageBasisPoints, _maxSlipageBasisPoints);
    }

    /// @param _tokens token addresses to swap for RAI.
    /// @param _swapParamsData data that include its oracle and mimimum input amount
    function setSwapTokenApproval(address[10] memory _tokens, SwapParams[10] memory _swapParamsData)
        external
        onlyGovernor
    {
        address token;
        for (uint256 i; i < 10; i++) {
            token = _tokens[i];
            if (token == address(0)) {
                // check
                require(address(_swapParamsData[i].oracle) == address(0), "RaiPCVDepositUniV3Lp: inconsistent input");
                return;
            }
            tokenSpents[i] = token;
            require(address(_swapParamsData[i].oracle) != address(0), "RaiPCVDepositUniV3Lp: oracle address zero");

            tokenSwapParams[token] = _swapParamsData[i];
            emit SwapTokenApprovalUpdate(token);

            _approveToken(token, address(router));
        }
    }

    /// @param _tickLower Position tick lower
    /// @param _tickUpper Position tick upper
    function setPositionTicks(int24 _tickLower, int24 _tickUpper) external onlyGovernor {
        require(_tickUpper > _tickLower, "RaiPCVDepositUniV3Lp:reversed order");
        require(
            _tickLower >= TickMath.MIN_TICK && TickMath.MAX_TICK >= _tickUpper,
            "RaiPCVDepositUniV3Lp: max/min tick range"
        );

        int24 oldTickLower = _positionTickLower;
        int24 oldTickUpper = _positionTickUpper;
        _positionTickLower = _tickLower;
        _positionTickUpper = _tickUpper;

        emit PositionTicksUpdate(oldTickLower, oldTickUpper, _tickLower, _tickUpper);

        uint256 _tokenId = tokenId;
        if (_tokenId != 0 && positionManager.ownerOf(_tokenId) == _safeSaviour) {
            tokenId = 0;
            _removeProtection(safeId, _tokenId);
        }
    }

    /// @param _maximumAvailableETH eth collateral ceiling that this contract can use
    function setMaxAvailableETH(uint256 _maximumAvailableETH) external onlyGovernor {
        require(_maximumAvailableETH > WAD, "RaiPCVDepositUniV3Lp: too small");

        uint256 oldMaximumAvailableETH = maximumAvailableETH;
        maximumAvailableETH = _maximumAvailableETH;

        emit MaximumAvailableETHUpdate(oldMaximumAvailableETH, _maximumAvailableETH);
    }

    /// @param _targetCRatio target collateral ratio, e.g. cRatio 100% => 1e18
    function setTargetCollateralRatio(uint256 _targetCRatio) external onlyGovernor {
        require(_targetCRatio > WAD, "RaiPCVDepositUniV3Lp: target ratio too low");

        uint256 oldTargetCRatio = targetCRatio;
        targetCRatio = _targetCRatio;

        emit TargetCollateralRatioUpdate(oldTargetCRatio, _targetCRatio);
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
                        PoolAddress.getPoolKey(_systemCoin, address(fei()), POOL_FEE)
                    ),
                    _positionTickLower,
                    _positionTickUpper,
                    liquidity
                );
            }
            amount0 += tokensOwed0;
            amount1 += tokensOwed1;
        }
    }

    /// @notice gets the token address in which this deposit returns its balance
    function balanceReportedIn() external view override returns (address) {
        return _systemCoin;
    }

    /// @notice gets the effective balance of "balanceReportedIn" token if the deposit were fully withdrawn
    function balance() public view override returns (uint256) {
        (uint256 amount0, uint256 amount1) = getPositionAmounts();
        return _inverse() ? amount1 : amount0;
    }

    /// @notice gets the resistant token balance and protocol owned fei of this deposit
    /// @return amount0 number of other token in pool
    /// @return amount1 number of FEI in pool
    function resistantBalanceAndFei() public view override returns (uint256 amount0, uint256 amount1) {
        (amount0, amount1) = getPositionAmounts();
        uint256 feiAmount = fei().balanceOf(address(this));
        uint256 tokenAmount = _balanceSystemCoin();
        (amount0, amount1)  = _inverse() ? (amount0 + feiAmount, amount1 + tokenAmount) : (amount0 + tokenAmount, amount1 + feiAmount);
    }

    // ----------- Internal functions -----------

    function _removeProtection(uint _safeId, uint _tokenId) internal {
        (, , , , , , , uint128 liquidity, , , , ) = _position(_tokenId);
        // if liquidity equals 0, protection was exercised
        if (liquidity == 0) {
            _withdrawDusts(_safeId); // withdraw left tokens in saviour
        } else {
            // Protection was not exercised, withdraw NFT LP and remove liquidity
            GeneralUnderlyingMaxUniswapV3SafeSaviourLike(_safeSaviour).withdraw(
                _safeId,
                _tokenId,
                address(this)
            );
            _removeLiquidityAndCollect(_tokenId, liquidity);
        }
    }

    // #### UniswapV3 ####

    /// @dev Wrapper around `INonfungiblePositionManager.mint`
    function _mintLiquidity(
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
        // (address token0, address token1, uint256 amount0, uint256 amount1) = AddressOrder.sort(address(fei()), _systemCoin, _feiAmount, _tokenAmount);
        (address token0, address token1, uint256 amount0, uint256 amount1) = _inverse()
            ? (address(fei()), _systemCoin, _feiAmount, _tokenAmount)
            : (_systemCoin, address(fei()), _tokenAmount, _feiAmount);

        _mintFei(address(this), _feiAmount);

        return
            positionManager.mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: POOL_FEE,
                    tickLower: _positionTickLower,
                    tickUpper: _positionTickUpper,
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: _getMinAcceptableAmount(amount0),
                    amount1Min: _getMinAcceptableAmount(amount1),
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

        // ( , , uint256 amount0, uint256 amount1) = AddressOrder.sort(address(fei()), _systemCoin, _feiAmount, _tokenAmount);
        (uint256 amount0, uint256 amount1) = _inverse()
            ? (_feiAmount, _tokenAmount)
            : (_tokenAmount, _feiAmount);
        positionManager.increaseLiquidity(
            INonfungiblePositionManager.IncreaseLiquidityParams({
                tokenId: _tokenId,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: _getMinAcceptableAmount(amount0),
                amount1Min: _getMinAcceptableAmount(amount1),
                deadline: block.timestamp
            })
        );
    }

    /// @notice Remove specified tokenId liquidity and collect fees
    /// @dev Wrapper around `INonfungiblePositionManager.decreaseLiquidity` and `INonfungiblePositionManager.collect`
    function _removeLiquidityAndCollect(uint256 _tokenId, uint128 _liquidity)
        internal
    {
        (uint256 amount0, uint256 amount1) = _amountsForLiquidity(
            PoolAddress.computeAddress(
                positionManager.factory(),
                PoolAddress.getPoolKey(_systemCoin, address(fei()), POOL_FEE)
            ),
            _positionTickLower,
            _positionTickUpper,
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
        positionManager.collect(
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
    function _getMinAcceptableAmount(uint256 _amount) internal view returns (uint256) {
        return
            (_amount * (Constants.BASIS_POINTS_GRANULARITY - maxSlippageBasisPoints)) /
            Constants.BASIS_POINTS_GRANULARITY;
    }

    /// @notice used as slippage protection when swap pcv asset for RAI
    /// @param _token ChainLink oråacle wrapper that Fei is managing.
    ///     this oracle is expected to return 0 decimals price denominated in USD. for example DPI/USD oracle sholud return "400"
    /// @param _amountIn amount of token to swap for RAI
    function _getMinAmountOut(
        address _token,
        uint256 _amountIn
    ) internal view returns (uint256) {
        (Decimal.D256 memory oraclePrice, bool valid) = tokenSwapParams[_token].oracle.read();
        require(valid, "RaiPCVDepositUniV3Lp: oracle returned invalid price");

        uint256 amountOut = oraclePrice.mul(_amountIn).mul(WAD).div(10**IERC20Metadata(_token).decimals()).asUint256(); // 18 decimals
        return _getMinAcceptableAmount(amountOut);
    }

    // #### Reflexer ####

    /// @notice Withdraw left tokens from saviour because LP position is removed when saviour exercises the protectin
    /// @param _safeId safeId that given by SAFEManager
    function _withdrawDusts(uint256 _safeId) internal {
        address[] memory tokens = new address[](2);
        tokens[0] = _systemCoin;
        tokens[1] = address(fei());
        GeneralUnderlyingMaxUniswapV3SafeSaviourLike(_safeSaviour).getReserves(_safeId, tokens, address(this));
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
        IERC20(token).approve(spender, type(uint256).max);
    }

    /// @dev This function is gas optimized to avoid a redundant extcodesize check in addition to the returndatasize
    function _balanceSystemCoin() private view returns (uint256) {
         (bool success, bytes memory data) = _systemCoin.staticcall(abi.encodeWithSelector(IERC20.balanceOf.selector, address(this)));
         require(success && data.length >= 32);
         return abi.decode(data, (uint256));
    }

    function _inverse() private view returns(bool) {
        return address(fei()) < _systemCoin;
    }
}
