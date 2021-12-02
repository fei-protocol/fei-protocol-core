// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IStablePool.sol";
import "./BalancerPCVDepositBase.sol";
import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../oracle/IOracle.sol";

/// @title base class for a Balancer StablePool PCV Deposit
/// @author Fei Protocol
contract BalancerPCVDepositStablePool is BalancerPCVDepositBase {
    using Decimal for Decimal.D256;

    /// @notice the token stored in the Balancer pool, used for accounting
    IERC20 public token;
    /// @notice cache of the index of the token in the Balancer pool
    uint8 private tokenIndexInPool;

    /// @notice true if FEI is in the pool
    bool private feiInPool;
    /// @notice if feiInPool is true, this is the index of FEI in the pool.
    /// If feiInPool is false, this is zero.
    uint8 private feiIndexInPool;

    /// @notice Balancer PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _poolId Balancer poolId to deposit in
    /// @param _vault Balancer vault
    /// @param _rewards Balancer rewards (the MerkleOrchard)
    /// @param _maximumSlippageBasisPoints Maximum slippage basis points when depositing
    /// @param _token Address of the ERC20 to manage / do accounting with
    constructor(
        address _core,
        address _vault,
        address _rewards,
        bytes32 _poolId,
        uint256 _maximumSlippageBasisPoints,
        address _token
    ) BalancerPCVDepositBase(_core, _vault, _rewards, _poolId, _maximumSlippageBasisPoints) {
        // set cached values for token addresses & indexes
        bool tokenFound = false;
        address _fei = address(fei());
        for (uint256 i = 0; i < poolAssets.length; i++) {
            if (address(poolAssets[i]) == _token) {
                tokenFound = true;
                tokenIndexInPool = uint8(i);
                token = IERC20(address(poolAssets[i]));
            }
            if (address(poolAssets[i]) == _fei) {
                feiInPool = true;
                feiIndexInPool = uint8(i);
            }
        }
        // check that the token is in the pool
        require(tokenFound, "BalancerPCVDepositStablePool: token not in pool.");

        // check that token used for account is not FEI
        require(_token != _fei, "BalancerPCVDepositStablePool: token must not be FEI.");
    }

    /// @notice returns total balance of PCV in the Deposit, expressed in "token"
    function balance() public view override returns (uint256) {
        // get the total number of tokens in the pool
        uint256 poolBalancesSum = 0;
        ( , uint256[] memory poolBalances, ) = vault.getPoolTokens(poolId);
        for (uint256 i = 0; i < poolAssets.length; i++) {
            poolBalancesSum += poolBalances[i];
        }

        // return balance in "token" value
        uint256 bptBalance = IStablePool(poolAddress).balanceOf(address(this));
        uint256 bptTotalSupply = IStablePool(poolAddress).totalSupply();
        uint256 balance = poolBalancesSum * bptBalance / bptTotalSupply;

        if (feiInPool) {
            uint256 feiInPool = IERC20(address(poolAssets[feiIndexInPool])).balanceOf(poolAddress);
            balance -= feiInPool * bptBalance / bptTotalSupply;
        }
        return balance;
    }

    // @notice returns the manipulation-resistant balance of tokens & FEI held.
    function resistantBalanceAndFei() public view override returns (
        uint256 _resistantBalance,
        uint256 _resistantFei
    ) {

        // get the total number of tokens in the pool
        uint256 poolBalancesSum = 0;
        for (uint256 i = 0; i < poolAssets.length; i++) {
            poolBalancesSum += IERC20(address(poolAssets[i])).balanceOf(poolAddress);
        }

        // return balance in "token" value
        uint256 bptBalance = IStablePool(poolAddress).balanceOf(address(this));
        uint256 bptTotalSupply = IStablePool(poolAddress).totalSupply();
        uint256 _resistantBalance = poolBalancesSum * bptBalance / bptTotalSupply;

        // assume the pool is balanced, i.e. if the stable pool has N assets,
        // we consider 1/N as FEI, and deduce the FEI from the balance
        if (feiInPool) {
            _resistantFei = _resistantBalance / poolAssets.length;
            _resistantBalance -= _resistantFei;
        }
        return (_resistantBalance, _resistantFei);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    // @notice deposit tokens to the Balancer pool
    function deposit() external override whenNotPaused {
        uint256[] memory balances = new uint256[](poolAssets.length);
        uint256 totalbalance = 0;
        for (uint256 i = 0; i < balances.length; i++) {
            balances[i] = IERC20(address(poolAssets[i])).balanceOf(address(this));
            totalbalance += balances[i];
        }
        require(totalbalance > 0, "BalancerPCVDepositStablePool: no tokens to deposit");

        // Build joinPool request
        if (feiInPool) {
            // If FEI is in pool, we mint the good balance of FEI to go with the tokens
            // we are depositing
            uint256 _feiToMint = balances[tokenIndexInPool];
            _mintFei(address(this), _feiToMint);
            totalbalance -= balances[feiIndexInPool];
            balances[feiIndexInPool] = _feiToMint;
            totalbalance += balances[feiIndexInPool];
        }

        uint256 poolRate = IStablePool(poolAddress).getRate();
        uint256 minBptOut = totalbalance * poolRate * (Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints) / (Constants.BASIS_POINTS_GRANULARITY * 1e18);

        bytes memory userData = abi.encode(IStablePool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, balances, minBptOut);

        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest({
            assets: poolAssets,
            maxAmountsIn: balances,
            userData: userData,
            fromInternalBalance: false // tokens are held on this contract
        });

        // approve spending on balancer's vault
        for (uint256 i = 0; i < balances.length; i++) {
            if (balances[i] > 0) {
                IERC20(address(poolAssets[i])).approve(address(vault), balances[i]);
            }
        }

        // execute joinPool & transfer tokens to Balancer
        vault.joinPool(
            poolId, // poolId
            address(this), // sender
            address(this), // recipient
            request // join pool request
        );

        // emit event
        uint256 totalDeposited = totalbalance;
        if (feiInPool) {
            totalDeposited -= balances[feiIndexInPool];
        }
        emit Deposit(msg.sender, totalDeposited);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param to the address to send PCV to
    /// @param amount of tokens withdrawn
    /// Note: except for ERC20/FEI pool2s, this function will not withdraw tokens
    /// in the right proportions for the pool, so only use this to withdraw small
    /// amounts comparatively to the pool size. For large withdrawals, it is
    /// preferrable to use exitPool() and then withdrawERC20().
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        uint256 bptBalance = IStablePool(poolAddress).balanceOf(address(this));
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory request;
            request.assets = poolAssets;
            request.minAmountsOut = new uint256[](poolAssets.length);
            request.minAmountsOut[tokenIndexInPool] = amount;
            request.toInternalBalance = false;

            if (feiInPool) {
                // If FEI is in pool, we also remove an equivalent portion of FEI
                // from the pool, to conserve balance as much as possible
                request.minAmountsOut[feiIndexInPool] = amount;
            }

            // Uses encoding for exact tokens out, spending at maximum bptBalance
            bytes memory userData = abi.encode(IStablePool.ExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT, request.minAmountsOut, bptBalance);
            request.userData = userData;

            vault.exitPool(poolId, address(this), payable(address(this)), request);
            SafeERC20.safeTransfer(token, to, amount);
            _burnFeiHeld();

            emit Withdrawal(msg.sender, to, amount);
        }
    }
}
