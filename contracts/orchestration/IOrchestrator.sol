pragma solidity ^0.6.6;

interface IOrchestrator {
    function detonate() external;
}

interface IPCVDepositOrchestrator is IOrchestrator {
	function init(
		address core, 
		address pair, 
		address router,
		address oraclePair,
		uint twapDuration,
		bool isPrice0
	) external returns(
		address ethUniswapPCVDeposit,
		address uniswapOracle
	);
}

interface IBondingCurveOrchestrator is IOrchestrator  {
	function init(
		address core, 
		address uniswapOracle, 
		address ethUniswapPCVDeposit, 
		uint scale,
		uint thawingDuration,
		uint bondingCurveIncentiveDuration,
		uint bondingCurveIncentiveAmount
	) external returns(
		address ethBondingCurve,
		address bondingCurveOracle
	);
}

interface IIncentiveOrchestrator is IOrchestrator {
	function init(
		address core, 
		address bondingCurveOracle, 
		address fei, 
		address router,
		uint32 growthRate
	) external returns(address uniswapIncentive);
}

interface IRouterOrchestrator is IOrchestrator {
	function init(
		address pair, 
		address weth,
		address incentive
	) external returns(address ethRouter);
}

interface IControllerOrchestrator is IOrchestrator {
	function init(
		address core, 
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit, 
		address fei, 
		address router,
		uint reweightIncentive,
		uint reweightMinDistanceBPs
	) external returns(address ethUniswapPCVController);
}

interface IIDOOrchestrator is IOrchestrator {
	function init(
		address core, 
		address admin, 
		address tribe, 
		address pair, 
		address router,
		uint releaseWindowDuration
	) external returns (
		address ido,
		address timelockedDelegator
	);
}

interface IGenesisOrchestrator is IOrchestrator  {
	function init(
		address core, 
		address ethBondingCurve, 
		address ido,
		address tribeFeiPair,
		address oracle,
		uint genesisDuration,
		uint exhangeRateDiscount,
		uint poolDuration
	) external returns (address genesisGroup, address pool);
}

interface IGovernanceOrchestrator is IOrchestrator {
	function init(address admin, address tribe, uint timelockDelay) external returns (
		address governorAlpha, 
		address timelock
	);
}