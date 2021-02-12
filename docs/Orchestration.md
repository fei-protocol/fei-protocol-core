## Contract
[CoreOrchestrator.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/orchestration/CoreOrchestrator.sol)

## Description
Orchestrators used to deploy and link Fei Protocol

## Implementation
A series of orchestrators each deploy, parameterize, and link a subset of the contracts.
It deploys other contracts due to both size and dependency issues. It reads in the deployed contract addresses from child orchestrators so it can link them all together.

This is the primary orchestrator. It deploys Core (and by extension FEI and TRIBE) as well as the UniswapOracle. Because it deploys Core it is a Governor and is able to parameterize other contracts and provide role access. 

It should initialize the orchestrators in the following order:
1. initPairs() - creates the two main uniswap pairs ETH/FEI and TRIBE/FEI
2. initBondingCurve() - creates the [EthUniswapPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/EthUniswapPCVDeposit) (Minter), [EthBondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/EthBondingCurve) (Minter), and [BondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle). The EthUniswapPCVDeposit needs to use the BondingCurveOracle so it is linked here
3. initIncentive() - creates [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) (Minter/Burner) and adds it to FEI as an incentive contract
4. initController() - creates [EthUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/wiki/EthUniswapPCVController) (Minter/PCV Controller) and exempts it and the EthUniswapPCVDeposit from incentives on UniswapIncentive
5. initIDO() - creates [IDO](https://github.com/fei-protocol/fei-protocol-core/wiki/IDO) (Minter) and [TimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/wiki/TimelockedDelegator) and allocates them each some TRIBE
6. initGenesis() - creates the [GenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup) and [FeiPool](https://github.com/fei-protocol/fei-protocol-core/wiki/FeiPool) and allocates them each some TRIBE
7. initGovernance() - creates the [GovernorAlpha](https://github.com/fei-protocol/fei-protocol-core/wiki/GovernorAlpha) and [Timelock](https://github.com/fei-protocol/fei-protocol-core/wiki/Timelock) (Governor)
