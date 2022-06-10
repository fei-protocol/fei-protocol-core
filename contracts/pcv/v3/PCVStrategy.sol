// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../../external/ERC4626.sol";
import "../../utils/ENSNamed.sol";
import "../../core/TribeRoles.sol";

/// @title Interface representing a PCV strategy
/// @author eswak
abstract contract PCVStrategy is ERC4626, ENSNamed {
    ICore private constant CORE = ICore(0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9);

    function setName(string calldata newName) public override {
        require(CORE.hasRole(TribeRoles.ENS_MANAGER_ROLE, msg.sender), "UNAUTHORIZED");
        _setName(newName);
    }

    // ---------- Read Methods ---------------

    /// @notice list of assets handled by this strategy
    /// asset() must be a assets()[0]
    function assets() public view virtual returns (address[] memory tokens) {
        tokens = new address[](1);
        tokens[0] = asset();
    }

    function balances(address owner) external view virtual returns (int256[] memory amounts) {
        amounts = new int256[](1);
        amounts[0] = int256(previewRedeem(balanceOf(owner)));
    }

    // ------ State-changing Methods ---------

    function claimRewards() external virtual {}

    /// @notice convert an amount of assets
    /// All numbers must be in the order returned by assets().
    function convertAssets(int256[] memory amountsIn, int256[] memory minAmountsOut)
        external
        virtual
        returns (int256[] memory amountsOut)
    {
        require(false, "NOT_IMPLEMENTED");
    }

    function withdrawERC20(address token) external virtual {
        // everyone can transfer random airdropped tokens to the tribe dao
        IERC20(token).safeTransfer(
            address(0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c),
            IERC20(token).balanceOf(address(this))
        );
    }
}
