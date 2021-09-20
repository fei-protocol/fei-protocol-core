// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "./manager/WeightedBalancerPoolManager.sol";
import "./IVault.sol";
import "../../utils/Timed.sol";
import "../../refs/OracleRef.sol";
import "../IPCVSwapper.sol";

/// @title BalancerLBPSwapper
/// @author Fei Protocol
/// @notice an auction contract which cyclically sells one token for another using Balancer LBP
contract BalancerLBPSwapper is IPCVSwapper, OracleRef, Timed, WeightedBalancerPoolManager {
    using Decimal for Decimal.D256;

    // ------------- Events -------------
    event MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance);

    // ------------- Balancer State -------------
    /// @notice the Balancer LBP used for swapping
    IWeightedPool public pool;

    /// @notice the Balancer V2 Vault contract
    IVault public vault;

    /// @notice the Balancer V2 Pool id of `pool`
    bytes32 public pid;

    // Balancer constants for the 99:1 -> 1:99 auction
    uint256 private constant ONE_PERCENT = 0.01e18;
    uint256 private constant NINETY_NINE_PERCENT = 0.99e18;

    // Balancer constants to memoize the target assets and weights from pool
    IAsset[] private assets;
    uint256[] private initialWeights;
    uint256[] private endWeights;

    // ------------- Swapper State -------------

    /// @notice the token to be auctioned
    address public override tokenSpent;

    /// @notice the token to buy
    address public override tokenReceived;

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
    @param _tokenSpent the token to be auctioned
    @param _tokenReceived the token to buy
    @param _tokenReceivingAddress the address to send `tokenReceived`
    @param _minTokenSpentBalance the minimum amount of tokenSpent to kick off a new auction on swap()
     */
    constructor(
        address _core,
        OracleData memory oracleData,
        uint256 _frequency,
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
        _initTimed();

        // tokenSpent and tokenReceived are immutable
        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;

        _setReceivingAddress(_tokenReceivingAddress);
        _setMinTokenSpent(_minTokenSpentBalance);
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

        pool = _pool;
        IVault _vault = _pool.getVault();

        vault = _vault;

        // Check ownership
        require(_pool.getOwner() == address(this), "BalancerLBPSwapper: contract not pool owner");

        // Check correct pool token components
        bytes32 _pid = _pool.getPoolId();
        pid = _pid;
        (IERC20[] memory tokens,,) = _vault.getPoolTokens(_pid);
        require(tokens.length == 2, "BalancerLBPSwapper: pool does not have 2 tokens");
        require(
            tokenSpent == address(tokens[0]) || 
            tokenSpent == address(tokens[1]), 
            "BalancerLBPSwapper: tokenSpent not in pool"
        );        
        require(
            tokenReceived == address(tokens[0]) || 
            tokenReceived == address(tokens[1]), 
            "BalancerLBPSwapper: tokenReceived not in pool"
        );

        // Set the asset array and target weights
        assets = new IAsset[](2);
        assets[0] = IAsset(address(tokens[0]));
        assets[1] = IAsset(address(tokens[1]));

        bool tokenSpentAtIndex0 = tokenSpent == address(tokens[0]);
        initialWeights = new uint[](2);
        endWeights = new uint[](2);

        if (tokenSpentAtIndex0) {
            initialWeights[0] = NINETY_NINE_PERCENT;
            initialWeights[1] = ONE_PERCENT;

            endWeights[0] = ONE_PERCENT;
            endWeights[1] = NINETY_NINE_PERCENT;
        }  else {
            initialWeights[0] = ONE_PERCENT;
            initialWeights[1] = NINETY_NINE_PERCENT;

            endWeights[0] = NINETY_NINE_PERCENT;
            endWeights[1] = ONE_PERCENT;
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
    function swap() external override afterTime whenNotPaused {
        (
            uint256 spentReserves, 
            uint256 receivedReserves, 
            uint256 lastChangeBlock
        ) = getReserves();

        // Ensures no actor can change the pool contents earlier in the block
        require(lastChangeBlock < block.number, "BalancerLBPSwapper: pool changed this block");

        (
            uint256 bptTotal,
            uint256 bptBalance, 
            uint256 spentBalance, 
            uint256 receivedBalance
        ) = getPoolBalances(spentReserves, receivedReserves);

        // Balancer locks a small amount of bptTotal after init, so 0 bpt means pool needs initializing
        if (bptTotal == 0) {
            _initializePool();
            return;
        }
        require(swapEndTime() < block.timestamp, "BalancerLBPSwapper: weight update in progress");

        // 1. Withdraw existing LP tokens (if currently held)
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory exitRequest;

            // Uses encoding for exact BPT IN withdrawal using all held BPT
            bytes memory userData = abi.encode(IWeightedPool.ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance);

            exitRequest.assets = assets;
            exitRequest.minAmountsOut = new uint256[](2); // 0 min
            exitRequest.userData = userData;
            exitRequest.toInternalBalance = false; // use external balances to be able to transfer out tokenReceived

            vault.exitPool(
                pid,
                address(this),
                payable(address(this)),
                exitRequest
            );
        }
        // 2. Reset weights to 99:1
        // Using current block time triggers immediate weight reset
        _updateWeightsGradually(
            pool,
            block.timestamp, 
            block.timestamp, 
            initialWeights
        );

        // 3. Provide new liquidity
        uint256 spentTokenBalance = IERC20(tokenSpent).balanceOf(address(this));
        if (spentTokenBalance > minTokenSpentBalance) {
            // uses exact tokens in encoding for deposit, supplying both tokens
            // will use some of the previously withdrawn tokenReceived to seed the 1% required for new auction
            uint256[] memory amountsIn = _getTokensIn(spentTokenBalance);
            bytes memory userData = abi.encode(IWeightedPool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, 0);

            IVault.JoinPoolRequest memory joinRequest;
            joinRequest.assets = assets;
            joinRequest.maxAmountsIn = amountsIn;
            joinRequest.userData = userData;
            joinRequest.fromInternalBalance = false; // uses external balances because tokens are held by contract

            vault.joinPool(
                pid,
                address(this),
                payable(address(this)),
                joinRequest
            );

            // 4. Kick off new auction ending after `duration` seconds
            _updateWeightsGradually(
                pool,
                block.timestamp, 
                block.timestamp + duration, 
                endWeights
            );
            _initTimed(); // reset timer
        }
        // 5. Send remaining tokenReceived to target
        IERC20(tokenReceived).transfer(tokenReceivingAddress, IERC20(tokenReceived).balanceOf(address(this)));
    }

    /// @notice returns when the next auction ends
    function swapEndTime() public view returns(uint256 endTime) { 
        (,endTime,) = pool.getGradualWeightUpdateParams();
    }

    /// @notice returns the token reserves of `pool` and the last block they updated
    function getReserves() public view returns(uint256 spentReserves, uint256 receivedReserves, uint256 lastChangeBlock) {
        (IERC20[] memory tokens, uint256[] memory balances, uint256 _lastChangeBlock ) = vault.getPoolTokens(pid);
        if (address(tokens[0]) == tokenSpent) {
            return (balances[0], balances[1], _lastChangeBlock);
        }
        return (balances[1], balances[0], _lastChangeBlock);
    }

    /// @notice given token reserves, returns the held balances of the contract based on the ratio of BPT held to total
    function getPoolBalances(uint256 spentReserves, uint256 receivedReserves) public view returns (
        uint256 bptTotal, 
        uint256 bptBalance, 
        uint256 spentBalance, 
        uint256 receivedBalance
    ) {
        bptTotal = pool.totalSupply();
        bptBalance = pool.balanceOf(address(this));

        if (bptTotal != 0) {
            spentBalance = spentReserves * bptBalance / bptTotal;
            receivedBalance = receivedReserves * bptBalance / bptTotal;
        }
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

        vault.joinPool(
            pid,
            address(this),
            payable(address(this)),
            joinRequest
        );

        // Kick off the first auction
        _updateWeightsGradually(
            pool,
            block.timestamp, 
            block.timestamp + duration, 
            endWeights
        );
        _initTimed();
    }

    function _getTokensIn(uint256 spentTokenBalance) internal view returns(uint256[] memory amountsIn) {
        amountsIn = new uint256[](2);

        uint256 receivedTokenBalance = readOracle().mul(spentTokenBalance).mul(ONE_PERCENT).div(NINETY_NINE_PERCENT).asUint256();
    
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
