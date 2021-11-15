// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../uniswap/UniswapPCVDeposit.sol";

// Angle PoolManager contract
interface IPoolManager {
    function token() external returns (address);
}

// Angle StableMaster contract
interface IStableMaster {
    function agToken() external returns (address);

    function mint(
        uint256 amount,
        address user,
        IPoolManager poolManager,
        uint256 minStableAmount
    ) external;

    function burn(
        uint256 amount,
        address burner,
        address dest,
        IPoolManager poolManager,
        uint256 minCollatAmount
    ) external;
}

// Angle StakingRewards contract
interface IStakingRewards {
    function stakingToken() external returns (address);

    function balanceOf(address account) external view returns (uint256);

    function stake(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getReward() external;
}

/// @title implementation for Angle PCV Deposit
/// @author Angle Core Team and Fei Protocol
contract AngleUniswapPCVDeposit is UniswapPCVDeposit {
    using Decimal for Decimal.D256;

    /// @notice the Angle StableMaster contract
    IStableMaster public immutable stableMaster;

    /// @notice the Angle PoolManager contract
    IPoolManager public poolManager;

    /// @notice the Angle StakingRewards contract
    IStakingRewards public stakingRewards;

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
        IStableMaster _stableMaster,
        IPoolManager _poolManager,
        IStakingRewards _stakingRewards
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

    /// @notice mint agToken from FEI held on this contract
    /// @dev the call will revert if slippage is too high compared to oracle.
    function mintAgToken(uint256 amountFei)
        public
        onlyPCVController
    {
        uint256 minAgTokenOut = Decimal.from(amountFei)
          .div(readOracle())
          .mul(Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)
          .div(Constants.BASIS_POINTS_GRANULARITY)
          .asUint256();

        uint256 agTokenBalanceBefore = IERC20(token).balanceOf(address(this));
        stableMaster.mint(
            amountFei,
            address(this),
            poolManager,
            0
        );
        uint256 agTokenBalanceAfter = IERC20(token).balanceOf(address(this));
        require(agTokenBalanceAfter - agTokenBalanceBefore > minAgTokenOut, "AngleUniswapPCVDeposit: slippage on mint");
    }

    /// @notice mint agToken from ALL FEI held on this contract
    /// See mintAgToken(uint256 amount).
    function mintAgTokenAll()
        external
        onlyPCVController
    {
        mintAgToken(IERC20(fei()).balanceOf(address(this)));
    }

    /// @notice burn agToken for FEI
    /// @dev the call will revert if slippage is too high compared to oracle
    function burnAgToken(uint256 amountAgToken)
        public
        onlyPCVController
    {
        uint256 minFeiOut = readOracle() // FEI per X
          .mul(amountAgToken)
          .mul(Constants.BASIS_POINTS_GRANULARITY - maxBasisPointsFromPegLP)
          .div(Constants.BASIS_POINTS_GRANULARITY)
          .asUint256();

        uint256 feiBalanceBefore = fei().balanceOf(address(this));
        stableMaster.burn(
            amountAgToken,
            address(this),
            address(this),
            poolManager,
            0
        );
        uint256 feiBalanceAfter = fei().balanceOf(address(this));
        require(feiBalanceAfter - feiBalanceBefore > minFeiOut, "AngleUniswapPCVDeposit: slippage on burn");

        _burnFeiHeld(); // burn FEI held (after redeeming agTokens, we have some)
    }

    /// @notice burn ALL agToken held for FEI
    /// @dev see burnAgToken(uint256 amount).
    function burnAgTokenAll()
        external
        onlyPCVController
    {
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
    function setStakingRewards(IStakingRewards _stakingRewards)
        public
        onlyGovernor
    {
        require(
            address(_stakingRewards) != address(0),
            "AngleUniswapPCVDeposit: zero address"
        );
        stakingRewards = _stakingRewards;
    }

    /// @notice set a new poolManager address
    /// @param _poolManager the new poolManager
    function setPoolManager(IPoolManager _poolManager)
        public
        onlyGovernor
    {
        require(
            address(_poolManager) != address(0),
            "AngleUniswapPCVDeposit: zero address"
        );
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
        uint256 balanceBefore = pair.balanceOf(address(this));
        super._addLiquidity(tokenAmount, feiAmount);
        uint256 balanceAfter = pair.balanceOf(address(this));
        stakingRewards.stake(balanceAfter - balanceBefore);
    }
}
