pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../pcv/IPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockERC20UniswapPCVDeposit is IPCVDeposit {

	IERC20 public token;
    uint256 total;

	constructor(IERC20 _token) public {
		token = _token;
	}

    function deposit(uint256 amount) external override payable {
        total += amount;

    }

    function withdraw(address to, uint256 amount) external override {
        total -= amount;
        token.transfer(to, amount);
    }

    function totalValue() external view override returns(uint256) {
    	return total;
    }
}