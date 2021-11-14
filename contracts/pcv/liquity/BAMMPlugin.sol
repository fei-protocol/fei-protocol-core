// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../../external/rari/IPlugin.sol";
import "../../external/CErc20Delegator.sol";


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

    /// @notice transfer shares
    function transfer(address to, uint256 amount) external;

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

interface ICErc20Plugin {
    function plugin() external view returns(address);
}

/**
 * @title Rari's CLusd BAMM Plugin
 * @notice CErc20Plugin which wraps LUSD B. Protocol deposit
 * @author Joey Santoro
 *
 * BAMMPlugin deposits unborrowed LUSD into the Liquity Stability pool via B. Protocol BAMM
 * The BAMM compounds LUSD deposits by selling ETH into LUSD as the stability pool is utilized.
 * Note that there can still be some ETH as the BAMM does not force convert all ETH.
 * 
 * Any existing ETH withdrawn from BAMM will be either:
 *   1. Swapped for LUSD by lusdSwapper if > minimum ETH swap value 
 *   2. Sent to lusdSwapper is < minimum ETH swap value (to save gas)
 *
 * LQTY rewards are sent to cToken to be distributed via PluginRewardsDistributor
 */
contract BAMMPlugin is IPlugin {

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
    IBAMM public immutable BAMM;

    /**
     * @notice Lqty token address
     */
    address public lqty;

    IERC20 public lusd;

    address public immutable cToken;

    /// @notice buffer is the target percentage of LUSD deposits to remaing outside stability pool
    uint256 public buffer;

    uint256 constant public PRECISION = 1e18;

    /// @notice minimum swap amount for the lusdSwapper to perform a swap
    uint256 public ethSwapMin;

    bool public enableBAMM = true;

    address internal constant fuseAdmin = address(0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85);

    modifier onlyCToken {
        require(msg.sender == cToken, "onlyCToken");
        _;
    }

    modifier onlyFuseAdmin {
        Unitroller comptroller = CErc20Delegator(cToken).comptroller();
        require(
            (msg.sender == comptroller.admin() && comptroller.adminHasRights()) || 
            (msg.sender == address(fuseAdmin) && comptroller.fuseAdminHasRights()), 
            "admin"
        );
        _;
    }

    constructor(address _cToken, IBAMM _bamm, ILUSDSwapper _lusdSwapper, uint256 _ethSwapMin, uint256 _buffer) {
        cToken = _cToken;
        BAMM = _bamm;

        lusdSwapper = _lusdSwapper;
        ethSwapMin = _ethSwapMin;
        buffer = _buffer;

        // Approve moving our LUSD into the BAMM rewards contract.
        lusd.approve(address(_bamm), type(uint256).max);
    }

    receive () external payable {} // contract should be able to receive ETH

    /*** Fuse Admin methods ***/

    /// @notice transfer out all assets to a new plugin
    function transferPlugin(address newPlugin) external onlyFuseAdmin {
        require(ICErc20Plugin(cToken).plugin() == newPlugin, "plugin");

        transferLQTY();
        BAMM.transfer(newPlugin, BAMM.balanceOf(address(this)));
        lusd.transfer(newPlugin, lusd.balanceOf(address(this)));
    }

    function toggleBAMM(bool enabled, bool doWithdraw) external onlyFuseAdmin {
        enableBAMM = enabled;
        if (!enabled && doWithdraw) {
            BAMM.withdraw(BAMM.balanceOf(address(this)));
        }
    }

    function setLUSDSwapper(address newLusdSwapper) external onlyFuseAdmin {
        lusdSwapper = ILUSDSwapper(newLusdSwapper);
    }

    function setEthSwapMin(uint256 newEthSwapMin) external onlyFuseAdmin {
        ethSwapMin = newEthSwapMin;
    }

    function setBuffer(uint256 newBuffer) external onlyFuseAdmin {
        buffer = newBuffer;
    }

    /*** IPlugin View methods ***/

    function getCash() external view override returns (uint256) {
        uint256 heldSupply = lusd.balanceOf(address(this));

        return heldSupply + depositedSupply();
    }

    function rewardToken() external view override returns (address) {
        return lqty;
    }

    /*** IPlugin State changing methods ***/

    /**
     * @notice Transfer the underlying to this contract and sweep into rewards contract
     * @param amount Amount of underlying to transfer
     */
    function deposit(
        uint256 amount
    ) external override onlyCToken {
        if (!enableBAMM) {
            return;
        }

        uint256 heldBalance = lusd.balanceOf(address(this));
        require(heldBalance >= amount, "no transfer");

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
    ) external override onlyCToken {
        uint256 heldBalance = lusd.balanceOf(address(this));

        if (amount > heldBalance && enableBAMM) {
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

    function claim() public override {
        if (enableBAMM) {
            BAMM.withdraw(0); // Claim LQTY
            transferLQTY();
        }
    }

    /*** Internal methods ***/

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

    // proportional amount of BAMM LUSD held by this contract
    function depositedSupply() internal view returns (uint256) {
        uint256 bammLusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        return bammLusdValue * BAMM.balanceOf(address(this)) / BAMM.totalSupply();
    }
}