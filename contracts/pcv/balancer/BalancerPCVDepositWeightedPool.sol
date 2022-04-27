// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IWeightedPool.sol";
import "./BalancerPCVDepositBase.sol";
import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../oracle/IOracle.sol";
import "../../external/gyro/ExtendedMath.sol";
import "../../external/gyro/abdk/ABDKMath64x64.sol";

/// @title base class for a Balancer WeightedPool PCV Deposit
/// @author Fei Protocol
contract BalancerPCVDepositWeightedPool is BalancerPCVDepositBase {
    using ExtendedMath for *;
    using ABDKMath64x64 for *;
    using SafeMath for *;
    using Decimal for Decimal.D256;

    event OracleUpdate(address _sender, address indexed _token, address indexed _oldOracle, address indexed _newOracle);

    /// @notice oracle array of the tokens stored in this Balancer pool
    IOracle[] public tokenOracles;
    /// @notice mapping of tokens to oracles of the tokens stored in this Balancer pool
    mapping(IERC20 => IOracle) public tokenOraclesMapping;

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
    /// @param _tokenOracles oracle for price feeds of the tokens in pool
    constructor(
        address _core,
        address _vault,
        address _rewards,
        bytes32 _poolId,
        uint256 _maximumSlippageBasisPoints,
        address _token,
        IOracle[] memory _tokenOracles
    ) BalancerPCVDepositBase(_core, _vault, _rewards, _poolId, _maximumSlippageBasisPoints) {
        // check that we have oracles for all tokens
        require(poolAssets.length == _tokenOracles.length, "BalancerPCVDepositWeightedPool: wrong number of oracles.");

        tokenOracles = _tokenOracles;

        // set cached values for token addresses & indexes
        bool tokenFound = false;
        address _fei = address(fei());
        for (uint256 i = 0; i < poolAssets.length; i++) {
            tokenOraclesMapping[IERC20(address(poolAssets[i]))] = _tokenOracles[i];
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
        require(tokenFound, "BalancerPCVDepositWeightedPool: token not in pool.");

        // check that token used for account is not FEI
        require(_token != _fei, "BalancerPCVDepositWeightedPool: token must not be FEI.");
    }

    /// @notice sets the oracle for a token in this deposit
    function setOracle(address _token, address _newOracle) external onlyGovernorOrAdmin {
        // we must set the oracle for an asset that is in the pool
        address oldOracle = address(tokenOraclesMapping[IERC20(_token)]);
        require(oldOracle != address(0), "BalancerPCVDepositWeightedPool: invalid token");

        // set oracle in the map
        tokenOraclesMapping[IERC20(_token)] = IOracle(_newOracle);

        // emit event
        emit OracleUpdate(msg.sender, _token, oldOracle, _newOracle);
    }

    /// @notice returns total balance of PCV in the Deposit, expressed in "token"
    function balance() public view override returns (uint256) {
        uint256 _bptSupply = IWeightedPool(poolAddress).totalSupply();
        if (_bptSupply == 0) {
            // empty (uninitialized) pools have a totalSupply of 0
            return 0;
        }

        (, uint256[] memory balances, ) = vault.getPoolTokens(poolId);
        uint256[] memory underlyingPrices = _readOracles();

        uint256 _balance = balances[tokenIndexInPool];
        for (uint256 i = 0; i < balances.length; i++) {
            bool isToken = i == tokenIndexInPool;
            bool isFei = feiInPool && i == feiIndexInPool;
            if (!isToken && !isFei) {
                _balance += (balances[i] * underlyingPrices[i]) / underlyingPrices[tokenIndexInPool];
            }
        }

        uint256 _bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));

        return (_balance * _bptBalance) / _bptSupply;
    }

    // @notice returns the manipulation-resistant balance of tokens & FEI held.
    function resistantBalanceAndFei() public view override returns (uint256 _resistantBalance, uint256 _resistantFei) {
        // read oracle values
        uint256[] memory underlyingPrices = _readOracles();

        // get BPT token price
        uint256 bptPrice = _getBPTPrice(underlyingPrices);

        // compute balance in USD value
        uint256 bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));
        Decimal.D256 memory bptValueUSD = Decimal.from(bptBalance).mul(bptPrice).div(1e18);

        // compute balance in "token" value
        _resistantBalance = bptValueUSD.mul(1e18).div(underlyingPrices[tokenIndexInPool]).asUint256();

        // if FEI is in the pair, return only the value of asset, and does not
        // count the protocol-owned FEI in the balance. For instance, if the pool
        // is 80% WETH and 20% FEI, balance() will return 80% of the USD value
        // of the balancer pool tokens held by the contract, denominated in
        // "token" (and not in USD).
        if (feiInPool) {
            uint256[] memory _weights = IWeightedPool(poolAddress).getNormalizedWeights();
            _resistantFei = bptValueUSD.mul(_weights[feiIndexInPool]).div(1e18).asUint256();
            // if FEI is x% of the pool, remove x% of the balance
            _resistantBalance = (_resistantBalance * (1e18 - _weights[feiIndexInPool])) / 1e18;
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
            // @dev: note that totalbalance is meaningless here, because we are
            // adding units of tokens that may have different decimals, different
            // values, etc. But the totalbalance is only used for checking > 0,
            // to make sure that we have something to deposit.
            totalbalance += balances[i];
        }
        require(totalbalance > 0, "BalancerPCVDepositWeightedPool: no tokens to deposit");

        // Read oracles
        uint256[] memory underlyingPrices = _readOracles();

        // Build joinPool request
        if (feiInPool) {
            // If FEI is in pool, we mint the good balance of FEI to go with the tokens
            // we are depositing
            uint256 _feiToMint = (underlyingPrices[tokenIndexInPool] * balances[tokenIndexInPool]) / 1e18;
            // normalize by weights
            uint256[] memory _weights = IWeightedPool(poolAddress).getNormalizedWeights();
            _feiToMint = (_feiToMint * _weights[feiIndexInPool]) / _weights[tokenIndexInPool];
            // mint FEI
            _mintFei(address(this), _feiToMint);
            balances[feiIndexInPool] = _feiToMint;
        }

        bytes memory userData = abi.encode(IWeightedPool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, balances, 0);
        // If the pool is not initialized, join with an INIT JoinKind
        if (IWeightedPool(poolAddress).totalSupply() == 0) {
            userData = abi.encode(IWeightedPool.JoinKind.INIT, balances);
        }

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
        uint256 bptBalanceBefore = IWeightedPool(poolAddress).balanceOf(address(this));
        vault.joinPool(
            poolId, // poolId
            address(this), // sender
            address(this), // recipient
            request // join pool request
        );
        uint256 bptBalanceAfter = IWeightedPool(poolAddress).balanceOf(address(this));

        // Check for slippage
        {
            // Compute USD value deposited
            uint256 valueIn = 0;
            for (uint256 i = 0; i < balances.length; i++) {
                valueIn += (balances[i] * underlyingPrices[i]) / 1e18;
            }

            // Compute USD value out
            uint256 bptPrice = _getBPTPrice(underlyingPrices);
            uint256 valueOut = Decimal.from(bptPrice).mul(bptBalanceAfter - bptBalanceBefore).div(1e18).asUint256();
            uint256 minValueOut = Decimal
                .from(valueIn)
                .mul(Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints)
                .div(Constants.BASIS_POINTS_GRANULARITY)
                .asUint256();
            require(valueOut > minValueOut, "BalancerPCVDepositWeightedPool: slippage too high");
        }

        // emit event
        emit Deposit(msg.sender, balances[tokenIndexInPool]);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param to the address to send PCV to
    /// @param amount of tokens withdrawn
    /// Note: except for ERC20/FEI pool2s, this function will not withdraw tokens
    /// in the right proportions for the pool, so only use this to withdraw small
    /// amounts comparatively to the pool size. For large withdrawals, it is
    /// preferrable to use exitPool() and then withdrawERC20().
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        uint256 bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory request;
            request.assets = poolAssets;
            request.minAmountsOut = new uint256[](poolAssets.length);
            request.minAmountsOut[tokenIndexInPool] = amount;
            request.toInternalBalance = false;

            if (feiInPool) {
                // If FEI is in pool, we also remove an equivalent portion of FEI
                // from the pool, to conserve balance as much as possible
                (Decimal.D256 memory oracleValue, bool oracleValid) = tokenOraclesMapping[token].read();
                require(oracleValid, "BalancerPCVDepositWeightedPool: oracle invalid");
                uint256 amountFeiToWithdraw = oracleValue.mul(amount).asUint256();
                request.minAmountsOut[feiIndexInPool] = amountFeiToWithdraw;
            }

            // Uses encoding for exact tokens out, spending at maximum bptBalance
            bytes memory userData = abi.encode(
                IWeightedPool.ExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT,
                request.minAmountsOut,
                bptBalance
            );
            request.userData = userData;

            vault.exitPool(poolId, address(this), payable(address(this)), request);
            SafeERC20.safeTransfer(token, to, amount);
            _burnFeiHeld();

            emit Withdrawal(msg.sender, to, amount);
        }
    }

    /// @notice read token oracles and revert if one of them is invalid
    function _readOracles() internal view returns (uint256[] memory underlyingPrices) {
        underlyingPrices = new uint256[](poolAssets.length);
        for (uint256 i = 0; i < underlyingPrices.length; i++) {
            (Decimal.D256 memory oracleValue, bool oracleValid) = tokenOraclesMapping[IERC20(address(poolAssets[i]))]
                .read();
            require(oracleValid, "BalancerPCVDepositWeightedPool: invalid oracle");
            underlyingPrices[i] = oracleValue.mul(1e18).asUint256();

            // normalize prices for tokens with different decimals
            uint8 decimals = ERC20(address(poolAssets[i])).decimals();
            require(decimals <= 18, "invalid decimals"); // should never happen
            if (decimals < 18) {
                underlyingPrices[i] = underlyingPrices[i] * 10**(18 - decimals);
            }
        }
    }

    /**
     * Calculates the value of Balancer pool tokens using the logic described here:
     * https://docs.gyro.finance/learn/oracles/bpt-oracle
     * This is robust to price manipulations within the Balancer pool.
     * Courtesy of Gyroscope protocol, used with permission. See the original file here :
     * https://github.com/gyrostable/core/blob/master/contracts/GyroPriceOracle.sol#L109-L167
     * @param underlyingPrices = array of prices for underlying assets in the pool,
     *   given in USD, on a base of 18 decimals.
     * @return bptPrice = the price of balancer pool tokens, in USD, on a base
     *   of 18 decimals.
     */
    function _getBPTPrice(uint256[] memory underlyingPrices) internal view returns (uint256 bptPrice) {
        IWeightedPool pool = IWeightedPool(poolAddress);
        uint256 _bptSupply = pool.totalSupply();
        uint256[] memory _weights = pool.getNormalizedWeights();
        (, uint256[] memory _balances, ) = vault.getPoolTokens(poolId);

        uint256 _k = uint256(1e18);
        uint256 _weightedProd = uint256(1e18);

        for (uint256 i = 0; i < poolAssets.length; i++) {
            uint256 _tokenBalance = _balances[i];
            uint256 _decimals = ERC20(address(poolAssets[i])).decimals();
            if (_decimals < 18) {
                _tokenBalance = _tokenBalance.mul(10**(18 - _decimals));
            }

            // if one of the tokens in the pool has zero balance, there is a problem
            // in the pool, so we return zero
            if (_tokenBalance == 0) {
                return 0;
            }

            _k = _k.mulPow(_tokenBalance, _weights[i], 18);

            _weightedProd = _weightedProd.mulPow(underlyingPrices[i].scaledDiv(_weights[i], 18), _weights[i], 18);
        }

        uint256 result = _k.scaledMul(_weightedProd).scaledDiv(_bptSupply);
        return result;
    }
}
