// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {Core} from "../../core/Core.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {Vm} from "./Vm.sol";

struct FeiTestAddresses {
    address user;
    address secondUser;
    address beneficiary1;
    address beneficiary2;
    address governor;
    address genesisGroup;
    address keeper;
    address pcvController;
    address minter;
    address burner;
    address guardian;
    address pcvGuardianAdmin;
    address pcvSafeMover;
}

/// @dev Get a list of addresses
function getAddresses() pure returns (FeiTestAddresses memory) {
    FeiTestAddresses memory addresses = FeiTestAddresses({
        user: address(0x1),
        secondUser: address(0x2),
        beneficiary1: address(0x3),
        beneficiary2: address(0x4),
        governor: address(0x5),
        genesisGroup: address(0x6),
        keeper: address(0x7),
        pcvController: address(0x8),
        minter: address(0x9),
        burner: address(0x10),
        guardian: address(0x11),
        pcvGuardianAdmin: address(0x12),
        pcvSafeMover: address(0x13)
    });

    return addresses;
}

/// @dev Deploy and configure Core
function getCore() returns (Core) {
    address HEVM_ADDRESS = address(bytes20(uint160(uint256(keccak256("hevm cheat code")))));
    Vm vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses memory addresses = getAddresses();

    // Deploy Core from Governor address
    vm.startPrank(addresses.governor);

    Core core = new Core();
    core.init();
    core.grantMinter(addresses.minter);
    core.grantBurner(addresses.burner);
    core.grantPCVController(addresses.pcvController);
    core.grantGuardian(addresses.guardian);

    core.createRole(TribeRoles.PCV_GUARDIAN_ADMIN, TribeRoles.GOVERNOR);
    core.grantRole(TribeRoles.PCV_GUARDIAN_ADMIN, addresses.pcvGuardianAdmin);
    core.createRole(TribeRoles.PCV_SAFE_MOVER_ROLE, TribeRoles.GOVERNOR);
    core.grantRole(TribeRoles.PCV_SAFE_MOVER_ROLE, addresses.pcvSafeMover);

    vm.stopPrank();
    return core;
}

/// @notice Dummy contract used to test NopeDAO and Safe proposals
contract DummyStorage {
    uint256 private variable = 5;

    function getVariable() external view returns (uint256) {
        return variable;
    }

    function setVariable(uint256 x) external {
        variable = x;
    }
}
