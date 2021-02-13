---
description: The access control module of Fei Protocol Core
---

# Permissions

## Contract

[Permissions.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Permissions.sol) implements IPermissions, [AccessControl](https://docs.openzeppelin.com/contracts/3.x/api/access#AccessControl)

## Description

The [access control](./) module of the [Core](core.md) contract. Maintains which roles exist, role admins, and which addresses have which roles.

The contract essentially wraps the OpenZeppelin Access Control contract with some Fei Protocol-specific roles and functionality.

{% embed url="https://docs.openzeppelin.com/contracts/3.x/api/access\#AccessControl" %}

Granting and revoking roles is gated for only Governor ⚖️ access. The Guardian🛡role can also revoke roles.

## Read-Only Functions

```javascript
function isBurner(address _address) external view returns (bool);

function isMinter(address _address) external view returns (bool);

function isGovernor(address _address) external view returns (bool);

function isRevoker(address _address) external view returns (bool);

function isPCVController(address _address) external view returns (bool);
```

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only⚖️

```javascript
function createRole(bytes32 role, bytes32 adminRole) external;

function grantMinter(address minter) external;

function grantBurner(address burner) external;

function grantPCVController(address pcvController) external;

function grantGovernor(address governor) external;

function grantRevoker(address revoker) external;

function revokeMinter(address minter) external;

function revokeBurner(address burner) external;

function revokePCVController(address pcvController) external;

function revokeGovernor(address governor) external;

function revokeRevoker(address revoker) external;
```

### Guardian-Only🛡

```javascript
function revokeOverride(bytes32 role, address account) external;
```

