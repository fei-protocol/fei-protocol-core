// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

contract MockCoreRefTest is CoreRef {
	constructor(address core) CoreRef(core) {
		_setContractAdminRole(keccak256("MOCK_CORE_REF_ADMIN"));
	}

	function governorOrGuardianTest() hasAnyOfTwoRoles(
        GOVERN_ROLE,
        GUARDIAN_ROLE
    ) external {

    }
}

