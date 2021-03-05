pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../genesis/GenesisGroup.sol";
import "./IOrchestrator.sol";

contract GenesisOrchestrator is IGenesisOrchestrator, Ownable {
    function init(
        address core,
        address ethBondingCurve,
        address ido,
        address oracle,
        uint256 genesisDuration,
        uint256 exhangeRateDiscount
    ) public override onlyOwner returns (address genesisGroup) {
        genesisGroup = address(
            new GenesisGroup(
                core,
                ethBondingCurve,
                ido,
                oracle,
                genesisDuration,
                exhangeRateDiscount
            )
        );
        return (genesisGroup);
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
