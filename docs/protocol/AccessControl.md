# Access control
Fei Protocol has a role based access control, where each role grants a specific permission over a specific part of the protocol. The roles are assigned to three categories: `Major`, `Admin` and `Minor`. They are documented in [TribeRoles](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/core/TribeRoles.sol).

`Major` roles are the most powerful across the protocol, `Admin` have management capability over critical functionality and `Minor` are operational roles.

## Major roles
There are 4 major roles: 
- `GOVERNOR`: Ultimate control over the Fei ecosystem. Able to create new roles and access all protocol functionality
- `GUARDIAN`: Emergency safety role that is used to protect the protocol. Able to pause contracts and veto malicious proposals
- `PCV_CONTROLLER`: Allows the movement of PCV of any size from any contract to any address
- `MINTER`: Can mint Fei

## How they work
Role creation is limited to the `GOVERNOR` role. Created roles are stored in the storage of `Core.sol`, and each created role is assigned an `admin` over that role.

The `admin` of a role is then able to grant and revoke that role from individual addreses. The API for creating, granting and revoking roles looks like:

```.sol
core.createRole(keccak256("DUMMY_ROLE"), keccak256("GOVERN_ROLE"));
core.grantRole(keccak256("DUMMY_ROLE"), dummyAddress);
core.revokeRole(keccak256("DUMMY_ROLE"), dummyAddress);
```

This pattern is implemented using the [AccessControlEnumerable.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/AccessControlEnumerable.sol) contract pattern from OpenZeppelin.

## Contract admin
<!-- TODO -->


