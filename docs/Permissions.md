[Permissions.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/core/Permissions.sol)
implements [IPermissions](https://github.com/fei-protocol/fei-protocol-core/wiki/IPermissions), [AccessControl](https://docs.openzeppelin.com/contracts/3.x/api/access#AccessControl)

## Description
The access control module of the Core contract. Maintains which roles exist, role admins, and which addresses have which roles.

## Implementation

The following 5 roles are defined:
* Governor - Able to grant and revoke all roles, also controls other protocol parameters
* Minter - Able to mint FEI to any address
* Burner - Able to burn FEI from any address
* PCV Controller - Able to move PCV in and out of PCV Deposits
* Revoker - Able to revoke any role

The contract exposes setters only available to the governor, and getters open to all.
One special setter allows the governor to create new roles, or update the admin of existing roles.

Another special setter allows the revoker role to revoke roles even though it is not the admin for those roles. The reason it works is because the Permissions contract is itself a governor, and the revoke override method has the contract do an external revoke call to itself.
