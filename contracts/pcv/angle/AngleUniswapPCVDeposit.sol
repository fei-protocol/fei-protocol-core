// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IAngleStableMaster.sol";
import "./IAngleStakingRewards.sol";
import "../uniswap/UniswapPCVDeposit.sol";

/// @title implementation for Angle PCV Deposit
/// @author Angle Core Team and Fei Protocol
contract AngleUniswapPCVDeposit is UniswapPCVDeposit {
    using Decimal for Decimal.D256;

    /// @notice the Angle StableMaster contract
    IAngleStableMaster public immutable stableMaster;

    /// @notice the Angle PoolManager contract
    IAnglePoolManager public poolManager;

    /// @notice the Angle StakingRewards contract
    IAngleStakingRewards public stakingRewards;

    /// @notice Uniswap PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pair Uniswap Pair to deposit to
    /// @param _router Uniswap Router
    /// @param _oracle oracle for reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _maxBasisPointsFromPegLP the max basis points of slippage from peg allowed on LP deposit
    constructor(
        address _core,
        address _pair,
        address _router,
        address _oracle,
        address _backupOracle,
        uint256 _maxBasisPointsFromPegLP,
        IAngleStableMaster _stableMaster,
        IAnglePoolManager _poolManager,
        IAngleStakingRewards _stakingRewards
    ) UniswapPCVDeposit(_core, _pair, _router, _oracle, _backupOracle, _maxBasisPointsFromPegLP) {
        stableMaster = _stableMaster;
        poolManager = _poolManager;
        stakingRewards = _stakingRewards;
        require(_poolManager.token() == address(fei()), "AngleUniswapPCVDeposit: invalid poolManager");
        require(_stableMaster.agToken() == token, "AngleUniswapPCVDeposit: invalid stableMaster");
        require(_stakingRewards.stakingToken() == _pair, "AngleUniswapPCVDeposit: invalid stakingRewards");

        // Approve FEI on StableMaster to be able to mint agTokens
        SafeERC20.safeApprove(IERC20(address(fei())), address(_stableMaster), type(uint256).max);
        // Approve LP tokens on StakingRewards to earn ANGLE rewards
        SafeERC20.safeApprove(IERC20(_pair), address(_stakingRewards), type(uint256).max);
    }

    /// @notice claim staking rewards
    function claimRewards() external {
        stakingRewards.getReward();
    }

    /// @notice mint agToken from FEI
    /// @dev the call will revert if slippage is too high compared to oracle.
    function mintAgToken(uint256 amountFei) public onlyPCVController {
        // compute minimum amount out
        uint256 minAgTokenOut = Decimal
            .from(amountFei)
            .div(readOracle())
            .mul(Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();

        // mint FEI to self
        _mintFei(address(this), amountFei);

        // mint agToken from FEI
        stableMaster.mint(amountFei, address(this), poolManager, minAgTokenOut);
    }

    /// @notice burn agToken for FEI
    /// @dev the call will revert if slippage is too high compared to oracle
    function burnAgToken(uint256 amountAgToken) public onlyPCVController {
        // compute minimum of FEI out for agTokens burnt
        uint256 minFeiOut = readOracle() // FEI per X
            .mul(amountAgToken)
            .mul(Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)
            .div(Constants.BASIS_POINTS_GRANULARITY)
            .asUint256();

        // burn agTokens for FEI
        stableMaster.burn(amountAgToken, address(this), address(this), poolManager, minFeiOut);

        // burn FEI held (after redeeming agTokens, we have some)
        _burnFeiHeld();
    }

    /// @notice burn ALL agToken held for FEI
    /// @dev see burnAgToken(uint256 amount).
    function burnAgTokenAll() external onlyPCVController {
        burnAgToken(IERC20(token).balanceOf(address(this)));
    }

    /// @notice set the new pair contract
    /// @param _pair the new pair
    /// @dev also approves the router for the new pair token and underlying token
    function setPair(address _pair) public override onlyGovernor {
        super.setPair(_pair);
        SafeERC20.safeApprove(IERC20(_pair), address(stakingRewards), type(uint256).max);
    }

    /// @notice set a new stakingRewards address
    /// @param _stakingRewards the new stakingRewards
    function setStakingRewards(IAngleStakingRewards _stakingRewards) public onlyGovernor {
        require(address(_stakingRewards) != address(0), "AngleUniswapPCVDeposit: zero address");
        stakingRewards = _stakingRewards;
    }

    /// @notice set a new poolManager address
    /// @param _poolManager the new poolManager
    function setPoolManager(IAnglePoolManager _poolManager) public onlyGovernor {
        require(address(_poolManager) != address(0), "AngleUniswapPCVDeposit: zero address");
        poolManager = _poolManager;
    }

    /// @notice amount of pair liquidity owned by this contract
    /// @return amount of LP tokens
    function liquidityOwned() public view override returns (uint256) {
        return pair.balanceOf(address(this)) + stakingRewards.balanceOf(address(this));
    }

    function _removeLiquidity(uint256 liquidity) internal override returns (uint256) {
        stakingRewards.withdraw(liquidity);
        return super._removeLiquidity(liquidity);
    }

    function _addLiquidity(uint256 tokenAmount, uint256 feiAmount) internal override {
        super._addLiquidity(tokenAmount, feiAmount);
        uint256 lpBalanceAfter = pair.balanceOf(address(this));
        stakingRewards.stake(lpBalanceAfter);
    }
}
