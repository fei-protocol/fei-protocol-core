# EthUniswapPCVController

## Contract

[EthUniswapPCVController.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthUniswapPCVController.sol) implements [IUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapPCVController), [UniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/UniRef)

## Description

A contract for moving reweighting Uniswap prices to the peg from a Uniswap PCV Deposit. ETH specific implementation.

## [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)

* Minter
* PCV Controller

## Implementation

### Reweight

Reweights have the goal of returning the Uniswap spot price of an associated PCV Deposit to the peg. The algorithm is as follows:

* withdraw all existing PCV from the PCV Deposit
* check if remaining LP exists, if so execute a trade with held assets to bring the spot price back up to peg
* deposit remaining held balance back into the Uniswap PCV Deposit
* burn excess held FEI

### Reweight eligibility

The reweight is open to the public when both of the following conditions are met:

* the distance from the peg is at least the minimum \(initially 1%\)
* the [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract is at incentive parity

Governor contracts can also force a reweight at any time. Governor can also update the minimum distance.

### Reweight incentives

Open reweight executions are incentivized with 500 FEI if the controller is appointed as a minter. Governance can adjust this incentive amount

