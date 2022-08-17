// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Decimal} from "../../external/Decimal.sol";

/// @title Uniswap FEI TRIBE liquidity timelock interface
/// @author Fei Protocol
interface FeiTribeLiquidityTimelockInterface {
    // ----------- Events -----------

    event Deploy(uint256 _amountFei, uint256 _amountTribe);

    // ----------- Read only API -------------
    /// @notice Beneficiary of the linear timelock funds
    function beneficiary() external returns (address);

    /// @notice Get the pending beneficiary
    function pendingBeneficiary(address) external;

    /// @notice Get the amount of tokens unlocked and available for release
    function availableForRelease() external;

    // ----------- Beneficiary state changing API  -------------
    /// @notice Set the pending timelock beneficiary for it to later be accepted
    function setPendingBeneficiary(address) external;

    /// @notice Accept the beneficiary, called by the beneficiary in setPendingBeneficiary
    function acceptBeneficiary() external;

    /// @notice Release the maximum amount of unlocked tokens to an address
    function releaseMax(address) external;

    /// @notice Release a specific amount of unlocked tokens to an address
    function release(address, uint256) external;

    // ----------- Genesis Group only state changing API -----------

    /// @notice Add FEI/TRIBE liquidity to Uniswap at Genesis
    function deploy(Decimal.D256 calldata feiRatio) external;

    /// @notice Swap Genesis group FEI on Uniswap for TRIBE
    function swapFei(uint256 amountFei) external returns (uint256);

    // ----------- Governor only state changing API -----------

    /// @notice Unlock all liquidity vesting in the timelock to the beneficiary
    function unlockLiquidity() external;
}
