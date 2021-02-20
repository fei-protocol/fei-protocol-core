pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../router/FeiRouter.sol";
import "./IOrchestrator.sol";

contract RouterOrchestrator is IRouterOrchestrator, Ownable {
    function init(
        address pair,
        address weth,
        address incentive
    ) public override onlyOwner returns (address ethRouter) {
        ethRouter = address(new FeiRouter(pair, weth, incentive));

        return ethRouter;
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
