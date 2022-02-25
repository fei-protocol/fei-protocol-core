//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./MergerBase.sol";

/**
 @title Contract to exchange RGT with TRIBE post-merger
 @author elee, Joey Santoro
 @notice allows for exchange from RGT to TRIBE post-merger
 Includes an expiry window intitially unset, with a minimum duration
*/
contract PegExchanger is MergerBase {
    using SafeERC20 for IERC20;

    /// @notice minimum amount of notice an RGT holder would have to exchange before expiring
    uint256 public constant MIN_EXPIRY_WINDOW = 180 days;

    /// @notice the multiplier applied to RGT before converting to TRIBE scaled up by 1e9
    uint256 public constant exchangeRate = 26705673430; // 26.7 TRIBE / RGT

    /// @notice the last epoch timestam an exchange can occur
    /// @dev settable by governance
    uint256 public expirationTimestamp = type(uint256).max;

    event Exchange(address indexed from, uint256 amountIn, uint256 amountOut);
    event SetExpiry(address indexed caller, uint256 expiry);

    constructor(address tribeRariDAO) MergerBase(tribeRariDAO) {}

    /// @notice call to exchange held RGT with TRIBE
    /// @param amount the amount to exchange
    function exchange(uint256 amount) public {
        require(!isExpired(), "Redemption period is over");
        require(bothPartiesAccepted, "Proposals are not both passed");
        uint256 tribeOut = (amount * exchangeRate) / scalar;
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
            bothPartiesAccepted == true,
            "Contract must be enabled before admin functions called"
        );
        expirationTimestamp = timestamp;
        emit SetExpiry(msg.sender, timestamp);
    }
}
