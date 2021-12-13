// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "../IPCVDepositBalances.sol";
import "./IBAMM.sol";

/// @title BAMMLens
/// @author Fei Protocol
/// @notice a contract to read manipulation resistant LUSD from BAMM 
contract BAMMLens is IPCVDepositBalances {

    /// @notice address of reported token for BAMM    
    address public constant override balanceReportedIn = address(0x5f98805A4E8be255a32880FDeC7F6728C6568bA0);

    /// @notice B. Protocol BAMM address
    IBAMM public constant BAMM = IBAMM(0x0d3AbAA7E088C2c82f54B2f47613DA438ea8C598);

    /// @notice Liquity Stability pool address
    IStabilityPool public immutable stabilityPool = BAMM.SP();

    /// @notice Address to read BAMM balance from
    address public immutable target;

    uint256 constant public PRECISION = 1e18;

    constructor(address _target) { target = _target; }

    /// @notice the oracle for the other token in the pair (not balanceReportedIn)
    function balance() public view override returns(uint256) {
        return depositedSupply(target);
    }

    function resistantBalanceAndFei() public view override returns(uint256, uint256) {
        return (balance(), 0);
    }

    // proportional amount of BAMM USD value held by this contract
    function depositedSupply(address depositor) internal view returns (uint256) {
        uint256 ethBalance  = stabilityPool.getDepositorETHGain(address(BAMM));

        uint256 eth2usdPrice = BAMM.fetchPrice();
        require(eth2usdPrice != 0, "chainlink is down");

        uint256 ethUsdValue = ethBalance * eth2usdPrice / PRECISION;

        uint256 bammLusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        return (bammLusdValue + ethUsdValue) * BAMM.balanceOf(depositor) / BAMM.totalSupply();
    }
}
