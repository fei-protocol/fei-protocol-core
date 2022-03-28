// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

struct MainnetAddresses {
    address feiDAOTimelock;
    address core;
    address tribe;
    address memberToken;
    address podController;
}

function getMainnetAddresses() pure returns (MainnetAddresses memory) {
    MainnetAddresses memory mainnetAddresses = MainnetAddresses({
        feiDAOTimelock: 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c,
        core: 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9,
        tribe: 0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B,
        memberToken: 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3,
        podController: 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8
    });
    return mainnetAddresses;
}
