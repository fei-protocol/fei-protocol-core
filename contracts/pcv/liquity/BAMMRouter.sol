// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Ref: https://github.com/backstop-protocol/dev/blob/main/packages/contracts/contracts/B.Protocol/BAMM.sol
interface IBAMM {

    // Views

    /// @notice returns ETH price scaled by 1e18
    function fetchPrice() external view returns (uint256);

    /// @notice returns amount of ETH received for an LUSD swap
    function getSwapEthAmount(uint256 lusdQty) external view returns (uint256 ethAmount, uint256 feeEthAmount);

    /// @notice LUSD token address
    function LUSD() external view returns (IERC20);

    /// @notice Liquity Stability Pool Address
    function SP() external view returns (IStabilityPool);

    /// @notice BAMM shares held by user
    function balanceOf(address account) external view returns (uint256);

    /// @notice total BAMM shares
    function totalSupply() external view returns (uint256);

    /// @notice Reward token
    function bonus() external view returns (address);

    // Mutative Functions

    /// @notice deposit LUSD for shares in BAMM
    function deposit(uint256 lusdAmount) external;

    /// @notice withdraw shares  in BAMM for LUSD + ETH
    function withdraw(uint256 numShares) external;

    /// @notice swap LUSD to ETH in BAMM
    function swap(uint256 lusdAmount, uint256 minEthReturn, address dest) external returns(uint256);
}

// Ref: https://github.com/backstop-protocol/dev/blob/main/packages/contracts/contracts/StabilityPool.sol
interface IStabilityPool {
    function getCompoundedLUSDDeposit(address holder) external view returns(uint256 lusdValue);
    
    function getDepositorETHGain(address holder) external view returns(uint256 ethValue);
}

interface ILUSDSwapper {
    function swapLUSD(uint256 lusdAmount, uint256 minEthReturn) external;
}

/**
 * @title Rari's CLusd's Contract
 * @notice CToken which wraps LUSD B. Protocol deposit
 * @author Joey Santoro
 *
 * CLusdDelegate deposits unborrowed LUSD into the Liquity Stability pool via B. Protocol BAMM
 * The BAMM compounds LUSD deposits by selling ETH into LUSD as the stability pool is utilized.
 * Note that there can still be some ETH as the BAMM does not force convert all ETH.
 * 
 * Any existing ETH withdrawn from BAMM will be either:
 *   1. Swapped for LUSD by lusdSwapper if > 0.01% of the pool value
 *   2. Sent to lusdSwapper is < 0.01% of the pool value
 *
 * LQTY rewards accrue proportionally to depositors
 */
contract BAMMRouter {

    event ClaimRewards(uint256 lqtyAmount);

    event LusdSwap(address indexed lusdSwapper, uint256 lusdAmount, uint256 minEthAmount);

    /**
     * @notice Liquity Stability Pool address
     */
    IStabilityPool public stabilityPool;

    /**
     * @notice LUSD swapper address
     */
    ILUSDSwapper public lusdSwapper;

    /**
     * @notice B. Protocol BAMM address
     */
    IBAMM public BAMM;

    /**
     * @notice Lqty token address
     */
    address public lqty;

    IERC20 public lusd;

    address public cToken;

    /// @notice buffer is the target percentage of LUSD deposits to remaing outside stability pool
    uint256 public buffer;

    uint256 constant public PRECISION = 1e18;

    /// @notice minimum swap amount for the lusdSwapper to perform a swap
    uint256 public ethSwapMin;

    constructor(address _cToken, IBAMM _bamm, address _lusdSwapper, uint256 _ethSwapMin) {
        // TODO complete constructor, add admin functions callable from cToken, update ACL, fix comments

        // Approve moving our LUSD into the BAMM rewards contract.
        lusd.approve(address(_bamm), type(uint256).max);
    }

    receive () external payable {} // contract should be able to receive ETH

    /*** CToken Overrides ***/

    /*** Safe Token ***/

    // proportional amount of BAMM LUSD held by this contract
    function depositedSupply() public view returns (uint256) {
        uint256 bammLusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        return bammLusdValue * BAMM.balanceOf(address(this)) / BAMM.totalSupply();
    }

    /**
     * @notice Transfer the underlying to this contract and sweep into rewards contract
     * @param amount Amount of underlying to transfer
     */
    function deposit(
        uint256 amount
    ) external {
        uint256 heldBalance = lusd.balanceOf(address(this));

        uint256 depositedBalance = depositedSupply();

        uint256 targetHeld = (depositedBalance + heldBalance) * buffer / PRECISION;

        if (heldBalance > targetHeld) {
            // Deposit to BAMM
            BAMM.deposit(heldBalance - targetHeld);
        }
    }

    /**
     * @notice Transfer the underlying from this contract
     * @param amount Amount of underlying to transfer
     */
    function withdraw(
        address payable to,
        uint256 amount
    ) external {
        uint256 heldBalance = lusd.balanceOf(address(this));

        if (amount > heldBalance) {
            uint256 lusdNeeded = amount - heldBalance;
            uint256 totalSupply = BAMM.totalSupply();
            uint256 lusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
            uint256 shares = lusdNeeded * totalSupply / lusdValue;

            // Swap surplus BAMM ETH out for LUSD
            handleETH();

            // Withdraw the LUSD from BAMM
            BAMM.withdraw(shares);
            transferLQTY();

            // Send all held ETH to lusd swapper. Intentionally no failure check, because failure should not block withdrawal
            address(lusdSwapper).call{value: address(this).balance}("");
        } else {
            claim();
        }
        require(lusd.transfer(to, amount), "send fail");
    }

    function claim() public {
        BAMM.withdraw(0); // Claim LQTY
        transferLQTY();
    }

    function transferLQTY() internal {
        IERC20 token = IERC20(lqty);
        uint256 lqtyAmount = token.balanceOf(address(this));

        token.transfer(cToken, lqtyAmount);
        
        emit ClaimRewards(lqtyAmount);
    }

    /**
     * If BAMM ETH amount is below ratio, send to LUSD swapper, otherwise force LUSD swapper to swap for surplus ETH
     */
    function handleETH() internal {
        uint256 ethTotal = stabilityPool.getDepositorETHGain(address(BAMM));

        if (ethTotal > ethSwapMin) {
            uint256 eth2usdPrice = BAMM.fetchPrice();
            uint256 ethUsdValue = ethTotal * eth2usdPrice / PRECISION;

            lusdSwapper.swapLUSD(ethUsdValue, ethTotal);
            emit LusdSwap(address(lusdSwapper), ethUsdValue, ethTotal);
        }
    }
}