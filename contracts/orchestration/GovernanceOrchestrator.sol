pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../dao/Timelock.sol";
import "../dao/GovernorAlpha.sol";
import "./IOrchestrator.sol";

contract GovernanceOrchestrator is IGovernanceOrchestrator, Ownable {
    function init(
        address tribe,
        address admin,
        uint256 timelockDelay
    )
        public
        override
        onlyOwner
        returns (address governorAlpha, address timelock)
    {
        Timelock _timelock = new Timelock(address(this), 0); // set to 0 so we can initialize governorAlpha atomically
        timelock = address(_timelock);
        GovernorAlpha _governorAlpha = new GovernorAlpha(timelock, tribe, address(this));
        governorAlpha = address(_governorAlpha);
        
        // solhint-disable-next-line not-rely-on-time
        uint timestamp = block.timestamp;

        _timelock.queueTransaction(timelock, 0, "setDelay(uint256)", abi.encode(timelockDelay), timestamp);
        _timelock.queueTransaction(timelock, 0, "setPendingAdmin(address)", abi.encode(governorAlpha), timestamp);

        _timelock.executeTransaction(timelock, 0, "setDelay(uint256)", abi.encode(timelockDelay), timestamp);
        _timelock.executeTransaction(timelock, 0, "setPendingAdmin(address)", abi.encode(governorAlpha), timestamp);

        _governorAlpha.__acceptAdmin();
        _governorAlpha.__transferGuardian(admin);

        assert(_timelock.admin() == governorAlpha);
        assert(_timelock.delay() == timelockDelay);

        return (address(_governorAlpha), timelock);
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
