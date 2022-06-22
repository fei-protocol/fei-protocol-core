// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMasterContractManager {
    function setMasterContractApproval(
        address user,
        address masterContract,
        bool approved,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function withdraw(
        address token,
        address from,
        address to,
        uint256 amount,
        uint256 shares
    ) external;

    function balanceOf(address token, address owner) external view returns (uint256);
}
