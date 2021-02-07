pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "./IOrchestrator.sol";

contract IDOOrchestrator is IIDOOrchestrator, Ownable {
    function init(
        address core,
        address admin,
        address tribe,
        address pair,
        address router,
        uint256 releaseWindowDuration
    )
        public
        override
        onlyOwner
        returns (address ido, address timelockedDelegator)
    {
        ido = address(
            new IDO(core, admin, releaseWindowDuration, pair, router)
        );
        timelockedDelegator = address(
            new TimelockedDelegator(tribe, admin, releaseWindowDuration)
        );
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
