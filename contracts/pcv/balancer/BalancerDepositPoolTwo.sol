// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IWeightedPool.sol";
import "./BalancerDepositBase.sol";
import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../../oracle/IOracle.sol";

/// @title base class for a Balancer Pool2 PCV Deposit
/// @author Fei Protocol
contract BalancerPCVDepositPoolTwo is BalancerPCVDepositBase {
    using Decimal for Decimal.D256;

    event OracleUpdate(
        address _sender,
        address indexed _token,
        address indexed _oldOracle,
        address indexed _newOracle
    );

    /// @notice the token stored in the Balancer pool, used for accounting
    IERC20 public immutable token;
    /// @notice oracle of the token stored in this Balancer pool
    IOracle public tokenOracle;
    /// @notice cache of the index of the token in the Balancer pool
    uint8 private immutable tokenIndexInPool;

    /// @notice the other token stored in the Balancer pool
    IERC20 public immutable otherToken;
    /// @notice oracle of the other token in the pool that is in this balancer
    /// pool, but not the one we deposit/withdraw
    IOracle public otherTokenOracle;
    /// @notice cache of the index of the other token in the Balancer pool
    uint8 private immutable otherTokenIndexInPool;

    /// @notice true if FEI is in the pool
    bool public immutable feiInPool;

    /// @notice Balancer PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _poolId Balancer poolId to deposit in
    /// @param _vault Balancer vault
    /// @param _rewards Balancer rewards (the MerkleOrchard)
    /// @param _maximumSlippageBasisPoints Maximum slippage basis points when depositing
    /// @param _token Address of the ERC20 to manage / do accounting with
    /// @param _tokenOracle oracle for price feed of the token deposited
    /// @param _otherTokenOracle oracle for price feed of the other token in pool
    constructor(
        address _core,
        address _vault,
        address _rewards,
        bytes32 _poolId,
        uint256 _maximumSlippageBasisPoints,
        address _token,
        IOracle _tokenOracle,
        IOracle _otherTokenOracle
    ) BalancerPCVDepositBase(_core, _vault, _rewards, _poolId, _maximumSlippageBasisPoints) {
        tokenOracle = _tokenOracle;
        otherTokenOracle = _otherTokenOracle;

        // check that the balancer pool is a pool with 2 assets
        require(poolAssets.length == 2, "BalancerDepositPoolTwo: not a pool with 2 tokens.");

        // set cached values for token addresses & indexes
        tokenIndexInPool = address(poolAssets[0]) == _token ? 0 : 1;
        otherTokenIndexInPool = address(poolAssets[0]) == _token ? 1 : 0;
        token = IERC20(address(poolAssets[address(poolAssets[0]) == _token ? 0 : 1]));
        otherToken = IERC20(address(poolAssets[address(poolAssets[0]) == _token ? 1 : 0]));

        // check that the token is in the pool
        require(address(poolAssets[address(poolAssets[0]) == _token ? 0 : 1]) == _token, "BalancerDepositPoolTwo: token not in pool.");

        // set cached values for fei management
        address _fei = address(fei());
        feiInPool = address(poolAssets[0]) == _fei || address(poolAssets[1]) == _fei;

        // check that token used for account is not FEI
        require(_token != _fei, "BalancerDepositPoolTwo: token must not be FEI.");
    }

    /// @notice sets the oracle for a token in this deposit
    function setOracle(address _token, address _newOracle) external onlyGovernorOrAdmin {
        require(_token == address(token) || _token == address(otherToken), "BalancerDepositPoolTwo: invalid token");

        address oldOracle = _token == address(token) ? address(tokenOracle) : address(otherTokenOracle);

        if (_token == address(token)) {
            tokenOracle = IOracle(_newOracle);
        } else {
            otherTokenOracle = IOracle(_newOracle);
        }

        emit OracleUpdate(
            msg.sender,
            _token,
            oldOracle,
            _newOracle
        );
    }

    /// @notice returns total balance of PCV in the Deposit, expressed in "token"
    function balance() public view override returns (uint256) {
        // read oracle values
        (Decimal.D256 memory oracleValue1, bool oracleValid1) = tokenOracle.read();
        (Decimal.D256 memory oracleValue2, bool oracleValid2) = otherTokenOracle.read();
        require(oracleValid1, "BalancerDepositPoolTwo: invalid oracle for token");
        require(oracleValid2, "BalancerDepositPoolTwo: invalid oracle for otherToken");

        // get BPT token price
        uint256[] memory underlyingPrices = new uint256[](2);
        underlyingPrices[tokenIndexInPool] = oracleValue1.mul(1e18).asUint256();
        underlyingPrices[otherTokenIndexInPool] = oracleValue2.mul(1e18).asUint256();
        uint256 bptPrice = _getBPTPrice(underlyingPrices);

        // compute balance in USD value
        uint256 bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));
        Decimal.D256 memory bptValueUSD = Decimal.from(bptBalance).mul(bptPrice).div(1e18);

        // return balance in "token" value
        uint256 _balanceInToken = bptValueUSD.mul(1e18).div(underlyingPrices[tokenIndexInPool]).asUint256();
        // if FEI is in the pair, return only the value of asset, and does not
        // count the protocol-owned FEI in the balance. For instance, if the pool
        // is 80% WETH and 20% FEI, balance() will return 80% of the USD value
        // of the balancer pool tokens held by the contract, denominated in
        // "token" (and not in USD).
        if (feiInPool) {
            uint256[] memory _weights = IWeightedPool(poolAddress).getNormalizedWeights();
            _balanceInToken = _balanceInToken * _weights[tokenIndexInPool] / 1e18;
        }
        return _balanceInToken;
    }

    // @notice returns the manipulation-resistant balance of tokens & FEI held.
    function resistantBalanceAndFei() public view override returns (
        uint256 _resistantBalance,
        uint256 _resistantFei
    ) {
        _resistantBalance = balance();
        // if FEI is not in pair, just return the balance & 0 FEI
        if (!feiInPool) {
            return (_resistantBalance, 0);
        }
        // if FEI is in pair, return the balance and compute the protocol-owned FEI
        uint256[] memory _weights = IWeightedPool(poolAddress).getNormalizedWeights();
        _resistantFei = _resistantBalance * _weights[otherTokenIndexInPool] / _weights[tokenIndexInPool];
        return (_resistantBalance, _resistantFei);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    // @notice deposit tokens to the Balancer pool
    function deposit() external override whenNotPaused {
        uint256 tokenBalance = token.balanceOf(address(this));
        uint256 otherTokenBalance = otherToken.balanceOf(address(this));
        require(tokenBalance > 0 || otherTokenBalance > 0, "BalancerDepositPoolTwo: no tokens to deposit");

        // Read oracles
        (Decimal.D256 memory oracleValue1, bool oracleValid1) = tokenOracle.read();
        (Decimal.D256 memory oracleValue2, bool oracleValid2) = otherTokenOracle.read();
        require(oracleValid1, "BalancerDepositPoolTwo: invalid oracle for token");
        require(oracleValid2, "BalancerDepositPoolTwo: invalid oracle for otherToken");

        // Build joinPool request
        uint256[] memory amountsIn = new uint256[](2);
        amountsIn[tokenIndexInPool] = tokenBalance;
        amountsIn[otherTokenIndexInPool] = otherTokenBalance;
        if (feiInPool) {
            // If FEI is in pool, we mint the good balance of FEI to go with the tokens
            // we are depositing
            uint256 _feiToMint = oracleValue1.mul(tokenBalance).asUint256();
            _mintFei(address(this), _feiToMint);
            otherTokenBalance = _feiToMint;
            amountsIn[otherTokenIndexInPool] = _feiToMint;
        }
        bytes memory userData = abi.encode(IWeightedPool.JoinKind.EXACT_TOKENS_IN_FOR_BPT_OUT, amountsIn, 0);

        IVault.JoinPoolRequest memory request = IVault.JoinPoolRequest({
            assets: poolAssets,
            maxAmountsIn: amountsIn,
            userData: userData,
            fromInternalBalance: false // tokens are held on this contract
        });

        // approve spending on balancer's vault
        token.approve(address(vault), tokenBalance);
        otherToken.approve(address(vault), otherTokenBalance);

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
            uint256 valueIn = oracleValue1.mul(tokenBalance).asUint256() + oracleValue2.mul(otherTokenBalance).asUint256();

            // Compute USD value out
            uint256[] memory underlyingPrices = new uint256[](2);
            underlyingPrices[tokenIndexInPool] = oracleValue1.mul(1e18).asUint256();
            underlyingPrices[otherTokenIndexInPool] = oracleValue2.mul(1e18).asUint256();
            uint256 bptPrice = _getBPTPrice(underlyingPrices);
            uint256 valueOut = Decimal.from(bptPrice).mul(bptBalanceAfter - bptBalanceBefore).div(1e18).asUint256();
            uint256 minValueOut = Decimal.from(valueIn)
                .mul(Constants.BASIS_POINTS_GRANULARITY - maximumSlippageBasisPoints)
                .div(Constants.BASIS_POINTS_GRANULARITY)
                .asUint256();
            require(valueOut > minValueOut, "BalancerDepositPoolTwo: slippage too high");
        }

        // emit event
        emit Deposit(msg.sender, tokenBalance);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param to the address to send PCV to
    /// @param amount of tokens withdrawn
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
      uint256 bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));
      if (bptBalance != 0) {
          IVault.ExitPoolRequest memory request;
          request.assets = poolAssets;
          request.minAmountsOut = new uint256[](2);
          request.minAmountsOut[tokenIndexInPool] = amount;
          request.toInternalBalance = false;

          if (feiInPool) {
              // If FEI is in pool, we also remove an equivalent portion of FEI
              // from the pool, to conserve balance as much as possible
              (Decimal.D256 memory oracleValue, bool oracleValid) = tokenOracle.read();
              require(oracleValid, "BalancerDepositPoolTwo: oracle invalid");
              uint256 amountFeiToWithdraw = oracleValue.mul(amount).asUint256();
              request.minAmountsOut[otherTokenIndexInPool] = amountFeiToWithdraw;
          }

          // Uses encoding for exact tokens out, spending at maximum bptBalance
          bytes memory userData = abi.encode(IWeightedPool.ExitKind.BPT_IN_FOR_EXACT_TOKENS_OUT, request.minAmountsOut, bptBalance);
          request.userData = userData;

          vault.exitPool(poolId, address(this), payable(to), request);

          _burnFeiHeld();

          emit Withdrawal(msg.sender, to, amount);
      }
    }
}
