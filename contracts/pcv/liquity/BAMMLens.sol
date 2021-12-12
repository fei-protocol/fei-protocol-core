// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "../IPCVDepositBalances.sol";

/// @title BAMMLens
/// @author Fei Protocol
/// @notice a contract to read manipulation resistant LUSD from BAMM 
contract BAMMLens is IPCVDepositBalances {
        
    address public constant override balanceReportedIn = address(0);

    /// @notice the oracle for the other token in the pair (not balanceReportedIn)
    function balance() public view override returns(uint256) {
    }

    function resistantBalanceAndFei() public view override returns(uint256, uint256) {
    }
}
