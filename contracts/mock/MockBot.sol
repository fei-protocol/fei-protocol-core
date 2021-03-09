pragma solidity ^0.6.0;

import "../genesis/IGenesisGroup.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../pcv/IUniswapPCVController.sol";
import "../staking/IRewardsDistributor.sol";

contract MockBot {

	function genesisLaunch(address genesis) public {
		IGenesisGroup(genesis).launch();
	}

    function bondingCurveAllocate(address bondingCurve) public {
		IBondingCurve(bondingCurve).allocate();
	}

    function controllerReweight(address controller) public {
        IUniswapPCVController(controller).reweight();
    }

    function distributorDrip(address distributor) public {
        IRewardsDistributor(distributor).drip();
    }
}

