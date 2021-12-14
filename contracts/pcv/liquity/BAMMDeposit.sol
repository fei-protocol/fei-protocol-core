// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;  

import "../PCVDeposit.sol";
import "./IBAMM.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title BAMMDeposit
/// @author Fei Protocol
/// @notice a contract to read manipulation resistant LUSD from BAMM 
contract BAMMDeposit is PCVDeposit {
    using SafeERC20 for IERC20;

    /// @notice LUSD, the reported token for BAMM    
    address public constant override balanceReportedIn = address(0x5f98805A4E8be255a32880FDeC7F6728C6568bA0);

    /// @notice B. Protocol BAMM address
    IBAMM public constant BAMM = IBAMM(0x0d3AbAA7E088C2c82f54B2f47613DA438ea8C598);

    /// @notice Liquity Stability pool address
    IStabilityPool public immutable stabilityPool = BAMM.SP();

    uint256 constant public PRECISION = 1e18;

    constructor(address core) CoreRef(core) {}

    receive() external payable {}
    
    /// @notice deposit into B Protocol BAMM
    function deposit() 
        external
        override
        whenNotPaused
    {
        IERC20 lusd = IERC20(balanceReportedIn);
        uint256 amount = lusd.balanceOf(address(this));

        lusd.safeApprove(address(BAMM), amount);
        BAMM.deposit(amount);
    }

    /// @notice withdraw LUSD from B Protocol BAMM
    function withdraw(address to, uint256 amount) external override onlyPCVController {
        uint256 totalSupply = BAMM.totalSupply();
        uint256 lusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        uint256 shares = (amount * totalSupply / lusdValue) + 1; // extra unit to prevent truncation errors

        // Withdraw the LUSD from BAMM (also withdraws LQTY and dust ETH)
        BAMM.withdraw(shares);

        IERC20(balanceReportedIn).safeTransfer(to, amount);
        emit Withdrawal(msg.sender, to, amount);
    }

    /// @notice report LUSD balance of BAMM 
    // proportional amount of BAMM USD value held by this contract       
    function balance() public view override returns(uint256) {
        uint256 ethBalance  = stabilityPool.getDepositorETHGain(address(BAMM));

        uint256 eth2usdPrice = BAMM.fetchPrice();
        require(eth2usdPrice != 0, "chainlink is down");

        uint256 ethUsdValue = ethBalance * eth2usdPrice / PRECISION;

        uint256 bammLusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        return (bammLusdValue + ethUsdValue) * BAMM.balanceOf(address(this)) / BAMM.totalSupply();
    }

    function claimRewards() public {
        BAMM.withdraw(0); // Claim LQTY
    }
}
