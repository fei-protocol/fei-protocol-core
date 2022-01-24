// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IKashiPair {
    function removeAsset(address to, uint256 fraction) external returns (uint256 share);
}

/// @title base class for a claiming Kashi pair tokens
/// @author Fei Protocol
contract KashiPCVRedeemer {

    address public immutable target;

    constructor(
        address _target
    ) { target = _target; }

    /// @notice redeem Kashi shares
    /// @param pair kashi pair to redeem from
    /// @param fraction asset fraction to redeem
    function redeem(IKashiPair pair, uint256 fraction) external { 
        pair.removeAsset(target, fraction);
    }
}
