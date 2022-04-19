// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Core} from "../../core/Core.sol";
import {PegStabilityModule} from "../../peg/PegStabilityModule.sol";
import {PriceBoundPSM} from "../../peg/PriceBoundPSM.sol";
import {ConstantOracle} from "../../oracle/ConstantOracle.sol";
import {IPCVDeposit} from "../../pcv/IPCVDeposit.sol";
import {Vm} from "./Vm.sol";

struct FeiTestAddresses {
    address userAddress;
    address secondUserAddress;
    address beneficiaryAddress1;
    address beneficiaryAddress2;
    address governorAddress;
    address genesisGroup;
    address keeperAddress;
    address pcvControllerAddress;
    address minterAddress;
    address burnerAddress;
    address guardianAddress;
}

/// @dev Get a list of addresses
function getAddresses() pure returns (FeiTestAddresses memory) {
    FeiTestAddresses memory addresses = FeiTestAddresses({
        userAddress: address(0x1),
        secondUserAddress: address(0x2),
        beneficiaryAddress1: address(0x3),
        beneficiaryAddress2: address(0x4),
        governorAddress: address(0x5),
        genesisGroup: address(0x6),
        keeperAddress: address(0x7),
        pcvControllerAddress: address(0x8),
        minterAddress: address(0x9),
        burnerAddress: address(0x10),
        guardianAddress: address(0x11)
    });

    return addresses;
}

/// @dev Deploy and configure Core
function getCore() returns (Core) {
    address HEVM_ADDRESS = address(
        bytes20(uint160(uint256(keccak256("hevm cheat code"))))
    );
    Vm vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses memory addresses = getAddresses();

    // Deploy Core from Governor address
    vm.startPrank(addresses.governorAddress);

    Core core = new Core();
    core.init();
    core.grantMinter(addresses.minterAddress);
    core.grantBurner(addresses.burnerAddress);
    core.grantPCVController(addresses.pcvControllerAddress);
    core.grantGuardian(addresses.guardianAddress);

    vm.stopPrank();
    return core;
}

function getConstantOracle(address coreAddress, uint256 priceBasisPoints)
    returns (ConstantOracle)
{
    return new ConstantOracle(coreAddress, priceBasisPoints);
}

/// @dev Deploy and configure the eth psm with a set price ($100)
function getEthPSM(address coreAddress) returns (PegStabilityModule) {
    // Deploy constant oracle to use with the eth psm
    ConstantOracle constantOracle = getConstantOracle(coreAddress, 1_000_000);

    PegStabilityModule.OracleParams memory oracleParams = PegStabilityModule
        .OracleParams({
            coreAddress: coreAddress,
            oracleAddress: address(constantOracle),
            backupOracle: address(0x0),
            decimalsNormalizer: 18,
            doInvert: false
        });

    // Deploy the Eth PSM
    PegStabilityModule ethPSM = new PegStabilityModule(
        oracleParams,
        0,
        0,
        0,
        0,
        0,
        IERC20(address(0x0)),
        IPCVDeposit(address(0x0))
    );

    return ethPSM;
}

/// @dev Deploy & configure the dai psm with a set price floor & ceiling (0.99, 1.01)
function getDaiPSM(address coreAddress) returns (PriceBoundPSM) {
    // Deploy constant oracle to use with the dai psm
    ConstantOracle constantOracle = getConstantOracle(coreAddress, 1_000_000);

    PegStabilityModule.OracleParams memory oracleParams = PegStabilityModule
        .OracleParams({
            coreAddress: coreAddress,
            oracleAddress: address(constantOracle),
            backupOracle: address(0x0),
            decimalsNormalizer: 18,
            doInvert: false
        });

    // Deploy the dai PSM
    PriceBoundPSM daiPSM = new PriceBoundPSM(
        9990,
        10010,
        oracleParams,
        0,
        0,
        0,
        0,
        0,
        IERC20(address(0x0)),
        IPCVDeposit(address(0x0))
    );

    return daiPSM;
}
