// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.13;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../../utils/Fixtures.sol";
import {MockRariMerkleRedeemerNoSigs} from "../../../../mock/MockRariMerkleRedeemerNoSigs.sol";
import {RariMerkleRedeemer} from "../../../../shutdown/fuse/RariMerkleRedeemer.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";
import {Constants} from "../../../../Constants.sol";
import {Test} from "../../../libs/forge-standard/src/Test.sol";
import {console2} from "../../../libs/forge-standard/src/console2.sol";
import {stdJson} from "../../../libs/forge-standard/src/stdJson.sol";

library FullRariMerkleRedeemerTestingLib {
    /**
     * Returns the actual list of cTokens in address[] memory format
     */
    function getCTokens() public pure returns (address[] memory cTokens) {
        cTokens = new address[](27);

        // @todo: add comments for each one showing which pool and token each address represents
        // @todo: check these addresses
        cTokens[0] = address(0xd8553552f8868C1Ef160eEdf031cF0BCf9686945);
        cTokens[1] = address(0xbB025D470162CC5eA24daF7d4566064EE7f5F111);
        cTokens[2] = address(0x7e9cE3CAa9910cc048590801e64174957Ed41d43);
        cTokens[3] = address(0x647A36d421183a0a9Fa62717a64B664a24E469C7);
        cTokens[4] = address(0xFA1057d02A0C1a4885851e3F4fD496Ee7D38F56e);
        cTokens[5] = address(0x8E4E0257A4759559B4B1AC087fe8d80c63f20D19);
        cTokens[6] = address(0x6f95d4d251053483f41c8718C30F4F3C404A8cf2);
        cTokens[7] = address(0x3E5C122Ffa75A9Fe16ec0c69F7E9149203EA1A5d);
        cTokens[8] = address(0x51fF03410a0dA915082Af444274C381bD1b4cDB1);
        cTokens[9] = address(0xB7FE5f277058b3f9eABf6e0655991f10924BFA54);
        cTokens[10] = address(0x9de558FCE4F289b305E38ABe2169b75C626c114e);
        cTokens[11] = address(0xda396c927e3e6BEf77A98f372CE431b49EdEc43D);
        cTokens[12] = address(0xF148cDEc066b94410d403aC5fe1bb17EC75c5851);
        cTokens[13] = address(0x0C402F06C11c6e6A6616C98868A855448d4CfE65);
        cTokens[14] = address(0x26267e41CeCa7C8E0f143554Af707336f27Fa051);
        cTokens[15] = address(0xEbE0d1cb6A0b8569929e062d67bfbC07608f0A47);
        cTokens[16] = address(0xe097783483D1b7527152eF8B150B99B9B2700c8d);
        cTokens[17] = address(0x8922C1147E141C055fdDfc0ED5a119f3378c8ef8);
        cTokens[18] = address(0x7DBC3aF9251756561Ce755fcC11c754184Af71F7);
        cTokens[19] = address(0x3a2804ec0Ff521374aF654D8D0daA1d1aE1ee900);
        cTokens[20] = address(0xA54c548d11792b3d26aD74F5f899e12CDfD64Fd6);
        cTokens[21] = address(0xA6C25548dF506d84Afd237225B5B34F2Feb1aa07);
        cTokens[22] = address(0xfbD8Aaf46Ab3C2732FA930e5B343cd67cEA5054C);
        cTokens[23] = address(0x001E407f497e024B9fb1CB93ef841F43D645CA4F);
        cTokens[24] = address(0x5CaDc2a04921213DE60B237688776e0F1A7155E6);
        cTokens[25] = address(0x88d3557eB6280CC084cA36e425d6BC52d0A04429);
        cTokens[26] = address(0xe92a3db67e4b6AC86114149F522644b34264f858);

        return cTokens;
    }
}

contract FullRariMerkleRedeemerIntegrationTest is Test {
    using stdJson for string;

    // redeemerNoSigs is a simple subclass of redeemer that doesn't actually verify signatures
    // we use this to test against the real sample data
    MockRariMerkleRedeemerNoSigs public redeemerNoSigs;

    // test addresses & privkeys & ctokens & all user balances by ctokens
    address[] internal addresses;
    uint256[] internal keys;
    address[] internal cTokens;

    // outer array is length 27 (27 ctokens)
    uint256[][] internal balances;

    function setUp() public {
        (addresses, keys) = getTestAccounts(); // returns 100 addresses & keys

        for (uint256 i = 0; i < 100; i++) {
            console2.logAddress(addresses[i]);
        }

        cTokens = FullRariMerkleRedeemerTestingLib.getCTokens(); // returns all 25 ctokens

        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/proposals/data/merkle_redeemer/testValues.json");
        string memory json = vm.readFile(path);

        balances = new uint256[][](27);

        for (uint256 i = 0; i < 27; i++) {
            balances[i] = json.readUintArray(vm.toString(cTokens[i]));
        }

        // balances is now a 27-length 2-d array with the outer array being the ctokens
        // and each inner array being the balances of users for that ctoken

        // we assume that the user address at index [x][y] = keys[x*y mod 100]
        // ie every 100 balance entries we cycle back to the first account

        // finally, read the rates and roots in from json files:

        string memory ratesPath = string.concat(root, "/proposals/data/merkle_redeemer/testRates.json");
        string memory rootsPath = string.concat(root, "/proposals/data/merkle_redeemer/testRoots.json");

        string memory ratesJson = vm.readFile(ratesPath);
        string memory rootsJson = vm.readFile(rootsPath);

        redeemerNoSigs = new MockRariMerkleRedeemerNoSigs(
            MainnetAddresses.FEI,
            FullRariMerkleRedeemerTestingLib.getCTokens(),
            ratesJson.readUintArray("rates"),
            rootsJson.readBytes32Array("roots")
        );

        // give the redeemer contract a bunch of fei
        deal(MainnetAddresses.FEI, address(redeemerNoSigs), 100_000_000_000e18);
    }

    /**
     * Helper function to get 100 test user accounts
     * Can use the privkeys with vm.sign and can impersonate with pranks
     */
    function getTestAccounts() internal returns (address[] memory _addresses, uint256[] memory _keys) {
        _addresses = new address[](100);
        _keys = new uint256[](100);

        for (uint256 i = 0; i < 100; i++) {
            (_addresses[i], _keys[i]) = makeAddrAndKey(vm.toString(i));
        }
    }

    function testAll() public {
        getTestAccounts();
    }
}

/*
    string memory root = vm.projectRoot();
    string memory path = string.concat(root, "/src/test/fixtures/broadcast.log.json");
    string memory json = vm.readFile(path);
*/
