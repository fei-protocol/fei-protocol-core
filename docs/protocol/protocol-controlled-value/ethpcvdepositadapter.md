---
description: >-
  An adapter contract that allows ETH transfers to conform to the IPCVDeposit
  interface
---

# EthPCVDepositAdapter

## Contract

[EthPCVDepositAdapter](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pcv/EthPCVDepositAdapter.sol)

## Description

Allows contracts which can receive ETH but do not conform to the IPCVDeposit interface to still receive those ETH deposits in a PCV compatible way. Likewise allows native ETH transfers to conform to the IPCVDeposit interface of a contract that does conform to that interface.

e.g. sending ETH to the [EthPCVDripper](ethpcvdripper.md) from the [EthBondingCurve](../bondingcurve/ethbondingcurve.md)

## [Access Control](../access-control/) 

None

## Events

None

## Read-Only Functions

### target

```javascript
function target() external view returns (address);
```

Returns the target address to transfer ETH to

## Public State-Changing Functions

### deposit

```javascript
function deposit(uint256 amount) public payable;
```

sends `amount` ETH to `target`

## ABIs

{% file src="../../.gitbook/assets/ethpcvdepositadapter.json" caption="EthPCVDepositAdapter" %}



