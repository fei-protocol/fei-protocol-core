// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.4;

abstract contract LiquidationEngineLike {
    function protectSAFE(
        bytes32,
        address,
        address
    ) external virtual;
}

interface ISafeSaviour {
    // --- Variables ---
    function liquidationEngine() external view returns (LiquidationEngineLike);

    // --- Saving Logic ---
    /*
     * @notice Saves a SAFE by withdrawing liquidity and repaying debt and/or adding more collateral
     * @dev Only the LiquidationEngine can call this
     * @param keeper The keeper that called LiquidationEngine.liquidateSAFE and that should be rewarded for spending gas to save a SAFE
     * @param collateralType The collateral type backing the SAFE that's being liquidated
     * @param safeHandler The handler of the SAFE that's being liquidated
     * @return Whether the SAFE has been saved, the amount of NTF tokens that were used to withdraw liquidity as well as the amount of
     *         system coins sent to the keeper as their payment (this implementation always returns 0)
     */
    function saveSAFE(
        address keeper,
        bytes32 collateralType,
        address safeHandler
    )
        external
        returns (
            bool,
            uint256,
            uint256
        );

    function getKeeperPayoutValue() external returns (uint256);

    function keeperPayoutExceedsMinValue() external returns (bool);

    function canSave(bytes32, address) external returns (bool);

    function tokenAmountUsedToSave(bytes32, address) external returns (uint256);
}

interface GeneralUnderlyingMaxUniswapV3SafeSaviourLike is ISafeSaviour {
    struct NFTCollateral {
        uint256 firstId;
        uint256 secondId;
    }

    // --- Transferring Reserves ---
    /*
     * @notice Get back multiple tokens that were withdrawn from Uniswap and not used to save a specific SAFE
     * @param safeID The ID of the safe that was previously saved and has leftover funds that can be withdrawn
     * @param tokens The addresses of the tokens being transferred
     * @param dst The address that will receive the reserve system coins
     */
    function getReserves(
        uint256 safeID,
        address[] calldata tokens,
        address dst
    ) external;

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
    ) external;

    // --- Adding/Withdrawing Cover ---
    /*
     * @notice Deposit a NFT position in the contract in order to provide cover for a specific SAFE managed by the SAFE Manager
     * @param safeID The ID of the SAFE to protect. This ID should be registered inside GebSafeManager
     * @param tokenId The ID of the NFTed position
     */
    function deposit(uint256 safeID, uint256 tokenId) external;

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
    ) external;
}
