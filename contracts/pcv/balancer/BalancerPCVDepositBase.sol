// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IVault.sol";
import "./IMerkleOrchard.sol";
import "./IWeightedPool.sol";
import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title base class for a Balancer PCV Deposit
/// @author Fei Protocol
abstract contract BalancerPCVDepositBase is PCVDeposit {
    // ----------- Events ---------------
    event UpdateMaximumSlippage(uint256 maximumSlippageBasisPoints);

    /// @notice event generated when rewards are claimed
    event ClaimRewards(address indexed _caller, address indexed _token, address indexed _to, uint256 _amount);

    // @notice event generated when pool position is exited (LP tokens redeemed
    // for tokens in proportion to the pool's weights.
    event ExitPool(bytes32 indexed _poodId, address indexed _to, uint256 _bptAmount);

    // Maximum tolerated slippage for deposits
    uint256 public maximumSlippageBasisPoints;

    /// @notice the balancer pool to deposit in
    bytes32 public immutable poolId;
    address public immutable poolAddress;

    /// @notice cache of the assets in the Balancer pool
    IAsset[] internal poolAssets;

    /// @notice the balancer vault
    IVault public immutable vault;

    /// @notice the balancer rewards contract to claim incentives
    IMerkleOrchard public immutable rewards;

    /// @notice Balancer PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _vault Balancer vault
    /// @param _rewards Balancer rewards (the MerkleOrchard)
    /// @param _poolId Balancer poolId to deposit in
    /// @param _maximumSlippageBasisPoints Maximum slippage basis points when depositing
    constructor(
        address _core,
        address _vault,
        address _rewards,
        bytes32 _poolId,
        uint256 _maximumSlippageBasisPoints
    ) CoreRef(_core) {
        vault = IVault(_vault);
        rewards = IMerkleOrchard(_rewards);
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        poolId = _poolId;

        (poolAddress, ) = IVault(_vault).getPool(_poolId);

        // get the balancer pool tokens
        IERC20[] memory tokens;
        (tokens, , ) = IVault(_vault).getPoolTokens(_poolId);

        // cache the balancer pool tokens as Assets
        poolAssets = new IAsset[](tokens.length);
        for (uint256 i = 0; i < tokens.length; i++) {
            poolAssets[i] = IAsset(address(tokens[i]));
        }
    }

    // Accept ETH transfers
    receive() external payable {}

    /// @notice Wraps all ETH held by the contract to WETH
    /// Anyone can call it.
    /// Balancer uses WETH in its pools, and not ETH.
    function wrapETH() external {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            Constants.WETH.deposit{value: ethBalance}();
        }
    }

    /// @notice unwrap WETH on the contract, for instance before
    /// sending to another PCVDeposit that needs pure ETH.
    /// Balancer uses WETH in its pools, and not ETH.
    function unwrapETH() external onlyPCVController {
        uint256 wethBalance = IERC20(address(Constants.WETH)).balanceOf(address(this));
        if (wethBalance != 0) {
            Constants.WETH.withdraw(wethBalance);
        }
    }

    /// @notice Sets the maximum slippage vs 1:1 price accepted during withdraw.
    /// @param _maximumSlippageBasisPoints the maximum slippage expressed in basis points (1/10_000)
    function setMaximumSlippage(uint256 _maximumSlippageBasisPoints) external onlyGovernorOrAdmin {
        require(
            _maximumSlippageBasisPoints <= Constants.BASIS_POINTS_GRANULARITY,
            "BalancerPCVDepositBase: Exceeds bp granularity."
        );
        maximumSlippageBasisPoints = _maximumSlippageBasisPoints;
        emit UpdateMaximumSlippage(_maximumSlippageBasisPoints);
    }

    /// @notice redeeem all assets from LP pool
    /// @param _to address to send underlying tokens to
    function exitPool(address _to) external whenNotPaused onlyPCVController {
        uint256 bptBalance = IWeightedPool(poolAddress).balanceOf(address(this));
        if (bptBalance != 0) {
            IVault.ExitPoolRequest memory request;

            // Uses encoding for exact BPT IN withdrawal using all held BPT
            bytes memory userData = abi.encode(IWeightedPool.ExitKind.EXACT_BPT_IN_FOR_TOKENS_OUT, bptBalance);
            request.assets = poolAssets;
            request.minAmountsOut = new uint256[](poolAssets.length); // 0 minimums
            request.userData = userData;
            request.toInternalBalance = false; // use external balances to be able to transfer out tokenReceived

            vault.exitPool(poolId, address(this), payable(address(_to)), request);

            if (_to == address(this)) {
                _burnFeiHeld();
            }

            emit ExitPool(poolId, _to, bptBalance);
        }
    }

    /// @notice claim BAL rewards associated to this PCV Deposit.
    /// Note that if dual incentives are active, this will only claim BAL rewards.
    /// For more context, see the following links :
    /// - https://docs.balancer.fi/products/merkle-orchard
    /// - https://docs.balancer.fi/products/merkle-orchard/claiming-tokens
    /// A permissionless manual claim can always be done directly on the
    /// MerkleOrchard contract, on behalf of this PCVDeposit. This function is
    /// provided solely for claiming more conveniently the BAL rewards.
    function claimRewards(
        uint256 distributionId,
        uint256 amount,
        bytes32[] memory merkleProof
    ) external whenNotPaused {
        address BAL_TOKEN_ADDRESS = address(0xba100000625a3754423978a60c9317c58a424e3D);
        address BAL_TOKEN_DISTRIBUTOR = address(0x35ED000468f397AA943009bD60cc6d2d9a7d32fF);

        IERC20[] memory tokens = new IERC20[](1);
        tokens[0] = IERC20(BAL_TOKEN_ADDRESS);

        IMerkleOrchard.Claim memory claim = IMerkleOrchard.Claim({
            distributionId: distributionId,
            balance: amount,
            distributor: BAL_TOKEN_DISTRIBUTOR,
            tokenIndex: 0,
            merkleProof: merkleProof
        });
        IMerkleOrchard.Claim[] memory claims = new IMerkleOrchard.Claim[](1);
        claims[0] = claim;

        IMerkleOrchard(rewards).claimDistributions(address(this), claims, tokens);

        emit ClaimRewards(msg.sender, address(BAL_TOKEN_ADDRESS), address(this), amount);
    }
}
