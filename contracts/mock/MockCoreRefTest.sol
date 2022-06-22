// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

contract MockCoreRefTest is CoreRef {
    constructor(address core) CoreRef(core) {
        _setContractAdminRole(keccak256("MOCK_CORE_REF_ADMIN"));
    }

    function governorOrGuardianTest() external hasAnyOfTwoRoles(keccak256("GOVERN_ROLE"), keccak256("GUARDIAN_ROLE")) {}
}
