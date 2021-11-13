// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IBAMM.sol";
import "../IPCVDeposit.sol";

/// @title a LUSD Swapper interface
/// @author Fei Protocol
interface ILUSDSwapper {
    // ----------- Events -----------

    event LusdDepositUpdate(address indexed newLusdDeposit, address indexed oldLusdDeposit);

    event EthDepositUpdate(address indexed newLusdDeposit, address indexed oldLusdDeposit);

    // ----------- Only Governor or Admin State changing api -----------
    function swapLUSD(uint256 lusdAmount, uint256 minEthReturn) external;

    function setLusdDeposit(address newLusdDeposit) external;

    function setEthDeposit(address newEthDeposit) external;

    // ----------- Getters -----------

    function ethDeposit() external view returns(address);

    function lusdDeposit() external view returns(IPCVDeposit);

    function bamm() external view returns(IBAMM);
}