// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../fei/Fei.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice contract to create a permanent governanceless FEI-DAI PSM
/// As long as Tribe DAO's governance is active, the funds in this contract
/// can still be accessed : the Tribe DAO can mint FEI at will and get the DAI
/// in this contract, and could revoke the MINTER role from this contract,
/// preventing it to create new FEI.
/// This contract acts as a FEI sink and can burn the FEI it holds.
/// Burning the MINTER_ROLE from the Tribe DAO will make this PSM act
/// like a permanent feeless FEI-DAI wrapper.
contract SimpleFeiDaiPSM {
    using SafeERC20 for Fei;
    using SafeERC20 for IERC20;

    IERC20 private constant DAI = IERC20(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    Fei private constant FEI = Fei(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);

    // ----------------------------------------------------------------------------
    // Peg Stability Module functionalities
    // ----------------------------------------------------------------------------

    /// @notice event emitted upon a redemption
    event Redeem(address indexed to, uint256 amountFeiIn, uint256 amountAssetOut);
    /// @notice event emitted when fei gets minted
    event Mint(address indexed to, uint256 amountIn, uint256 amountFeiOut);

    /// @notice mint `amountFeiOut` FEI to address `to` for `amountIn` underlying tokens
    /// @dev see getMintAmountOut() to pre-calculate amount out
    function mint(
        address to,
        uint256 amountIn,
        uint256 // minAmountOut
    ) external returns (uint256 amountFeiOut) {
        amountFeiOut = amountIn;
        DAI.safeTransferFrom(msg.sender, address(this), amountIn);
        FEI.mint(to, amountFeiOut);
        emit Mint(to, amountIn, amountFeiOut);
    }

    /// @notice redeem `amountFeiIn` FEI for `amountOut` underlying tokens and send to address `to`
    /// @dev see getRedeemAmountOut() to pre-calculate amount out
    /// @dev FEI received is not burned, see `burnFeiHeld()` below to batch-burn the FEI redeemed
    function redeem(
        address to,
        uint256 amountFeiIn,
        uint256 // minAmountOut
    ) external returns (uint256 amountOut) {
        amountOut = amountFeiIn;
        FEI.safeTransferFrom(msg.sender, address(this), amountFeiIn);
        DAI.safeTransfer(to, amountOut);
        emit Redeem(to, amountFeiIn, amountOut);
    }

    /// @notice calculate the amount of FEI out for a given `amountIn` of underlying
    function getMintAmountOut(uint256 amountIn) external pure returns (uint256) {
        return amountIn;
    }

    /// @notice calculate the amount of underlying out for a given `amountFeiIn` of FEI
    function getRedeemAmountOut(uint256 amountIn) external pure returns (uint256) {
        return amountIn;
    }

    // ----------------------------------------------------------------------------
    // Functions to make this contract compatible with the PCVDeposit interface
    // and accounted for in the Fei Protocol's Collateralization Oracle
    // ----------------------------------------------------------------------------

    address public constant balanceReportedIn = address(DAI);

    /// @notice gets the effective balance of "balanceReportedIn" token if the deposit were fully withdrawn
    function balance() external view returns (uint256) {
        return DAI.balanceOf(address(this));
    }

    /// @notice gets the resistant token balance and protocol owned fei of this deposit
    function resistantBalanceAndFei() external view returns (uint256, uint256) {
        return (DAI.balanceOf(address(this)), FEI.balanceOf(address(this)));
    }

    // ----------------------------------------------------------------------------
    // These view functions are meant to make this contract's interface
    // as similar as possible to the FixedPricePSM as possible.
    // ----------------------------------------------------------------------------

    uint256 public constant mintFeeBasisPoints = 0;
    uint256 public constant redeemFeeBasisPoints = 0;
    address public constant underlyingToken = address(DAI);
    uint256 public constant getMaxMintAmountOut = type(uint256).max;
    bool public constant paused = false;
    bool public constant redeemPaused = false;
    bool public constant mintPaused = false;

    // ----------------------------------------------------------------------------
    // This contract should act as a FEI sink if needed
    // ----------------------------------------------------------------------------

    /// @notice Burns all FEI on this contract.
    function burnFeiHeld() external {
        uint256 feiBalance = FEI.balanceOf(address(this));
        if (feiBalance != 0) {
            FEI.burn(feiBalance);
        }
    }
}
