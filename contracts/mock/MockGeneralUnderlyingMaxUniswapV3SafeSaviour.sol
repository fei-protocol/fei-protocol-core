// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.4;

import "../pcv/reflexer/GeneralUnderlyingMaxUniswapV3SafeSaviourLike.sol";
import "../pcv/reflexer/uni-v3/LiquidityAmounts.sol";

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface INonfungiblePositionManager is IERC721 {
    /// @notice Returns the position information associated with a given token ID.
    /// @dev Throws if the token ID is not valid.
    /// @param tokenId The ID of the token that represents the position
    /// @return nonce The nonce for permits
    /// @return operator The address that is approved for spending
    /// @return token0 The address of the token0 for a specific pool
    /// @return token1 The address of the token1 for a specific pool
    /// @return fee The fee associated with the pool
    /// @return tickLower The lower end of the tick range for the position
    /// @return tickUpper The higher end of the tick range for the position
    /// @return liquidity The liquidity of the position
    /// @return feeGrowthInside0LastX128 The fee growth of token0 as of the last action on the individual position
    /// @return feeGrowthInside1LastX128 The fee growth of token1 as of the last action on the individual position
    /// @return tokensOwed0 The uncollected amount of token0 owed to the position as of the last computation
    /// @return tokensOwed1 The uncollected amount of token1 owed to the position as of the last computation
    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }

    /// @notice Decreases the amount of liquidity in a position and accounts it to the position
    /// @param params tokenId The ID of the token for which liquidity is being decreased,
    /// amount The amount by which liquidity will be decreased,
    /// amount0Min The minimum amount of token0 that should be accounted for the burned liquidity,
    /// amount1Min The minimum amount of token1 that should be accounted for the burned liquidity,
    /// deadline The time by which the transaction must be included to effect the change
    /// @return amount0 The amount of token0 accounted to the position's tokens owed
    /// @return amount1 The amount of token1 accounted to the position's tokens owed
    function decreaseLiquidity(DecreaseLiquidityParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    /// @notice Collects up to a maximum amount of fees owed to a specific position to the recipient
    /// @param params tokenId The ID of the NFT for which tokens are being collected,
    /// recipient The account that should receive the tokens,
    /// amount0Max The maximum amount of token0 to collect,
    /// amount1Max The maximum amount of token1 to collect
    /// @return amount0 The amount of fees collected in token0
    /// @return amount1 The amount of fees collected in token1
    function collect(CollectParams calldata params) external payable returns (uint256 amount0, uint256 amount1);

    /// @notice Burns a token ID, which deletes it from the NFT contract. The token must have 0 liquidity and all tokens
    /// must be collected first.
    /// @param tokenId The ID of the token that is being burned
    function burn(uint256 tokenId) external payable;
}

abstract contract GebSafeManagerLike {
    function safes(uint256) public view virtual returns (address);

    function ownsSAFE(uint256) public view virtual returns (address);

    function safeCan(
        address,
        uint256,
        address
    ) public view virtual returns (uint256);
}

interface CollateralJoinLike {
    function safeEngine() external view returns (address);

    function collateralType() external view returns (bytes32);

    function collateral() external view returns (address);

    function decimals() external view returns (uint256);

    function contractEnabled() external view returns (uint256);

    function join(address, uint256) external;
}

interface CoinJoinLike {
    function systemCoin() external view returns (address);

    function safeEngine() external view returns (address);

    function join(address, uint256) external;
}

abstract contract SAFEEngineLike {
    function approveSAFEModification(address) external virtual;

    function safeRights(address, address) public view virtual returns (uint256);

    function collateralTypes(bytes32)
        public
        view
        virtual
        returns (
            uint256 debtAmount, // [wad]
            uint256 accumulatedRate, // [ray]
            uint256 safetyPrice, // [ray]
            uint256 debtCeiling, // [rad]
            uint256 debtFloor, // [rad]
            uint256 liquidationPrice // [ray]
        );

    function safes(bytes32, address)
        public
        view
        virtual
        returns (
            uint256 lockedCollateral, // [wad]
            uint256 generatedDebt // [wad]
        );

    function modifySAFECollateralization(
        bytes32 collateralType,
        address safe,
        address collateralSource,
        address debtDestination,
        int256 deltaCollateral, // [wad]
        int256 deltaDebt // [wad]
    ) external virtual;
}

contract MockGeneralUnderlyingMaxUniswapV3SafeSaviour is GeneralUnderlyingMaxUniswapV3SafeSaviourLike {
    // NFTs used to back safes
    mapping(address => NFTCollateral) public lpTokenCover;

    // Amount of tokens that were not used to save SAFEs
    mapping(address => mapping(address => uint256)) public underlyingReserves;

    GebSafeManagerLike public safeManager;
    SAFEEngineLike public safeEngine;
    LiquidationEngineLike public override liquidationEngine;
    INonfungiblePositionManager public positionManager;
    IERC20 public systemCoin;
    CollateralJoinLike public collateralJoin;
    CoinJoinLike public coinJoin;

    constructor(
        address coinJoin_,
        address collateralJoin_,
        address oracleRelayer_,
        address safeManager_,
        address saviourRegistry_,
        address positionManager_,
        address liquidationEngine_,
        uint256 minKeeperPayoutValue_
    ) {
        coinJoin = CoinJoinLike(coinJoin_);
        collateralJoin = CollateralJoinLike(collateralJoin_);
        // oracleRelayer = OracleRelayerLike(oracleRelayer_);
        systemCoin = IERC20(coinJoin.systemCoin());
        safeEngine = SAFEEngineLike(coinJoin.safeEngine());
        safeManager = GebSafeManagerLike(safeManager_);
        // saviourRegistry = SAFESaviourRegistryLike(saviourRegistry_);
        // liquidityRemover = UniswapV3LiquidityRemoverLike(liquidityRemover_);
        positionManager = INonfungiblePositionManager(positionManager_);
        liquidationEngine = LiquidationEngineLike(liquidationEngine_);
    }

    // --- Math Logic ---
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = x * y;
    }

    // --- Boolean Logic ---
    function both(bool x, bool y) internal pure returns (bool z) {
        assembly {
            z := and(x, y)
        }
    }

    function either(bool x, bool y) internal pure returns (bool z) {
        assembly {
            z := or(x, y)
        }
    }

    function getReserves(
        uint256 safeID,
        address[] calldata tokens,
        address dst
    ) external override {}

    /*
     * @notify Get back tokens that were withdrawn from Uniswap and not used to save a specific SAFE
     * @param safeID The ID of the safe that was previously saved and has leftover funds that can be withdrawn
     * @param token The address of the token being transferred
     * @param dst The address that will receive the reserve system coins
     */
    function getReserves(
        uint256 safeID,
        address token,
        address dst
    ) external override {}

    // --- Adding/Withdrawing Cover ---
    /*
     * @notice Deposit a NFT position in the contract in order to provide cover for a specific SAFE managed by the SAFE Manager
     * @param safeID The ID of the SAFE to protect. This ID should be registered inside GebSafeManager
     * @param tokenId The ID of the NFTed position
     */
    function deposit(uint256 safeID, uint256 tokenId) external override {
        address safeHandler = safeManager.safes(safeID);
        require(
            either(lpTokenCover[safeHandler].firstId == 0, lpTokenCover[safeHandler].secondId == 0),
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/cannot-add-more-positions"
        );

        // Fetch position details
        (, , address token0_, address token1_, , , , , , , , ) = positionManager.positions(tokenId);

        // Position checks
        require(token0_ != token1_, "GeneralUnderlyingMaxUniswapV3SafeSaviour/same-tokens");
        require(
            either(address(systemCoin) == token0_, address(systemCoin) == token1_),
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/not-sys-coin-pool"
        );

        // Check that the SAFE exists inside GebSafeManager
        require(safeHandler != address(0), "GeneralUnderlyingMaxUniswapV3SafeSaviour/null-handler");

        // Check that the SAFE has debt
        (, uint256 safeDebt) = SAFEEngineLike(collateralJoin.safeEngine()).safes(
            collateralJoin.collateralType(),
            safeHandler
        );
        require(safeDebt > 0, "GeneralUnderlyingMaxUniswapV3SafeSaviour/safe-does-not-have-debt");

        // Update the NFT positions used to cover the SAFE and transfer the NFT to this contract
        if (lpTokenCover[safeHandler].firstId == 0) {
            lpTokenCover[safeHandler].firstId = tokenId;
        } else {
            lpTokenCover[safeHandler].secondId = tokenId;
        }

        positionManager.transferFrom(msg.sender, address(this), tokenId);
        require(
            positionManager.ownerOf(tokenId) == address(this),
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/cannot-transfer-position"
        );
    }

    /*
     * @notice Withdraw lpToken from the contract and provide less cover for a SAFE
     * @dev Only an address that controls the SAFE inside the SAFE Manager can call this
     * @param safeID The ID of the SAFE to remove cover from. This ID should be registered inside the SAFE Manager
     * @param tokenId The ID of the NFTed position to withdraw
     * @param dst The address that will receive the LP tokens
     */
    function withdraw(
        uint256 safeID,
        uint256 tokenId,
        address dst
    ) external override {
        address safeHandler = safeManager.safes(safeID);

        require(
            positionManager.ownerOf(tokenId) == address(this),
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/position-not-in-contract"
        );
        require(
            either(lpTokenCover[safeHandler].firstId == tokenId, lpTokenCover[safeHandler].secondId == tokenId),
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/cannot-add-more-positions"
        );

        // Update NFT entries
        if (lpTokenCover[safeHandler].firstId == tokenId) {
            lpTokenCover[safeHandler].firstId = lpTokenCover[safeHandler].secondId;
        }
        lpTokenCover[safeHandler].secondId = 0;

        // Transfer NFT to the caller
        positionManager.transferFrom(address(this), dst, tokenId);
    }

    function saveSAFE(
        address keeper,
        bytes32 collateralType,
        address safeHandler
    )
        external
        override
        returns (
            bool,
            uint256,
            uint256
        )
    {
        require(
            address(liquidationEngine) == msg.sender,
            "GeneralUnderlyingMaxUniswapV3SafeSaviour/caller-not-liquidation-engine"
        );
        require(keeper != address(0), "GeneralUnderlyingMaxUniswapV3SafeSaviour/null-keeper-address");

        if (both(both(collateralType == "", safeHandler == address(0)), keeper == address(liquidationEngine))) {
            return (true, type(uint256).max, type(uint256).max);
        }

        /* ---- save SAFE ----- */
        // Withdraw all liquidity
        if (lpTokenCover[safeHandler].secondId != 0) {
            (address nonSysCoinToken, uint256 nonSysCoinBalance) = _removeLiquidity(lpTokenCover[safeHandler].secondId);

            if (nonSysCoinBalance > 0) {
                underlyingReserves[safeHandler][nonSysCoinToken] = add(
                    underlyingReserves[safeHandler][nonSysCoinToken],
                    nonSysCoinBalance
                );
            }
        }
        if (lpTokenCover[safeHandler].firstId != 0) {
            (address nonSysCoinToken, uint256 nonSysCoinBalance) = _removeLiquidity(lpTokenCover[safeHandler].firstId);

            if (nonSysCoinBalance > 0) {
                underlyingReserves[safeHandler][nonSysCoinToken] = add(
                    underlyingReserves[safeHandler][nonSysCoinToken],
                    nonSysCoinBalance
                );
            }
        }
    }

    function mockSAFEProtection(address safeHandler) external {
        // Withdraw all liquidity
        if (lpTokenCover[safeHandler].secondId != 0) {
            (address nonSysCoinToken, uint256 nonSysCoinBalance) = _removeLiquidity(lpTokenCover[safeHandler].secondId);

            if (nonSysCoinBalance > 0) {
                underlyingReserves[safeHandler][nonSysCoinToken] = add(
                    underlyingReserves[safeHandler][nonSysCoinToken],
                    nonSysCoinBalance
                );
            }
        }
        if (lpTokenCover[safeHandler].firstId != 0) {
            (address nonSysCoinToken, uint256 nonSysCoinBalance) = _removeLiquidity(lpTokenCover[safeHandler].firstId);

            if (nonSysCoinBalance > 0) {
                underlyingReserves[safeHandler][nonSysCoinToken] = add(
                    underlyingReserves[safeHandler][nonSysCoinToken],
                    nonSysCoinBalance
                );
            }
        }
    }

    function _removeLiquidity(uint256 _tokenId) internal returns (address nonSysCoin, uint256 nonSysCoinBalance) {
        (, , address token0, address token1, , , , uint128 liquidity, , , , ) = positionManager.positions(_tokenId);

        (uint256 amount0, uint256 amount1) = positionManager.decreaseLiquidity(
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: _tokenId,
                liquidity: liquidity,
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            })
        );
        positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: _tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        (nonSysCoin, nonSysCoinBalance) = (token0 == address(systemCoin)) ? (token1, amount1) : (token0, amount0);
    }

    function getKeeperPayoutValue() external override returns (uint256) {}

    function keeperPayoutExceedsMinValue() external override returns (bool) {}

    function canSave(bytes32, address) external override returns (bool) {}

    function tokenAmountUsedToSave(bytes32, address) external override returns (uint256) {}
}
