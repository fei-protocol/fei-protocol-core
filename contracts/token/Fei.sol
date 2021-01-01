pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IIncentive.sol";
import "./IFei.sol";
import "../refs/CoreRef.sol";

/// @title IFei implementation
/// @author Fei Protocol
contract Fei is IFei, ERC20, ERC20Burnable, CoreRef {

    mapping (address => address) public override incentiveContract;

    /// @notice Fei token constructor
    /// @param core Fei Core address to reference
	constructor(address core) public ERC20("Fei USD", "FEI") CoreRef(core) {}

    function setIncentiveContract(address account, address incentive) external override onlyGovernor {
        incentiveContract[account] = incentive;
        emit IncentiveContractUpdate(account, incentive);
    }

    function mint(address account, uint amount) external override onlyMinter {
        _mint(account, amount);
        emit Minting(account, msg.sender, amount);
    }

    function burn(uint amount) public override(IFei, ERC20Burnable) {
        super.burn(amount);
        emit Burning(msg.sender, msg.sender, amount);
    }

    function burnFrom(address account, uint amount) public override(IFei, ERC20Burnable) onlyBurner {
        _burn(account, amount);
        emit Burning(account, msg.sender, amount);
    }

    function _beforeTokenTransfer(address from, address to, uint amount) internal override {
        // If not minting or burning
        if (from != address(0) && to != address(0)) {
            _checkAndApplyIncentives(from, to, amount);      
        }
    }

    function _checkAndApplyIncentives(address sender, address recipient, uint amount) internal {
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