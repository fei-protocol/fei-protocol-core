pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../core/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract Fii is ERC20, ERC20Burnable, CoreRef {

    mapping (address => address) public incentives;

	constructor(address core)
	   ERC20("Fii Stablecoin", "FII") 
        CoreRef(core)
    public {}

    function mint(address account, uint256 amount) public onlyMinter returns (bool) {
        _mint(account, amount);
        return true;
    }

    function burn(address account, uint256 amount) public onlyBurner returns (bool) {
        _burn(account, amount);
        return true;
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        checkAndApplyIncentives(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        checkAndApplyIncentives(sender, recipient, amount);
        if (allowance(sender, _msgSender()) != uint256(-1)) {
            _approve(
                sender,
                _msgSender(),
                allowance(sender, _msgSender()).sub(amount, "Fii: transfer amount exceeds allowance"));
        }
        return true;
    }

    function setIncentiveContract(address account, address incentive) public onlyGovernor {
        incentives[account] = incentive;
    }

    function getIncentiveContract(address account) public view returns (address) {
        return incentives[account];
    }

    function checkAndApplyIncentives(address sender, address receiver, uint256 amount) internal {
        // incentive on sender
        address senderIncentive = incentives[sender];
        if (senderIncentive != address(0)) {
            IIncentive(senderIncentive).incentivize(sender, receiver, msg.sender, amount);
        }
        // incentive on receiver
        address receiverIncentive = incentives[receiver];
        if (receiverIncentive != address(0)) {
            IIncentive(receiverIncentive).incentivize(sender, receiver, msg.sender, amount);
        }
        // incentive on spender
        address spenderIncentive = incentives[msg.sender];
        if (msg.sender != sender && msg.sender != receiver && spenderIncentive != address(0)) {
            IIncentive(spenderIncentive).incentivize(sender, receiver, msg.sender, amount);
        }
        // all incentive
        address allIncentive = incentives[address(0)];
        if (allIncentive != address(0)) {
            IIncentive(allIncentive).incentivize(sender, receiver, msg.sender, amount);
        }
    }
}