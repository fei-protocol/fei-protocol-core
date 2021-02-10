pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IPool.sol";
import "../utils/Timed.sol";
import "../external/Decimal.sol";

/// @title A fluid pool for earning a reward token with staked tokens
/// @author Fei Protocol
abstract contract Pool is IPool, ERC20, Timed {
    using Decimal for Decimal.D256;

    bool internal initialized;

    /// @notice the ERC20 reward token
    IERC20 public override rewardToken;
    
    /// @notice the ERC20 staked token
    IERC20 public override stakedToken;

    /// @notice the total amount of rewards previously claimed
    uint256 public override claimedRewards;

    /// @notice the total amount of staked tokens in the contract
    uint256 public override totalStaked;

    /// @notice the staked balance of a given account
    mapping(address => uint256) public override stakedBalance;

    /// @notice Pool constructor
    /// @param _duration duration of the pool reward distribution
    /// @param _name the name of the pool token
    /// @param _ticker the token ticker for the pool token
    constructor(
        uint256 _duration,
        string memory _name,
        string memory _ticker
    ) public ERC20(_name, _ticker) Timed(_duration) {}

    /// @notice collect redeemable rewards without unstaking
    /// @param from the account to claim for
    /// @param to the account to send rewards to
    /// @return amountReward the amount of reward claimed
    /// @dev redeeming on behalf of another account requires ERC-20 approval of the pool tokens
    function claim(address from, address to)
        external
        override
        returns (uint256 amountReward)
    {
        amountReward = _claim(from, to);
        emit Claim(from, to, amountReward);
        return amountReward;
    }

    /// @notice deposit staked tokens
    /// @param to the account to deposit to
    /// @param amount the amount of staked to deposit
    /// @dev requires ERC-20 approval of stakedToken for the Pool contract
    function deposit(address to, uint256 amount) external override {
        address from = msg.sender;
        _deposit(from, to, amount);
        emit Deposit(from, to, amount);
    }

    /// @notice claim all rewards and withdraw stakedToken
    /// @param to the account to send withdrawn tokens to
    /// @return amountStaked the amount of stakedToken withdrawn
    /// @return amountReward the amount of rewardToken received
    function withdraw(address to)
        external
        override
        returns (uint256 amountStaked, uint256 amountReward)
    {
        address from = msg.sender;

        // claim before withdrawing
        amountReward = _claim(from, to);
        amountStaked = _withdraw(from, to);

        emit Withdraw(from, to, amountStaked, amountReward);
        return (amountStaked, amountReward);
    }

    /// @notice initializes the pool start time. Only callable once
    function init() public virtual override {
        require(!initialized, "Pool: Already initialized");
        _initTimed();
        initialized = true;
    }

    /// @notice the amount of rewards currently redeemable by an account
    /// @param account the potentially redeeming account
    /// @return amountReward the amount of reward tokens
    /// @return amountPool the amount of redeemable pool tokens
    function redeemableReward(address account)
        public
        view
        override
        returns (uint256 amountReward, uint256 amountPool)
    {
        amountPool = _redeemablePoolTokens(account);
        uint256 totalRedeemablePool = _totalRedeemablePoolTokens();
        if (totalRedeemablePool == 0) {
            return (0, 0);
        }
        // return proportion of user's redeemable pool tokens to the total times released reward
        return (
            releasedReward().mul(amountPool) / totalRedeemablePool,
            amountPool
        );
    }

    /// @notice the total amount of rewards owned by contract and unlocked for release
    function releasedReward() public view override returns (uint256) {
        uint256 total = rewardBalance();
        uint256 unreleased = unreleasedReward();
        return total.sub(unreleased, "Pool: Released Reward underflow");
    }

    /// @notice the total amount of rewards owned by contract and locked
    function unreleasedReward() public view override returns (uint256) {
        if (isTimeEnded()) {
            return 0;
        }
        return
            _unreleasedReward(
                totalReward(),
                uint256(duration),
                uint256(timeSinceStart())
            );
    }

    /// @notice the total amount of rewards distributed by the contract over entire period
    function totalReward() public view override returns (uint256) {
        return rewardBalance().add(claimedRewards);
    }

    /// @notice the total balance of rewards owned by contract, locked or unlocked
    function rewardBalance() public view override returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }

    function _burnFrom(address account, uint256 amount) internal {
        if (msg.sender != account) {
            uint256 decreasedAllowance =
                allowance(account, _msgSender()).sub(
                    amount,
                    "Pool: burn amount exceeds allowance"
                );
            _approve(account, _msgSender(), decreasedAllowance);
        }
        _burn(account, amount);
    }

    function _totalRedeemablePoolTokens() internal view returns (uint256) {
        uint256 total = totalSupply();
        uint256 balance = _timeWeightedFinalBalance(totalStaked);
        return total.sub(balance, "Pool: Total redeemable underflow");
    }

    function _redeemablePoolTokens(address account)
        internal
        view
        returns (uint256)
    {
        uint256 total = balanceOf(account);
        uint256 balance = _timeWeightedFinalBalance(stakedBalance[account]);
        return total.sub(balance, "Pool: Redeemable underflow");
    }

    /// @notice the function for calculating how much of the rewards remain unreleased after a certain period
    function _unreleasedReward(
        uint256 _totalReward,
        uint256 _duration,
        uint256 _time
    ) internal view virtual returns (uint256);

    function _deposit(
        address from,
        address to,
        uint256 amount
    ) internal {
        require(initialized, "Pool: Uninitialized");
        require(
            amount <= stakedToken.balanceOf(from),
            "Pool: Balance too low to stake"
        );

        // deposit staked tokens
        TransferHelper.safeTransferFrom(
            address(stakedToken),
            from,
            address(this),
            amount
        );

        stakedBalance[to] = stakedBalance[to].add(amount);
        _incrementStaked(amount);

        // reward user with time weighted balance of tokens to the end of the period
        uint256 poolTokens = _timeWeightedFinalBalance(amount);
        require(poolTokens != 0, "Pool: Window has ended");

        _mint(to, poolTokens);
    }

    function _withdraw(address from, address to)
        internal
        returns (uint256 amountStaked)
    {
        // reset staked balances
        amountStaked = stakedBalance[from];
        stakedBalance[from] = 0;
        _decrementStaked(amountStaked);

        // transfer tokens
        stakedToken.transfer(to, amountStaked);

        // burn pool tokens
        uint256 amountPool = balanceOf(from);
        if (amountPool != 0) {
            _burnFrom(from, amountPool);
        }
        return amountStaked;
    }

    function _claim(address from, address to) internal returns (uint256) {
        (uint256 amountReward, uint256 amountPool) = redeemableReward(from);
        require(amountPool != 0, "Pool: User has no redeemable pool tokens");
        require(to != address(this), "Pool: cannot claim to pool");

        _burnFrom(from, amountPool);
        _incrementClaimed(amountReward);

        rewardToken.transfer(to, amountReward);
        return amountReward;
    }

    function _incrementClaimed(uint256 amount) internal {
        claimedRewards = claimedRewards.add(amount);
    }

    function _incrementStaked(uint256 amount) internal {
        totalStaked = totalStaked.add(amount);
    }

    function _decrementStaked(uint256 amount) internal {
        totalStaked = totalStaked.sub(amount);
    }

    function _timeWeightedFinalBalance(uint256 amount)
        internal
        view
        returns (uint256)
    {
        return amount.mul(remainingTime());
    }

    // Updates stored staked balance pro-rata for transfer and transferFrom
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (from != address(0) && to != address(0)) {
            Decimal.D256 memory ratio = Decimal.ratio(amount, balanceOf(from));
            uint256 amountStaked = ratio.mul(stakedBalance[from]).asUint256();

            stakedBalance[from] = stakedBalance[from].sub(amountStaked);
            stakedBalance[to] = stakedBalance[to].add(amountStaked);
        }
    }

    function _setTokens(address _rewardToken, address _stakedToken) internal {
        rewardToken = IERC20(_rewardToken);
        stakedToken = IERC20(_stakedToken);
    }
}
