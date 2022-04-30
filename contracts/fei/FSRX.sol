import {ERC20} from "../external/solmate/tokens/ERC20.sol";
import {ERC4626} from "../external/solmate/mixins/ERC4626.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Constants} from "../Constants.sol";

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

library FSRXConfig {
    address internal constant CORE_ADDRESS = address(0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9);
    address internal constant FEI_ADDRESS = address(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);

    string internal constant TOKEN_NAME = "Fei Savings Rate";
    string internal constant TOKEN_SYMBOL = "FSRX";

    uint256 internal constant MAX_INTEREST_RATE = 1_000_000;

    event InterestRateUpdate(uint256 newRate);
    error InterestRateTooHigh(uint256 providedRate, uint256 maxRate);
}

contract FSRX is ERC4626, CoreRef {
    uint256 public lastUpdated;
    uint256 public fsrxPrice;
    uint256 public interestRate;

    modifier accrue() {
        accrueInterest();
        _;
    }

    constructor()
        ERC4626(ERC20(FSRXConfig.FEI_ADDRESS), FSRXConfig.TOKEN_NAME, FSRXConfig.TOKEN_SYMBOL)
        CoreRef(FSRXConfig.CORE_ADDRESS)
    {}

    /// @dev allows governance to set the interest rate
    /// We accrue interest before it is set.
    function setInterestRate(uint256 rate)
        external
        hasAnyOfTwoRoles(TribeRoles.PARAMETER_ADMIN, TribeRoles.GOVERNOR)
        accrue
    {
        if (rate > FSRXConfig.MAX_INTEREST_RATE)
            revert FSRXConfig.InterestRateTooHigh(rate, FSRXConfig.MAX_INTEREST_RATE);
        interestRate = rate;
        emit FSRXConfig.InterestRateUpdate(rate);
    }

    /// @dev before deposits, we accrue interest
    function deposit(uint256 assets, address receiver) public virtual override accrue returns (uint256 shares) {
        return super.deposit(assets, receiver);
    }

    /// @dev before minting, we accrue interest
    function mint(uint256 shares, address receiver) public virtual override accrue returns (uint256 assets) {
        return super.deposit(shares, receiver);
    }

    /// @dev before redeems, we accrue interest
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override accrue returns (uint256 assets) {
        return super.redeem(shares, receiver, owner);
    }

    /// @dev before withdrawals, we accrue interest
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override accrue returns (uint256 shares) {
        return super.withdraw(assets, receiver, owner);
    }

    /// @dev accrues interest by updating the conversion rate of FSRX to FEI
    function accrueInterest() internal {
        fsrxPrice = getConversionRate();
        lastUpdated = block.timestamp;
    }

    /// @dev gets the current conversion rate of FSRX to FEI
    function getConversionRate() public view returns (uint256) {
        // Note: this is noncompounding. Need to change to continouosly compounding.
        return fsrxPrice + (fsrxPrice * (block.timestamp - lastUpdated) * interestRate) / (10_000 * 365.25 days);
    }

    /// @dev returns the total assets that *should* exist in this vault right now
    /// To do this we multiply the total number of shares by the *current* conversion rate
    function totalAssets() public view override returns (uint256) {
        return totalSupply * getConversionRate();
    }
}
