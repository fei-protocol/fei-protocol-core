pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "../core/CoreRef.sol";
import "./IIncentive.sol";

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

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        checkAndApplyIncentives(_msgSender(), recipient, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) override public returns (bool) {
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

    function addIncentiveContract(address account, address incentive) public onlyGovernor {
        incentives[account] = incentive;
    }

    function getIncentiveContract(address account) public view returns (address) {
        return incentives[account];
    }

    function getIncentiveAmount(bool isSender, address account, uint256 amountIn) public view returns (uint256, bool) {
        address incentive = incentives[account];
        if (incentive == address(0)) {
            return (0, true);
        }
        return IIncentive(incentive).getIncentiveAmount(isSender, account, amountIn);
    }

    function applyIncentive(address account, uint256 incentive, bool isMint) internal {
        if (incentive == 0) {
            return;
        }
        if (isMint) {
            _mint(account, incentive);
        } else {
            _burn(account, incentive);
        }
    }

    function checkAndApplyIncentives(address sender, address recipient, uint256 amount) internal {
        (uint256 incentive1, bool isMint1) = getIncentiveAmount(true, sender, amount);
        applyIncentive(recipient, incentive1, isMint1); // incentive on sender applied to recipient
        (uint256 incentive2, bool isMint2) = getIncentiveAmount(false, recipient, amount);
        applyIncentive(sender, incentive2, isMint2); // incentive on recipient applied to sender
    }
}