// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC4626 interface
/// See: https://eips.ethereum.org/EIPS/eip-4626
interface IERC4626 is IERC20 {
    function asset() external view returns (address asset);

    function totalAssets() external view returns (uint256 totalAssets);

    function deposit(uint256 assets, address receiver)
        external
        returns (uint256 shares);

    function mint(uint256 shares, address receiver)
        external
        returns (uint256 assets);

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) external returns (uint256 shares);

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) external returns (uint256 assets);

    function convertToShares(uint256 assets)
        external
        view
        returns (uint256 shares);

    function convertToAssets(uint256 shares)
        external
        view
        returns (uint256 assets);

    function maxDeposit(address owner)
        external
        view
        returns (uint256 maxAssets);

    function maxWithdraw(address owner)
        external
        view
        returns (uint256 maxAssets);

    function maxMint(address owner) external view returns (uint256 maxShares);

    function maxRedeem(address owner) external view returns (uint256 maxShares);

    function previewDeposit(uint256 assets)
        external
        view
        returns (uint256 shares);

    function previewWithdraw(uint256 assets)
        external
        view
        returns (uint256 shares);

    function previewMint(uint256 shares) external view returns (uint256 assets);

    function previewRedeem(uint256 shares)
        external
        view
        returns (uint256 assets);
}
