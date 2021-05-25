// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./BondingCurve.sol";

/// @title a bonding curve for purchasing FEI with ETH
/// @author Fei Protocol
contract EthBondingCurve is BondingCurve {

    constructor(
        uint256 scale,
        address core,
        address[] memory pcvDeposits,
        uint256[] memory ratios,
        address oracle,
        uint256 duration,
        uint256 incentive
    )
        public
        BondingCurve(
            scale,
            core,
            pcvDeposits,
            ratios,
            oracle,
            duration,
            incentive
        )
    {}

    /// @notice purchase FEI for underlying tokens
    /// @param to address to receive FEI
    /// @param amountIn amount of underlying tokens input
    /// @return amountOut amount of FEI received
    function purchase(address to, uint256 amountIn)
        external
        payable
        override
        whenNotPaused
        returns (uint256 amountOut)
    {
        require(
            msg.value == amountIn,
            "Bonding Curve: Sent value does not equal input"
        );
        return _purchase(amountIn, to);
    }

    function balance() public view override returns (uint256) {
        return address(this).balance;
    }

    function _allocateSingle(uint256 amount, address pcvDeposit)
        internal
        override
    {
        Address.sendValue(payable(pcvDeposit), amount);
        IPCVDeposit(pcvDeposit).deposit();
    }
}
