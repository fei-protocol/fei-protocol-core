// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "./manager/IWeightedBalancerPoolManager.sol";
import "./IVault.sol";
import "../../utils/Timed.sol";
import "../../refs/OracleRef.sol";
// TODO move to utils or higher level folder
import "../uniswap/IPCVSwapper.sol";

// TODO make the thing a PCV Deposit
contract BalancerLBPSwapper is IPCVSwapper, OracleRef, Timed {
    using Decimal for Decimal.D256;

    IWeightedPool public immutable pool;
    IWeightedBalancerPoolManager public immutable manager;
    IVault public immutable vault;
    bytes32 public immutable pid;

    address public override tokenSpent;
    address public override tokenReceived;
    address public override tokenReceivingAddress;

    // TODO make this settable
    uint256 public minTokenSpentBalance;

    uint256 private constant ONE_PERCENT = 0.01e18;
    uint256 private constant NINETY_NINE_PERCENT = 0.99e18;

    IAsset[] private assets;
    uint256[] private initialWeights;
    uint256[] private endWeights;
    
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
        IWeightedPool _pool,
        IWeightedBalancerPoolManager _manager, 
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
    {
        pool = _pool;
        IVault _vault = _pool.getVault();

        vault = _pool.getVault();
        manager = _manager;

        require(_pool.getOwner() == address(_manager), "BalancerLBPSwapper: manager not pool owner");

        bytes32 _pid = _pool.getPoolId();
        pid = _pid;
        (IERC20[] memory tokens,,) = _vault.getPoolTokens(_pid);
        require(tokens.length == 2, "BalancerLBPSwapper: pool does not have 2 tokens");
        require(
            _tokenSpent == address(tokens[0]) || 
            _tokenSpent == address(tokens[1]), 
            "BalancerLBPSwapper: tokenSpent not in pool"
        );        
        require(
            _tokenReceived == address(tokens[0]) || 
            _tokenReceived == address(tokens[1]), 
            "BalancerLBPSwapper: tokenReceived not in pool"
        );

        assets = new IAsset[](2);
        assets[0] = IAsset(address(tokens[0]));
        assets[1] = IAsset(address(tokens[1]));

        bool tokenSpentAtIndex0 = _tokenSpent == address(tokens[0]);
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

        tokenSpent = _tokenSpent;
        tokenReceived = _tokenReceived;
        
        // Approve pool tokens for vault
        _pool.approve(address(_vault), type(uint256).max);
        IERC20(_tokenSpent).approve(address(_vault), type(uint256).max);
        IERC20(_tokenReceived).approve(address(_vault), type(uint256).max);

        _setReceivingAddress(_tokenReceivingAddress);

        minTokenSpentBalance = _minTokenSpentBalance;
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
            
            // TODO: scale amounts out
            if (address(assets[0]) == tokenSpent) {
                amountsOut[0] = spentBalance;
                amountsOut[1] = receivedBalance;
            } else {
                amountsOut[0] = receivedBalance;
                amountsOut[1] = spentBalance;
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
        manager.updateWeightsGradually(
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
            manager.updateWeightsGradually(
                pool,
                block.timestamp, 
                block.timestamp + duration, 
                endWeights
            );
            _initTimed();
        }
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

        spentBalance = spentReserves * bptBalance / bptTotal;
        receivedBalance = receivedReserves * bptBalance / bptTotal;
    } 

    /// @notice sets the minimum time between swaps
	/// @param _frequency minimum time between swaps in seconds
    function setSwapFrequency(uint256 _frequency) external onlyGovernorOrAdmin {
       _setDuration(_frequency);
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

        manager.updateWeightsGradually(
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
}
