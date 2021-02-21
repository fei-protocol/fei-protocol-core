pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pcv/EthUniswapPCVController.sol";
import "./IOrchestrator.sol";

contract ControllerOrchestrator is IControllerOrchestrator, Ownable {
    function init(
        address core,
        address bondingCurveOracle,
        address ethUniswapPCVDeposit,
        address pair,
        address router,
        uint256 reweightIncentive,
        uint256 reweightMinDistanceBPs
    ) public override onlyOwner returns (address) {
        return
            address(
                new EthUniswapPCVController(
                    core,
                    ethUniswapPCVDeposit,
                    bondingCurveOracle,
                    reweightIncentive,
                    reweightMinDistanceBPs,
                    pair,
                    router
                )
            );
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
