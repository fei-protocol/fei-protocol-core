pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract Fei is ERC20, ERC20Burnable, CoreRef {

    mapping (address => address) public incentives;

    event Minting(address indexed to, address indexed minter, uint256 amount);
    event Burning(address indexed to, address indexed burner, uint256 amount);
    // TODO would other info be useful here? Like incentive amount and mint/burn?
    event Incentive(
        address indexed on, 
        address indexed incentiveContract,
        address sender,
        address recipient,
        uint256 transferAmount
    );

	constructor(address core) public
	   ERC20("Fei Stablecoin", "FEI") 
       CoreRef(core) {}

    function mint(address account, uint256 amount) public onlyMinter {
        _mint(account, amount);
        emit Minting(account, msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyBurner {
        _burn(account, amount);
        emit Burning(account, msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            checkAndApplyIncentives(from, to, amount);      
        }
    }

    function setIncentiveContract(address account, address incentive) public onlyGovernor {
        incentives[account] = incentive;
    }

    function getIncentiveContract(address account) public view returns (address) {
        return incentives[account];
    }

    function checkAndApplyIncentives(address sender, address recipient, uint256 amount) internal {
        // incentive on sender
        address senderIncentive = incentives[sender];
        if (senderIncentive != address(0)) {
            IIncentive(senderIncentive).incentivize(sender, recipient, msg.sender, amount);
            emit Incentive(sender, senderIncentive, sender, recipient, amount);
        }
        // incentive on recipient
        address recipientIncentive = incentives[recipient];
        if (recipientIncentive != address(0)) {
            IIncentive(recipientIncentive).incentivize(sender, recipient, msg.sender, amount);
            emit Incentive(recipient, recipientIncentive, sender, recipient, amount);
        }
        // incentive on operator
        address operatorIncentive = incentives[msg.sender];
        if (msg.sender != sender && msg.sender != recipient && operatorIncentive != address(0)) {
            IIncentive(operatorIncentive).incentivize(sender, recipient, msg.sender, amount);
            emit Incentive(msg.sender, operatorIncentive, sender, recipient, amount);
        }
        // all incentive
        address allIncentive = incentives[address(0)];
        if (allIncentive != address(0)) {
            IIncentive(allIncentive).incentivize(sender, recipient, msg.sender, amount);
            emit Incentive(address(0), allIncentive, sender, recipient, amount);
        }
    }
}