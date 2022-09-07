// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {TransparentUpgradeableProxy, ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/// @title Helper contract for OTC purchase of admin rights over a proxy
/// @author eswak
contract ProxyOTCEscrow is Ownable {
    using SafeERC20 for IERC20;

    TransparentUpgradeableProxy public immutable proxy;
    IERC20 public immutable otcToken;
    uint256 public immutable otcAmount;
    address public immutable otcPurchaser;
    address public immutable otcDestination;

    constructor(
        address _owner,
        address _otcToken,
        uint256 _otcAmount,
        address _otcPurchaser,
        address _otcDestination,
        address _proxy
    ) Ownable() {
        _transferOwnership(_owner);
        otcToken = IERC20(_otcToken);
        otcAmount = _otcAmount;
        otcPurchaser = _otcPurchaser;
        otcDestination = _otcDestination;
        proxy = TransparentUpgradeableProxy(payable(address(_proxy)));
    }

    /// @notice buy the proxy in an OTC transaction
    function otcBuy(address newProxyAdmin) external {
        require(msg.sender == otcPurchaser, "UNAUTHORIZED");
        otcToken.safeTransferFrom(msg.sender, otcDestination, otcAmount);
        _transferOwnership(address(0)); // revoke ownership
        proxy.changeAdmin(newProxyAdmin);
    }

    /// @notice usable while OTC has not executed, for the Owner to recover
    /// proxy ownership (that is otherwise escrowed on this contract).
    function recoverProxyOwnership(address to) external onlyOwner {
        proxy.changeAdmin(to);
    }
}
