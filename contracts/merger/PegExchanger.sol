//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MergerBase.sol";

/// @title Contract to exchange RGT with TRIBE post-merger
/// @author elee
contract PegExchanger is MergerBase {
    using SafeERC20 for IERC20;

    uint256 public constant MIN_EXPIRY_WINDOW = 180 days;

    uint256 public constant exchangeRate = 26705673430; // 26.7 TRIBE / RGT

    uint256 public expirationTimestamp = type(uint256).max;

    event Exchange(address indexed from, uint256 amountIn, uint256 amountOut);
    event SetExpiry(uint256 expiry);

    /// @notice since all variables are hard coded, the constructor does nothing
    constructor(address tribeRariDAO) MergerBase(tribeRariDAO) {}

    /// @notice call to exchange held RGT with TRIBE
    /// @param amount the amount to scale the base exchange amounts by
    function exchange(uint256 amount) public {
        require(!isExpired(), "Redemption period is over");
        require(isEnabled, "Proposals are not both passed");
        uint256 tribeOut =  amount * exchangeRate / scalar;
        rgt.safeTransferFrom(msg.sender, address(this), amount);
        tribe.safeTransfer(msg.sender, tribeOut);
        emit Exchange(msg.sender, amount, tribeOut);
    }

    /// @notice tells whether or not the contract is expired.
    /// @return boolean true if we have passed the expiration block, else false
    function isExpired() public view returns (bool) {
        return block.timestamp > expirationTimestamp;
    }

    // Admin function

    /// @param timestamp  the block timestamp for expiration
    /// @notice the expiry must be set to at least MIN_EXPIRY_WINDOW in the future.
    function setExpirationTimestamp(uint256 timestamp) public {
        require(
            msg.sender == tribeTimelock,
            "Only the tribe timelock may call this function"
        );
        require(
            timestamp > (block.timestamp + MIN_EXPIRY_WINDOW),
            "timestamp too low"
        );
        require(
            isEnabled == true,
            "Contract must be enabled before admin functions called"
        );
        expirationTimestamp = timestamp;
        emit SetExpiry(timestamp);
    }
}