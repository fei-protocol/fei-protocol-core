// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./manager/WeightedBalancerPoolManager.sol";
import "./IVault.sol";
import "../../utils/Timed.sol";
import "../../refs/OracleRef.sol";
import "../../core/TribeRoles.sol";
import "../IPCVSwapper.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title BalancerLBPSwapper
/// @author Fei Protocol
/// @notice an auction contract which cyclically sells one token for another using Balancer LBP
contract BalancerLBPSwapper is IPCVSwapper, OracleRef, Timed, WeightedBalancerPoolManager {
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;

    // ------------- Events -------------

    event WithdrawERC20(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    event ExitPool();

    event MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance);

    // ------------- Balancer State -------------
    /// @notice the Balancer LBP used for swapping
    IWeightedPool public pool;

    /// @notice the Balancer V2 Vault contract
    IVault public vault;

    /// @notice the Balancer V2 Pool id of `pool`
    bytes32 public pid;

    // Balancer constants for the weight changes
    uint256 public immutable SMALL_PERCENT;
    uint256 public immutable LARGE_PERCENT;

    // Balancer constants to memoize the target assets and weights from pool
    IAsset[] private assets;
    uint256[] private initialWeights;
    uint256[] private endWeights;

    // ------------- Swapper State -------------

    /// @notice the token to be auctioned
    address public immutable override tokenSpent;

    /// @notice the token to buy
    address public immutable override tokenReceived;

    /// @notice the address to send `tokenReceived`
    address public override tokenReceivingAddress;

    /// @notice the minimum amount of tokenSpent to kick off a new auction on swap()
    uint256 public minTokenSpentBalance;

    struct OracleData {
        address _oracle;
        address _backupOracle;
        // invert should be false if the oracle is reported in tokenSpent terms otherwise true
        bool _invertOraclePrice;
        // The decimalsNormalizer should be calculated as tokenSpent.decimals() - tokenReceived.decimals() if invert is false, otherwise reverse order
        int256 _decimalsNormalizer;
    }

    /**
    @notice constructor for BalancerLBPSwapper
    @param _core Core contract to reference
    @param oracleData The parameters needed to initialize the OracleRef
    @param _frequency minimum time between auctions and duration of auction
    @param _weightSmall the small weight of weight changes (e.g. 5%)
    @param _weightLarge the large weight of weight changes (e.g. 95%)
    @param _tokenSpent the token to be auctioned
    @param _tokenReceived the token to buy
    @param _tokenReceivingAddress the address to send `tokenReceived`
    @param _minTokenSpentBalance the minimum amount of tokenSpent to kick off a new auction on swap()
     */
    constructor(
        address _core,
        OracleData memory oracleData,
        uint256 _frequency,
        uint256 _weightSmall,
        uint256 _weightLarge,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _minTokenSpentBalance
    )
        OracleRef(
            _core,
            oracleData._oracle,
            oracleData._backupOracle,
            oracleData._decimalsNormalizer,
            oracleData._invertOraclePrice
        )
        Timed(_frequency)
        WeightedBalancerPoolManager()
    {
        // weight changes
        SMALL_PERCENT = _weightSmall;
        LARGE_PERCENT = _weightLarge;
        require(_weightSmall < _weightLarge, "BalancerLBPSwapper: bad weights");
        require(_weightSmall + _weightLarge == 1e18, "BalancerLBPSwapper: weights not normalized");

        // tokenSpent and tokenReceived are immutable
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;

        _setReceivingAddress(_tokenReceivingAddress);
        _setMinTokenSpent(_minTokenSpentBalance);

        _setContractAdminRole(keccak256("SWAP_ADMIN_ROLE"));
    }

    /**
    @notice initialize Balancer LBP
    Needs to be a separate method because this contract needs to be deployed and supplied
    as the owner of the pool on construction.
    Includes various checks to ensure the pool contract is correct and initialization can only be done once
    @param _pool the Balancer LBP used for swapping
    */
    function init(IWeightedPool _pool) external {
        require(address(pool) == address(0), "BalancerLBPSwapper: initialized");
        _initTimed();

        pool = _pool;
        IVault _vault = _pool.getVault();

        vault = _vault;

        // Check ownership
        require(_pool.getOwner() == address(this), "BalancerLBPSwapper: contract not pool owner");

        // Check correct pool token components
        bytes32 _pid = _pool.getPoolId();
        pid = _pid;
        (IERC20[] memory tokens, , ) = _vault.getPoolTokens(_pid);
        require(tokens.length == 2, "BalancerLBPSwapper: pool does not have 2 tokens");
        require(
            tokenSpent == address(tokens[0]) || tokenSpent == address(tokens[1]),
            "BalancerLBPSwapper: tokenSpent not in pool"
        );
        require(
            tokenReceived == address(tokens[0]) || tokenReceived == address(tokens[1]),
            "BalancerLBPSwapper: tokenReceived not in pool"
        );

        // Set the asset array and target weights
        assets = new IAsset[](2);
        assets[0] = IAsset(address(tokens[0]));
        assets[1] = IAsset(address(tokens[1]));

        bool tokenSpentAtIndex0 = tokenSpent == address(tokens[0]);
        initialWeights = new uint256[](2);
        endWeights = new uint256[](2);

        if (tokenSpentAtIndex0) {
            initialWeights[0] = LARGE_PERCENT;
            initialWeights[1] = SMALL_PERCENT;

            endWeights[0] = SMALL_PERCENT;
            endWeights[1] = LARGE_PERCENT;
        } else {
            initialWeights[0] = SMALL_PERCENT;
            initialWeights[1] = LARGE_PERCENT;

            endWeights[0] = LARGE_PERCENT;
            endWeights[1] = SMALL_PERCENT;
        }

        // Approve pool tokens for vault
        _pool.approve(address(_vault), type(uint256).max);
        IERC20(tokenSpent).approve(address(_vault), type(uint256).max);
        IERC20(tokenReceived).approve(address(_vault), type(uint256).max);
    }

    /**
        @notice Swap algorithm
        1. Withdraw existing LP tokens
        2. Reset weights
        3. Provide new liquidity
        4. Trigger gradual weight change
        5. Transfer remaining tokenReceived to tokenReceivingAddress
        @dev assumes tokenSpent balance of contract exceeds minTokenSpentBalance to kick off a new auction
    */
    function swap() external override afterTime whenNotPaused onlyGovernorOrAdmin {
        _swap();
    }

    /**
        @notice Force a swap() call, without waiting afterTime.
        This should only be callable after init() call, when no
        other swap is happening (call reverts if weight change
        is in progress).
    */
    function forceSwap() external whenNotPaused onlyGovernor {
        _swap();
    }

    /// @notice exit LBP with all assets to this contract. The tokens can then be withdrawn via standard PCV deposit methods.
    function exitPoolToSelf()
        external
        hasAnyOfThreeRoles(TribeRoles.GUARDIAN, TribeRoles.PCV_CONTROLLER, TribeRoles.SWAP_ADMIN_ROLE)
    {
        _exitPool();
    }

    /// @notice redeeem all assets from LP pool
    /// @param to destination for withdrawn tokens
    function exitPool(address to) external onlyPCVController {
        _exitPool();
        _transferAll(tokenSpent, to);
        _transferAll(tokenReceived, to);
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) public onlyPCVController {
        IERC20(token).safeTransfer(to, amount);
        emit WithdrawERC20(msg.sender, token, to, amount);
    }

    /// @notice returns when the next auction ends
    function swapEndTime() public view returns (uint256 endTime) {
        (, endTime, ) = pool.getGradualWeightUpdateParams();
    }

    /// @notice sets the minimum time between swaps
    /// @param _frequency minimum time between swaps in seconds
    function setSwapFrequency(uint256 _frequency) external onlyGovernorOrAdmin {
        _setDuration(_frequency);
    }

    /// @notice sets the minimum token spent balance
    /// @param newMinTokenSpentBalance minimum amount of FEI to trigger a new auction
    function setMinTokenSpent(uint256 newMinTokenSpentBalance) external onlyGovernorOrAdmin {
        _setMinTokenSpent(newMinTokenSpentBalance);
    }

    /// @notice Sets the address receiving swap's inbound tokens
    /// @param newTokenReceivingAddress the address that will receive tokens
    function setReceivingAddress(address newTokenReceivingAddress) external override onlyGovernorOrAdmin {
        _setReceivingAddress(newTokenReceivingAddress);
    }

    /// @notice return the amount of tokens needed to seed the next auction
    function getTokensIn(uint256 spentTokenBalance)
        external
        view
        returns (address[] memory tokens, uint256[] memory amountsIn)
    {
        tokens = new address[](2);
        tokens[0] = address(assets[0]);
        tokens[1] = address(assets[1]);

        return (tokens, _getTokensIn(spentTokenBalance));
    }

    /**
        @notice Swap algorithm
        1. Withdraw existing LP tokens
        2. Reset weights
        3. Provide new liquidity
        4. Trigger gradual weight change
        5. Transfer remaining tokenReceived to tokenReceivingAddress
        @dev assumes tokenSpent balance of contract exceeds minTokenSpentBalance to kick off a new auction
    */
    function _swap() internal {
        (, , uint256 lastChangeBlock) = vault.getPoolTokens(pid);

        // Ensures no actor can change the pool contents earlier in the block
        require(lastChangeBlock < block.number, "BalancerLBPSwapper: pool changed this block");

        uint256 bptTotal = pool.totalSupply();

        // Balancer locks a small amount of bptTotal after init, so 0 bpt means pool needs initializing
        if (bptTotal == 0) {
            _initializePool();
            return;
        }
        require(swapEndTime() < block.timestamp, "BalancerLBPSwapper: weight update in progress");

        // 1. Withdraw existing LP tokens (if currently held)
        _exitPool();

        // 2. Reset weights to LARGE_PERCENT:SMALL_PERCENT
        // Using current block time triggers immediate weight reset
        _updateWeightsGradually(pool, block.timestamp, block.timestamp, initialWeights);

        // 3. Provide new liquidity
        uint256 spentTokenBalance = IERC20(tokenSpent).balanceOf(address(this));
        require(spentTokenBalance > minTokenSpentBalance, "BalancerLBPSwapper: not enough for new swap");

        // uses exact tokens in encoding for deposit, supplying both tokens
        // will use some of the previously withdrawn tokenReceived to seed the 1% required for new auction
        uint256[] memory amountsIn = _getTokensIn(spentTokenBalance);
        bytes memory userData = abi.encode(IWeightedPool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, 0);

        IVault.JoinPoolRequest memory joinRequest;
        joinRequest.assets = assets;
        joinRequest.maxAmountsIn = amountsIn;
        joinRequest.userData = userData;
        joinRequest.fromInternalBalance = false; // uses external balances because tokens are held by contract

        vault.joinPool(pid, address(this), payable(address(this)), joinRequest);

        // 4. Kick off new auction ending after `duration` seconds
        _updateWeightsGradually(pool, block.timestamp, block.timestamp + duration, endWeights);
        _initTimed(); // reset timer
        // 5. Send remaining tokenReceived to target
        _transferAll(tokenReceived, tokenReceivingAddress);
    }

    function _exitPool() internal {
        uint256 bptBalance = pool.balanceOf(address(this));
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory exitRequest;

            // Uses encoding for exact BPT IN withdrawal using all held BPT
            bytes memory userData = abi.encode(IWeightedPool.ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance);

            exitRequest.assets = assets;
            exitRequest.minAmountsOut = new uint256[](2); // 0 min
            exitRequest.userData = userData;
            exitRequest.toInternalBalance = false; // use external balances to be able to transfer out tokenReceived

            vault.exitPool(pid, address(this), payable(address(this)), exitRequest);
            emit ExitPool();
        }
    }

    function _transferAll(address token, address to) internal {
        IERC20 _token = IERC20(token);
        _token.safeTransfer(to, _token.balanceOf(address(this)));
    }

    function _setReceivingAddress(address newTokenReceivingAddress) internal {
        require(newTokenReceivingAddress != address(0), "BalancerLBPSwapper: zero address");
        address oldTokenReceivingAddress = tokenReceivingAddress;
        tokenReceivingAddress = newTokenReceivingAddress;
        emit UpdateReceivingAddress(oldTokenReceivingAddress, newTokenReceivingAddress);
    }

    function _initializePool() internal {
        // Balancer LBP initialization uses a unique JoinKind which only takes in amountsIn
        uint256 spentTokenBalance = IERC20(tokenSpent).balanceOf(address(this));
        require(spentTokenBalance >= minTokenSpentBalance, "BalancerLBPSwapper: not enough tokenSpent to init");

        uint256[] memory amountsIn = _getTokensIn(spentTokenBalance);
        bytes memory userData = abi.encode(IWeightedPool.JoinKind.INIT, amountsIn);

        IVault.JoinPoolRequest memory joinRequest;
        joinRequest.assets = assets;
        joinRequest.maxAmountsIn = amountsIn;
        joinRequest.userData = userData;
        joinRequest.fromInternalBalance = false;

        vault.joinPool(pid, address(this), payable(address(this)), joinRequest);

        // Kick off the first auction
        _updateWeightsGradually(pool, block.timestamp, block.timestamp + duration, endWeights);
        _initTimed();

        _transferAll(tokenReceived, tokenReceivingAddress);
    }

    function _getTokensIn(uint256 spentTokenBalance) internal view returns (uint256[] memory amountsIn) {
        amountsIn = new uint256[](2);

        uint256 receivedTokenBalance = readOracle()
            .mul(spentTokenBalance)
            .mul(SMALL_PERCENT)
            .div(LARGE_PERCENT)
            .asUint256();

        if (address(assets[0]) == tokenSpent) {
            amountsIn[0] = spentTokenBalance;
            amountsIn[1] = receivedTokenBalance;
        } else {
            amountsIn[0] = receivedTokenBalance;
            amountsIn[1] = spentTokenBalance;
        }
    }

    function _setMinTokenSpent(uint256 newMinTokenSpentBalance) internal {
        uint256 oldMinTokenSpentBalance = minTokenSpentBalance;
        minTokenSpentBalance = newMinTokenSpentBalance;
        emit MinTokenSpentUpdate(oldMinTokenSpentBalance, newMinTokenSpentBalance);
    }
}
