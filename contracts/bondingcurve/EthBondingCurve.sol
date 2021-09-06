// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./BondingCurve.sol";

/// @title a bonding curve for purchasing FEI with ETH
/// @author Fei Protocol
contract EthBondingCurve is BondingCurve {

    /// @dev used as the reporting token address for balances
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    struct BondingCurveParams {
        uint256 scale;
        uint256 buffer;
        uint256 discount;
        uint256 duration;
        uint256 incentive;
        address[] pcvDeposits;
        uint256[] ratios;
    }

    constructor(
        address core,
        address oracle,
        address backupOracle,
        BondingCurveParams memory params
    )
        BondingCurve(
            core,
            oracle,
            backupOracle,
            params.scale,
            params.pcvDeposits,
            params.ratios,
            params.duration,
            params.incentive,
            IERC20(WETH),
            params.discount,
            params.buffer
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

    /// @notice get the balance of ETH held by the contract and ready to be allocated
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
