// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ITribe is IERC20 {
    function mint(address to, uint256 amount) external;
    function setMinter(address newMinter) external;
}

/// @title TribeMinter interface
/// @author Fei Protocol
interface ITribeMinter {
    // ----------- Events -----------
    event AnnualMaxInflationUpdate(uint256 oldAnnualMaxInflationBasisPoints, uint256 newAnnualMaxInflationBasisPoints);
    event TribeTreasuryUpdate(address indexed oldTribeTreasury, address indexed newTribeTreasury);
    event TribeRewardsDripperUpdate(address indexed oldTribeRewardsDripper, address indexed newTribeRewardsDripper);

    // ----------- Public state changing api -----------

    function poke() external;

    // ----------- Owner only state changing api -----------

    function setMinter(address newMinter) external;

    // ----------- Governor or Admin only state changing api -----------

    function mint(address to, uint256 amount) external;

    function setTribeTreasury(address newTribeTreasury) external;

    function setTribeRewardsDripper(address newTribeRewardsDripper) external;

    function setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints) external;

    // ----------- Getters -----------

    function annualMaxInflationBasisPoints() external view returns (uint256);
    
    function idealBufferCap() external view returns (uint256);

    function tribeCirculatingSupply() external view returns (uint256);

    function totalSupply() external view returns (uint256);

    function isPokeNeeded() external view returns (bool);

    function tribeTreasury() external view returns (address);

    function tribeRewardsDripper() external view returns (address);
}
