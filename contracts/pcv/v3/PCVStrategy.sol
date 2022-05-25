// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../../external/ERC4626.sol";

/// @title Interface representing a PCV strategy
/// @author eswak
abstract contract PCVStrategy is ERC4626 {
    // ---------- Read Methods ---------------

    function underlyingAssets() external view virtual returns (address[] memory tokens) {
        tokens = new address[](1);
        tokens[0] = asset();
        return tokens;
    }

    // ------ State-changing Methods ---------

    function convertUnderlyingsToAsset(int256[] memory amounts, uint16 maxSlippageBps)
        external
        virtual
        returns (int256 amount)
    {
        amount = amounts[0];
    }

    function convertAssetToUnderlyings(int256 amount, uint16 maxSlippageBps)
        external
        virtual
        returns (int256[] memory amounts)
    {
        amounts[0] = amount;
    }

    function claimRewards(address token, address owner) external virtual {}
}
