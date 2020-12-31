pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

/// @title IFei implementation
/// @author Fei Protocol
contract Fei is ERC20, ERC20Burnable, CoreRef {

    mapping (address => address) public incentiveContract;

    event Minting(address indexed to, address indexed minter, uint256 amount);
    event Burning(address indexed to, address indexed burner, uint256 amount);
    event IncentiveContractUpdate(address indexed _incentivized, address indexed _incentiveContract);

	constructor(address core) public
	   ERC20("Fei USD", "FEI") 
       CoreRef(core) {}

    function mint(address account, uint256 amount) public onlyMinter {
        _mint(account, amount);
        emit Minting(account, msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyBurner {
        _burn(account, amount);
        emit Burning(account, msg.sender, amount);
    }

    function setIncentiveContract(address account, address incentive) public onlyGovernor {
        incentiveContract[account] = incentive;
        emit IncentiveContractUpdate(account, incentive);
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            _checkAndApplyIncentives(from, to, amount);      
        }
    }

    function _checkAndApplyIncentives(address sender, address recipient, uint256 amount) internal {
        // incentive on sender
        address senderIncentive = incentiveContract[sender];
        if (senderIncentive != address(0)) {
            IIncentive(senderIncentive).incentivize(sender, recipient, msg.sender, amount);
        }
        // incentive on recipient
        address recipientIncentive = incentiveContract[recipient];
        if (recipientIncentive != address(0)) {
            IIncentive(recipientIncentive).incentivize(sender, recipient, msg.sender, amount);
        }
        // incentive on operator
        address operatorIncentive = incentiveContract[msg.sender];
        if (msg.sender != sender && msg.sender != recipient && operatorIncentive != address(0)) {
            IIncentive(operatorIncentive).incentivize(sender, recipient, msg.sender, amount);
        }
        // all incentive
        address allIncentive = incentiveContract[address(0)];
        if (allIncentive != address(0)) {
            IIncentive(allIncentive).incentivize(sender, recipient, msg.sender, amount);
        }
    }
}