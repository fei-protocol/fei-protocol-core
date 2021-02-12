# Fei Protocol wiki

This wiki serves as the living documentation for the production implementation. As changes are committed and applied on chain we aim to update this wiki quickly to the current state of affairs. It is possible that certain parts of the wiki are out of date.

## Whitepaper

[Whitepaper](https://fei.money/static/media/whitepaper.7d5e2986.pdf)

* [Whitepaper Vs Implementation Diff](https://github.com/fei-protocol/fei-protocol-core/wiki/Implementation-vs-Whitepaper-Diff)

## Audit Info

[General Audit Info](https://github.com/fei-protocol/fei-protocol-core/wiki/Audit-Info)

[ConsenSys Specific Audit Info](https://github.com/fei-protocol/fei-protocol-core/wiki/ConsenSys-Audit-Info)

[Test Coverage report](https://github.com/fei-protocol/fei-protocol-core/wiki/Test-Coverage-Report) - 99.16% line coverage

[Test Suite output](https://github.com/fei-protocol/fei-protocol-core/wiki/Test-Suite-Output)

## Core

Contracts relating to access control and governance treasury

* [Core](https://github.com/fei-protocol/fei-protocol-core/wiki/Core)
* [ICore](https://github.com/fei-protocol/fei-protocol-core/wiki/ICore)
* [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions)
* [IPermissions](https://github.com/fei-protocol/fei-protocol-core/wiki/IPermissions)

## Refs

Reference contracts for pointing to and reading from Core, Oracles, and Uniswap

* [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef)
* [ICoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/ICoreRef)
* [OracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/OracleRef)
* [IOracleRef](https://github.com/fei-protocol/fei-protocol-core/wiki/IOracleRef)
* [UniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/UniRef)
* [IUniRef](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniRef)

## Token

Token contracts including token timelocks and incentives

* [IFei](https://github.com/fei-protocol/fei-protocol-core/wiki/IFei)
* [Fei](https://github.com/fei-protocol/fei-protocol-core/wiki/Fei)
* [IIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/IIncentive)
* [IUniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapIncentive)
* [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive)

## PCV

PCV controller and deposit contracts

* [IPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/IPCVDeposit)
* [UniswapPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapPCVDeposit)
* [EthUniswapPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/EthUniswapPCVDeposit)
* [IUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapPCVController)
* [EthUniswapPCVController](https://github.com/fei-protocol/fei-protocol-core/wiki/EthUniswapPCVController)
* [PCVSplitter](https://github.com/fei-protocol/fei-protocol-core/wiki/PCVSplitter)

## Oracle

Uniswap and bonding curve oracles

* [IOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/IOracle)
* [UniswapOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapOracle)
* [IUniswapOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapOracle)
* [BondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle)
* [IBondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/IBondingCurveOracle)

## Genesis

GenesisGroup and IDO contracts

* [GenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup)
* [IGenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/IGenesisGroup)
* [IDO](https://github.com/fei-protocol/fei-protocol-core/wiki/IDO)
* [IDOInterface](https://github.com/fei-protocol/fei-protocol-core/wiki/IDOInterface)

## DAO

TRIBE, Governance, and Delegator contracts

* [GovernorAlpha](https://github.com/fei-protocol/fei-protocol-core/wiki/GovernorAlpha)
* [Timelock](https://github.com/fei-protocol/fei-protocol-core/wiki/Timelock)
* [ITimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/wiki/ITimelockedDelegator)
* [TimelockedDelegator](https://github.com/fei-protocol/fei-protocol-core/wiki/TimelockedDelegator)
* [Tribe](https://github.com/fei-protocol/fei-protocol-core/wiki/Tribe)

## BondingCurve

Bonding curve contracts

* [IBondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/IBondingCurve)
* [BondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurve)
* [EthBondingCurve](https://github.com/fei-protocol/fei-protocol-core/wiki/EthBondingCurve)

## Pool

Staking pool contracts for earning tokens

* [IPool](https://github.com/fei-protocol/fei-protocol-core/wiki/IPool)
* [Pool](https://github.com/fei-protocol/fei-protocol-core/wiki/Pool)
* [FeiPool](https://github.com/fei-protocol/fei-protocol-core/wiki/FeiPool)

## Utils

* [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)
* [LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/wiki/LinearTokenTimelock)

## Orchestration

The orchestrator contracts are used in deployment to make sure everything is linked and has the right permissions and balances.

* [Orchestration](https://github.com/fei-protocol/fei-protocol-core/wiki/Orchestration)

## Router \*out of scope for OZ audit

The Router is a fork of the Uniswap Router which also adds a utility for bounding rewards and penalties

* [IUniswapSingleEthRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/IUniswapSingleEthRouter)
* [UniswapSingleEthRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapSingleEthRouter)
* [IFeiRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/IFeiRouter)
* [FeiRouter](https://github.com/fei-protocol/fei-protocol-core/wiki/FeiRouter)

