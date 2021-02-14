---
description: The access control module of Fei Protocol Core
---

# Permissions

## Contract

[Permissions.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Permissions.sol) implements [IPermissions](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/IPermissions.sol), [AccessControl](https://docs.openzeppelin.com/contracts/3.x/api/access#AccessControl)

## Description

The [access control](./) module of the [Core](core.md) contract. Maintains which roles exist, role admins, and which addresses have which roles.

The contract essentially wraps the OpenZeppelin Access Control contract with some Fei Protocol-specific roles and functionality.

{% embed url="https://docs.openzeppelin.com/contracts/3.x/api/access\#AccessControl" %}

Granting and revoking roles is gated for only Governor ⚖️ access. The Guardian🛡role can also revoke roles.

## Read-Only Functions

### isBurner

```javascript
function isBurner(address _address) external view returns (bool);
```

returns true if `_address` has the Burner🔥role

### isMinter

```javascript
function isMinter(address _address) external view returns (bool);
```

returns true if `_address` has the Minter💰role

### isGovernor

```javascript
function isGovernor(address _address) external view returns (bool);
```

returns true if `_address` has the Governor⚖️role

### isGuardian

```javascript
function isGuardian(address _address) external view returns (bool);
```

returns true if `_address` has the Guardian🛡role

### isPCVController

```javascript
function isPCVController(address _address) external view returns (bool);
```

returns true if `_address` has the PCV Controller⚙️role

## State-Changing Functions <a id="state-changing-functions"></a>

### Governor-Only⚖️

#### createRole

```javascript
function createRole(bytes32 role, bytes32 adminRole) external;
```

assigns role `role` a new admin role `adminRole`

This can be used either to create a new access control role or reassign an admin for an existing role.

#### grantMinter

```javascript
function grantMinter(address minter) external;
```

assigns Minter💰role to `minter`

#### grantBurner

```javascript
function grantBurner(address burner) external;
```

assigns Burner🔥role to `burner`

#### grantPCVController

```javascript
function grantPCVController(address pcvController) external;
```

assigns PCV Controller⚙️ role to `pcvController`

#### grantGovernor

```javascript
function grantGovernor(address governor) external;
```

assigns Governor⚖️role to `governor`

#### grantGuardian

```javascript
function grantGuardian(address guardian) external;
```

assigns Guardian🛡role to `guardian`

#### revokeMinter

```javascript
function revokeMinter(address minter) external;
```

revokes Minter💰role from `minter`

#### revokeBurner

```javascript
function revokeBurner(address burner) external;
```

revokes Burner🔥role from `burner`

#### revokePCVController

```javascript
function revokePCVController(address pcvController) external;
```

revokes PCV Controller⚙️ role from `pcvController`

#### revokeGovernor

```javascript
function revokeGovernor(address governor) external;
```

revokes Governor⚖️role from `governor`

#### revokeGuardian

```javascript
function revokeGuardian(address guardian) external;
```

revokes Guardian🛡role from `guardian`

### Guardian-Only🛡

```javascript
function revokeOverride(bytes32 role, address account) external;
```

revokes `role` from `account`

fails if role is equal to Governor⚖️

