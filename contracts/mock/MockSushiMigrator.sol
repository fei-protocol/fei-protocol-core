pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMigratorChef {
    // Take the current LP token address and return the new LP token address.
    // Migrator should have full access to the caller's LP token.
    function migrate(IERC20 token) external returns (IERC20);
    function depositedFunds(address token, address user) external view returns (uint256);
}

contract MockSushiMigrator is IMigratorChef {
    using SafeERC20 for IERC20;

    mapping(address => mapping(address => uint256)) public override depositedFunds;

    function migrate(IERC20 token) external override returns (IERC20) {
        uint256 amount = token.balanceOf(msg.sender);
        token.safeTransferFrom(msg.sender, address(this), amount);
        depositedFunds[address(token)][msg.sender] += amount;
        return token;
    }

    function withdrawMigratedFunds(IERC20 token, address receiver, uint256 amount) public {
        require(depositedFunds[address(token)][msg.sender] >= amount, "I_O");
        depositedFunds[address(token)][msg.sender] -= amount;
        token.safeTransfer(receiver, amount);
    }
}
