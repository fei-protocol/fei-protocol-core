// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../external/rari/IPlugin.sol";
import "../../external/CErc20Delegator.sol";

import "./ILUSDSwapper.sol";
import "./IBAMM.sol";

interface ICErc20Plugin is CErc20Delegator {
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

    event TransferPlugin(address indexed newPlugin);

    event ToggleBAMM(bool newToggle, bool doWithdraw);

    event BufferUpdate(uint256 newBuffer);

    event LUSDSwapperUpdate(address newLusdSwapper);

    event EthSwapMinUpdate(uint256 ethSwapMin);

    /**
     * @notice Liquity Stability Pool address
     */
    IStabilityPool public immutable stabilityPool;
    
    /**
     * @notice B. Protocol BAMM address
     */
    IBAMM public immutable BAMM;

    /**
     * @notice Lqty token address
     */
    address public immutable lqty;

    IERC20 public immutable lusd;

    address public immutable cToken;

    /**
     * @notice LUSD swapper address
     */
    ILUSDSwapper public lusdSwapper;

    /// @notice buffer is the target percentage of LUSD deposits to remaing outside stability pool
    uint256 public buffer;

    /// @notice minimum swap amount for the lusdSwapper to perform a swap
    uint256 public ethSwapMin;

    bool public enableBAMM = true;

    uint256 constant public PRECISION = 1e18;

    address internal constant fuseAdmin = address(0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85);

    modifier onlyCToken {
        require(msg.sender == cToken, "onlyCToken");
        _;
    }

    modifier onlyFuseAdmin {
        Unitroller comptroller = ICErc20Plugin(cToken).comptroller();
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

        IERC20 _lusd = _bamm.LUSD();

        lusd = _lusd;
        lqty = _bamm.bonus();
        stabilityPool = _bamm.SP();
        
        // Approve moving our LUSD into the BAMM rewards contract.
        _lusd.approve(address(_bamm), type(uint256).max);
    }

    receive () external payable {} // contract should be able to receive ETH

    /*** Fuse Admin methods ***/

    /// @notice toggle whether to enable the BAMM logic
    /// @param enabled flag to enable/disable the BAMM logic
    /// @param doWithdraw flag to trigger a full withdrawal on BAMM if disabled
    function toggleBAMM(bool enabled, bool doWithdraw) external onlyFuseAdmin {
        enableBAMM = enabled;
        if (!enabled && doWithdraw) {
            BAMM.withdraw(BAMM.balanceOf(address(this)));
        }
        emit ToggleBAMM(enabled, doWithdraw);
    }

    /// @notice set new LusdSwapper
    function setLUSDSwapper(address newLusdSwapper) external onlyFuseAdmin {
        require(newLusdSwapper != address(0), "zero");

        lusdSwapper = ILUSDSwapper(newLusdSwapper);
        emit LUSDSwapperUpdate(newLusdSwapper);
    }

    /// @notice set new EthSwapMin
    function setEthSwapMin(uint256 newEthSwapMin) external onlyFuseAdmin {
        require(newEthSwapMin > 0, "zero");

        ethSwapMin = newEthSwapMin;
        emit EthSwapMinUpdate(ethSwapMin);
    }

    /// @notice set new buffer
    function setBuffer(uint256 newBuffer) external onlyFuseAdmin {
        require(newBuffer != 0, "zero");
        buffer = newBuffer;

        emit BufferUpdate(newBuffer);
    }

    /*** IPlugin View methods ***/

    /// @notice return cumulative LUSD belonging to this contract
    /// @dev this is an underestimate due to the ETH also held by BAMM
    function getCash() external view override returns (uint256) {
        uint256 heldSupply = lusd.balanceOf(address(this));

        return heldSupply + depositedSupply();
    }

    /// @notice return the reward token (for compatibility with IPlugin)
    /// @dev alias for lqty
    function rewardToken() external view override returns (address) {
        return lqty;
    }

    /*** IPlugin State changing methods ***/

    /// @notice transfer out all assets to a new plugin
    function transferPlugin(address newPlugin) external onlyCToken {
        require(ICErc20Plugin(cToken).plugin() == newPlugin, "plugin");

        transferLQTY();
        BAMM.transfer(newPlugin, BAMM.balanceOf(address(this)));
        lusd.transfer(newPlugin, lusd.balanceOf(address(this)));
        emit TransferPlugin(newPlugin);
    }

    /**
     * @notice Deposit excess held tokens to BAMM if enabled
     * @param amount Amount of underlying expected to be held by this contract. Unrelated to BAMM deposit amount
     */
    function deposit(
        uint256 amount
    ) external override onlyCToken {
        if (!enableBAMM) {
            return;
        }

        uint256 heldBalance = lusd.balanceOf(address(this));
        require(heldBalance >= amount, "no transfer"); // Make sure at least amount tokens were transferred from cToken

        uint256 depositedBalance = depositedSupply();

        uint256 targetHeld = (depositedBalance + heldBalance) * buffer / PRECISION;

        if (heldBalance > targetHeld) {
            // Deposit excess tokens to BAMM
            BAMM.deposit(heldBalance - targetHeld);
        }
    }

    /**
     * @notice Send tokens to recipient, withdrawing from BAMM if needed and enabled
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
            uint256 shares = (lusdNeeded * totalSupply / lusdValue) + 1; // extra unit to prevent truncation errors

            // Swap surplus BAMM ETH out for LUSD
            handleETH();

            // Withdraw the LUSD from BAMM (also withdraws LQTY and dust ETH)
            BAMM.withdraw(shares);

            // Send all held ETH to lusd swapper. Intentionally no failure check, because failure should not block withdrawal
            address(lusdSwapper).call{value: address(this).balance}("");
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

    // proportional amount of BAMM USD value held by this contract
    function depositedSupply() internal view returns (uint256) {
        uint256 ethBalance  = stabilityPool.getDepositorETHGain(address(BAMM));

        uint256 eth2usdPrice = BAMM.fetchPrice();
        require(eth2usdPrice != 0, "chainlink is down");

        uint256 ethUsdValue = ethBalance * eth2usdPrice / PRECISION;

        uint256 bammLusdValue = stabilityPool.getCompoundedLUSDDeposit(address(BAMM));
        return (bammLusdValue + ethUsdValue) * BAMM.balanceOf(address(this)) / BAMM.totalSupply();
    }
}