// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "./manager/WeightedBalancerPoolManager.sol";
import "./IVault.sol";
import "../../utils/Timed.sol";
import "../../refs/OracleRef.sol";
import "../IPCVSwapper.sol";

contract BalancerLBPSwapper is IPCVSwapper, OracleRef, Timed, WeightedBalancerPoolManager {
    using Decimal for Decimal.D256;

    // ------------- Events -------------
    event SplippageToleranceUpdate(uint256 oldSlippageToleranceBasisPoints, uint256 newSlippageToleranceBasisPoints);

    event MinTokenSpentUpdate(uint256 oldMinTokenSpentBalance, uint256 newMinTokenSpentBalance);

    // ------------- State -------------
    IWeightedPool public pool;
    IVault public vault;
    bytes32 public pid;

    address public override tokenSpent;
    address public override tokenReceived;
    address public override tokenReceivingAddress;

    uint256 public minTokenSpentBalance;

    uint256 private constant ONE_PERCENT = 0.01e18;
    uint256 private constant NINETY_NINE_PERCENT = 0.99e18;

    IAsset[] private assets;
    uint256[] private initialWeights;
    uint256[] private endWeights;

    uint256 public slippageToleranceBasisPoints;
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;
    
    struct OracleData {
        address _oracle;
        address _backupOracle;
        // invert should be false if the oracle is reported in tokenSpent terms otherwise true
        bool _invertOraclePrice;
        // The decimalsNormalizer should be calculated as tokenSpent.decimals() - tokenReceived.decimals() if invert is false, otherwise reverse order
        int256 _decimalsNormalizer;
    }

    constructor(
        address _core,
        OracleData memory oracleData,
        uint256 _frequency,
        address _tokenSpent,
        address _tokenReceived,
        address _tokenReceivingAddress,
        uint256 _minTokenSpentBalance,
        uint256 _slippageToleranceBasisPoints
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

        _setReceivingAddress(_tokenReceivingAddress);

        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;

        _setMinTokenSpent(_minTokenSpentBalance);
        _setSlippageTolerance(_slippageToleranceBasisPoints);
    }

    function init(IWeightedPool _pool) external {
        require(address(pool) == address(0), "BalancerLBPSwapper: initialized");

        pool = _pool;
        IVault _vault = _pool.getVault();

        vault = _pool.getVault();

        require(_pool.getOwner() == address(this), "BalancerLBPSwapper: contract not pool owner");

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

    // Swap algo
    // 1. Withdraw existing LP tokens
    // 2. Reset weights
    // 3. Provide new liquidity
    // 4. Trigger gradual weight change
    function swap() external override afterTime whenNotPaused {
        (
            uint256 spentReserves, 
            uint256 receivedReserves, 
            uint256 lastChangeBlock
        ) = getReserves();

        require(lastChangeBlock < block.number, "BalancerLBPSwapper: pool changed this block");

        (
            uint256 bptTotal,
            uint256 bptBalance, 
            uint256 spentBalance, 
            uint256 receivedBalance
        ) = getPoolBalances(spentReserves, receivedReserves);

        if (bptTotal == 0) {
            _initializePool();
            return;
        }
        require(swapEndTime() < block.timestamp, "BalancerLBPSwapper: weight update in progress");

        // 1. Withdraw existing LP tokens
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory exitRequest;

            bytes memory userData = abi.encode(IWeightedPool.ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance);
            uint256[] memory amountsOut = new uint256[](2);
            
            if (address(assets[0]) == tokenSpent) {
                amountsOut[0] = _scaleBySlippageTolerance(spentBalance);
                amountsOut[1] = _scaleBySlippageTolerance(receivedBalance);
            } else {
                amountsOut[0] = _scaleBySlippageTolerance(receivedBalance);
                amountsOut[1] = _scaleBySlippageTolerance(spentBalance);
            }


            exitRequest.assets = assets;
            exitRequest.minAmountsOut = amountsOut;
            exitRequest.userData = userData;
            exitRequest.toInternalBalance = false;

            vault.exitPool(
                pid,
                address(this),
                payable(address(this)),
                exitRequest
            );
        }
        // 2. Reset weights
        updateWeightsGradually(
            pool,
            block.timestamp, 
            block.timestamp, 
            initialWeights
        );

        // 3. Provide new liquidity
        uint256 spentTokenBalance = IERC20(tokenSpent).balanceOf(address(this));
        if (spentTokenBalance > minTokenSpentBalance) {
            uint256[] memory amountsIn = _getTokensIn();
            bytes memory userData = abi.encode(IWeightedPool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, 0);

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

            // 4. Kick off auction
            updateWeightsGradually(
                pool,
                block.timestamp, 
                block.timestamp + duration, 
                endWeights
            );
            _initTimed();
        }
        // Send remaining tokenReceived to target
        IERC20(tokenReceived).transfer(tokenReceivingAddress, IERC20(tokenReceived).balanceOf(address(this)));
    }

    function swapEndTime() public view returns(uint256 endTime) { 
        (,endTime,) = pool.getGradualWeightUpdateParams();
    }

    function getReserves() public view returns(uint256 spentReserves, uint256 receivedReserves, uint256 lastChangeBlock) {
        (IERC20[] memory tokens, uint256[] memory balances, uint256 _lastChangeBlock ) = vault.getPoolTokens(pid);
        if (address(tokens[0]) == tokenSpent) {
            return (balances[0], balances[1], _lastChangeBlock);
        }
        return (balances[1], balances[0], _lastChangeBlock);
    }

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

    /// @notice sets the minimum deposit slippage
	/// @param newSlippageToleranceBasisPoints minimum amount of slippage allowed on withdrawals
    function setSlippageTolerance(uint256 newSlippageToleranceBasisPoints) external onlyGovernorOrAdmin {
       _setSlippageTolerance(newSlippageToleranceBasisPoints);
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
        uint256[] memory amountsIn = _getTokensIn();
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

        updateWeightsGradually(
            pool,
            block.timestamp, 
            block.timestamp + duration, 
            endWeights
        );
        _initTimed();
    }

    function _getTokensIn() internal view returns(uint256[] memory amountsIn) {
        amountsIn = new uint256[](2);

        uint256 spentTokenBalance = IERC20(tokenSpent).balanceOf(address(this)); 
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

    function _setSlippageTolerance(uint256 newSlippageToleranceBasisPoints) internal {
      require(newSlippageToleranceBasisPoints <= BASIS_POINTS_GRANULARITY, "BalancerLBPSwapper: slippage tolerance > 100%");
      uint256 oldSlippageToleranceBasisPoints = slippageToleranceBasisPoints;
      slippageToleranceBasisPoints = newSlippageToleranceBasisPoints;
      emit SplippageToleranceUpdate(oldSlippageToleranceBasisPoints, newSlippageToleranceBasisPoints);
    }

    function _scaleBySlippageTolerance(uint256 input) internal view returns(uint256) {
        return input * (BASIS_POINTS_GRANULARITY - slippageToleranceBasisPoints) / BASIS_POINTS_GRANULARITY;
    }
}
