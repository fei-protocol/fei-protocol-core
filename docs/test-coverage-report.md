# Test-Coverage-Report

Notes:

* the uncovered line in Pool.sol is a divide by 0 check
* the uncovered lines in Fei.sol are the test for `permit()` this code was copied from the Uniswap UNI token and we are working out a way to test it using our current test setup.

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
| :--- | :--- | :--- | :--- | :--- | :--- |
| bondingcurve/ | 100 | 100 | 100 | 100 |  |
| BondingCurve.sol | 100 | 100 | 100 | 100 |  |
| EthBondingCurve.sol | 100 | 100 | 100 | 100 |  |
| IBondingCurve.sol | 100 | 100 | 100 | 100 |  |
| core/ | 100 | 100 | 100 | 100 |  |
| Core.sol | 100 | 100 | 100 | 100 |  |
| ICore.sol | 100 | 100 | 100 | 100 |  |
| IPermissions.sol | 100 | 100 | 100 | 100 |  |
| Permissions.sol | 100 | 100 | 100 | 100 |  |
| dao/ | 100 | 100 | 100 | 100 |  |
| ITimelockedDelegator.sol | 100 | 100 | 100 | 100 |  |
| TimelockedDelegator.sol | 100 | 100 | 100 | 100 |  |
| genesis/ | 100 | 100 | 100 | 100 |  |
| GenesisGroup.sol | 100 | 100 | 100 | 100 |  |
| IDO.sol | 100 | 100 | 100 | 100 |  |
| IDOInterface.sol | 100 | 100 | 100 | 100 |  |
| IGenesisGroup.sol | 100 | 100 | 100 | 100 |  |
| oracle/ | 100 | 100 | 100 | 100 |  |
| BondingCurveOracle.sol | 100 | 100 | 100 | 100 |  |
| IBondingCurveOracle.sol | 100 | 100 | 100 | 100 |  |
| IOracle.sol | 100 | 100 | 100 | 100 |  |
| IUniswapOracle.sol | 100 | 100 | 100 | 100 |  |
| UniswapOracle.sol | 100 | 100 | 100 | 100 |  |
| pcv/ | 100 | 100 | 100 | 100 |  |
| EthUniswapPCVController.sol | 100 | 100 | 100 | 100 |  |
| EthUniswapPCVDeposit.sol | 100 | 100 | 100 | 100 |  |
| IPCVDeposit.sol | 100 | 100 | 100 | 100 |  |
| IUniswapPCVController.sol | 100 | 100 | 100 | 100 |  |
| PCVSplitter.sol | 100 | 100 | 100 | 100 |  |
| UniswapPCVDeposit.sol | 100 | 100 | 100 | 100 |  |
| pool/ | 98.63 | 90 | 100 | 98.63 |  |
| FeiPool.sol | 100 | 100 | 100 | 100 |  |
| IPool.sol | 100 | 100 | 100 | 100 |  |
| Pool.sol | 98.51 | 90 | 100 | 98.51 | 70 |
| refs/ | 100 | 100 | 100 | 100 |  |
| CoreRef.sol | 100 | 100 | 100 | 100 |  |
| ICoreRef.sol | 100 | 100 | 100 | 100 |  |
| IOracleRef.sol | 100 | 100 | 100 | 100 |  |
| IUniRef.sol | 100 | 100 | 100 | 100 |  |
| OracleRef.sol | 100 | 100 | 100 | 100 |  |
| UniRef.sol | 100 | 100 | 100 | 100 |  |
| router/ | 100 | 100 | 100 | 100 |  |
| FeiRouter.sol | 100 | 100 | 100 | 100 |  |
| IFeiRouter.sol | 100 | 100 | 100 | 100 |  |
| IUniswapSingleEthRouter.sol | 100 | 100 | 100 | 100 |  |
| UniswapSingleEthRouter.sol | 100 | 100 | 100 | 100 |  |
| token/ | 95.8 | 92.31 | 96.43 | 95.83 |  |
| Fei.sol | 82.76 | 71.43 | 87.5 | 83.33 | ... 101,102,103 |
| IFei.sol | 100 | 100 | 100 | 100 |  |
| IIncentive.sol | 100 | 100 | 100 | 100 |  |
| IUniswapIncentive.sol | 100 | 100 | 100 | 100 |  |
| UniswapIncentive.sol | 100 | 100 | 100 | 100 |  |
| utils/ | 100 | 100 | 100 | 100 |  |
| LinearTokenTimelock.sol | 100 | 100 | 100 | 100 |  |
| Roots.sol | 100 | 100 | 100 | 100 |  |
| Timed.sol | 100 | 100 | 100 | 100 |  |
| ------------------------------ | ---------- | ---------- | ---------- | ---------- | ---------------- |
| All files | 99.15 | 97.22 | 99.57 | 99.16 |  |

