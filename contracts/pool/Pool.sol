pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IPool.sol";
import "../utils/Timed.sol";
import "../external/Decimal.sol";

/// @title abstract implementation of IPool interface
/// @author Fei Protocol
abstract contract Pool is IPool, ERC20, Timed {
    using Decimal for Decimal.D256;

    bool internal initialized;

    IERC20 public override rewardToken;
    IERC20 public override stakedToken;

    uint256 public override claimedRewards;
    uint256 public override totalStaked;

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

    function claim(address from, address to)
        external
        override
        returns (uint256 amountReward)
    {
        amountReward = _claim(from, to);
        emit Claim(from, to, amountReward);
        return amountReward;
    }

    function deposit(address to, uint256 amount) external override {
        address from = msg.sender;
        _deposit(from, to, amount);
        emit Deposit(from, to, amount);
    }

    function withdraw(address to)
        external
        override
        returns (uint256 amountStaked, uint256 amountReward)
    {
        address from = msg.sender;
        amountReward = _claim(from, to);
        amountStaked = _withdraw(from, to);
        emit Withdraw(from, to, amountStaked, amountReward);
        return (amountStaked, amountReward);
    }

    function init() public virtual override {
        require(!initialized, "Pool: Already initialized");
        _initTimed();
        initialized = true;
    }

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
        return (
            releasedReward().mul(amountPool) / totalRedeemablePool,
            amountPool
        );
    }

    function releasedReward() public view override returns (uint256) {
        uint256 total = rewardBalance();
        uint256 unreleased = unreleasedReward();
        return total.sub(unreleased, "Pool: Released Reward underflow");
    }

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

    function totalReward() public view override returns (uint256) {
        return rewardBalance().add(claimedRewards);
    }

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

        TransferHelper.safeTransferFrom(
            address(stakedToken),
            from,
            address(this),
            amount
        );

        stakedBalance[to] = stakedBalance[to].add(amount);
        _incrementStaked(amount);

        uint256 poolTokens = _timeWeightedFinalBalance(amount);
        require(poolTokens != 0, "Pool: Window has ended");

        _mint(to, poolTokens);
    }

    function _withdraw(address from, address to)
        internal
        returns (uint256 amountStaked)
    {
        amountStaked = stakedBalance[from];
        stakedBalance[from] = 0;
        _decrementStaked(amountStaked);

        stakedToken.transfer(to, amountStaked);

        uint256 amountPool = balanceOf(from);
        if (amountPool != 0) {
            _burnFrom(from, amountPool);
        }
        return amountStaked;
    }

    function _claim(address from, address to) internal returns (uint256) {
        (uint256 amountReward, uint256 amountPool) = redeemableReward(from);
        require(amountPool != 0, "Pool: User has no redeemable pool tokens");

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
