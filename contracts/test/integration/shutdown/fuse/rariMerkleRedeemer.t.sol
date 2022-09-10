// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../../utils/Fixtures.sol";
import {MockRariMerkleRedeemerNoSigs} from "../../../../mock/MockRariMerkleRedeemerNoSigs.sol";
import {RariMerkleRedeemer} from "../../../../shutdown/fuse/RariMerkleRedeemer.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";
import {Constants} from "../../../../Constants.sol";
import {Test} from "../../../libs/forge-standard/src/Test.sol";
import {console2} from "../../../libs/forge-standard/src/console2.sol";

/**
 * Library to assist with testing.
 * Some of the arrays here contain data that is very close to the real data,
 * but please not that IT IS NOT THE REAL DATA. DO NOT USE AS A PRODUCTION DATA SOURCE.
 */
library RariMerkleRedeemerTestingLib {
    // The format of the data contained within each leaf of the Merkle Tree
    struct UserData {
        address user;
        uint256 balance;
    }

    /**
     * Returns some sample users, handily pre-encapsulated in a UserData[] memory array
     */
    function getUsers() public pure returns (UserData[] memory users) {
        // users for cToken: 0xd8553552f8868c1ef160eedf031cf0bcf9686945
        // '0xb2d5cb72a621493fe83c6885e4a776279be595bc': '1' wei cToken
        // '0x37349d9cc523d28e6abfc03fc5f44879bc8bffd9': '11152021915736699992171534' wei cToken

        users = new UserData[](2);

        users[0] = UserData(address(0xb2d5CB72A621493fe83C6885E4A776279be595bC), 1);
        users[1] = UserData(address(0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9), 11152021915736699992171534);

        return users;
    }

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

    /**
     * Returns a list of 27 exchange rates. Not the actual ones; just for testing.
     */
    function getExampleRates() public pure returns (uint256[] memory rates) {
        rates = new uint256[](27);

        rates[0] = 1e18;
        rates[1] = 2e18;
        rates[2] = 5e18;

        // unsure if this is needed
        for (uint256 i = 3; i < 27; i++) {
            rates[i] = 1e18;
        }

        return rates;
    }

    /**
     * Returns a list of 27 roots corresponding to the 27 ctokens from above.
     * These are the actual roots for the sample data in proposals/data/hack_repayment_data_real_sample.ts
     */
    function getExampleRoots() public pure returns (bytes32[] memory roots) {
        roots = new bytes32[](27);

        roots[0] = bytes32(0xa0f39c7ea219a2cb6f4e5600b68b033dd728c46f6f97f600913d39840d980a75);
        roots[1] = bytes32(0x23c789bd2ebfb9d58f67e63921d243d335f12f9558db5c39bfca17270803dc15);
        roots[2] = bytes32(0x6df1521806401ce5b6ae85aa19c746edcc6483ae3b59b7c8d2a3a6b6539d5e62);
        roots[3] = bytes32(0xaadc33d33372c571646ab17878956ef55edabd08ee4e6ddf4b7e4ad58c00b546);
        roots[4] = bytes32(0x27fc646affe6a72626f06f0446c39f091705e86d5f52ab5d76b209181e054871);
        roots[5] = bytes32(0x23ad67da46aec636f01b27fcb0e61cb47bb334ef099233ecee435bde5fa451bc);
        roots[6] = bytes32(0x90cd4f7218e605d9f0dd02e908b0c3543eba15d38a31742237f52d8415a87c45);
        roots[7] = bytes32(0xbccb0430b5fed669c18f22c8e0e0676157944a88922f8f6c290f09cf17054372);
        roots[8] = bytes32(0xc8f5831956da3ce4f890980d6dd2f572f1bf0ad5984e1144a0eedda07587e35c);
        roots[9] = bytes32(0x9ddbb9b528c6c63db19fe55f18953dbe43c15dcf2effe51afee9d8e3e7aeee0d);
        roots[10] = bytes32(0x530f8754b64345c11706eca2851ac5bc94738eb26852c87b0cda34cec0909ca0);
        roots[11] = bytes32(0x9c0710c7d697b3103c6b07c942f25aac9e5e4718dd225dd5949671efdcdf6a4e);
        roots[12] = bytes32(0xc0aa5492ee3523d6992f301bf994ca27641d03da13a7fc015fb97930018b28bf);
        roots[13] = bytes32(0x609d03bca361f9bf980883d81226e7e61e80c4dc800cab987b937da5847bf38c);
        roots[14] = bytes32(0xc30d4a90accfc79eb40cf8ec2291b482d0ccf5b251fb400bc813f357fbef606d);
        roots[15] = bytes32(0x9204ac4a8fe70ab56350132fed5dc58ba2c73036e336c961f4210862ca1cb44b);
        roots[16] = bytes32(0xbb0f61dd54ffe4f7539c6effe9d78d1addadc392bd91b44d3ab1cbaf3250cf6e);
        roots[17] = bytes32(0xf6a7f1cf777a5c181af69d4768503e7485fcbd243e72acb6a6dbcb9b25de88f9);
        roots[18] = bytes32(0x6afdb1fb0c0dd74fff2941b4f56267b0cc2025a8957bfbe857530590897548c0);
        roots[19] = bytes32(0xb28f94199c48945569aa44c968fbe5d68f3de4063eb59317fc1f1f0e4f5c839c);
        roots[20] = bytes32(0xa3c816a95f29aaf8038ea65314aac1d15834c991868fcdadce7e2e1ec9b906a5);
        roots[21] = bytes32(0xe836dd7180037caaef1cd6f2d14de92c138cff774bb7ae1e2bdac3b02c45ee1f);
        roots[22] = bytes32(0x8fec95f1b1434720a13eaac79f215d1811b9d27ec6231cc264f6fd29384404c6);
        roots[23] = bytes32(0xf4ff1d720dffdb58f82974781cab4e560e4923b0086b1da6fe5c73b34c7db9bf);
        roots[24] = bytes32(0xe1cac43bd377fdcae629e455bef0c06782fc24311e696400905b91b34bbc1f43);
        roots[25] = bytes32(0xf51f65a3034ff7262870c91f3272308c62ae43ca86671b66a73228eefb48aa63);
        roots[26] = bytes32(0x8e51b7180ccad02f846cd6339825b5a7554e122c4914378a5877a124c5fbbfbb);

        return roots;
    }

    /**
     * Returns a list of 27 roots corresponding to the 27 ctokens from above.
     * These are the actual roots for the sample data in proposals/data/hack_repayment_data_generated_accounts.ts
     */
    function getExampleRootsWithGeneratedAccounts() public pure returns (bytes32[] memory roots) {
        roots = new bytes32[](27);

        roots[0] = bytes32(0x4c064ca571cdd7ac3c256337ca21ba9fbfc95c24aa67e0514b841ac87e4e13a7);
        roots[1] = bytes32(0x23c789bd2ebfb9d58f67e63921d243d335f12f9558db5c39bfca17270803dc15);
        roots[2] = bytes32(0x6df1521806401ce5b6ae85aa19c746edcc6483ae3b59b7c8d2a3a6b6539d5e62);
        roots[3] = bytes32(0xaadc33d33372c571646ab17878956ef55edabd08ee4e6ddf4b7e4ad58c00b546);
        roots[4] = bytes32(0x27fc646affe6a72626f06f0446c39f091705e86d5f52ab5d76b209181e054871);
        roots[5] = bytes32(0x23ad67da46aec636f01b27fcb0e61cb47bb334ef099233ecee435bde5fa451bc);
        roots[6] = bytes32(0x90cd4f7218e605d9f0dd02e908b0c3543eba15d38a31742237f52d8415a87c45);
        roots[7] = bytes32(0xbccb0430b5fed669c18f22c8e0e0676157944a88922f8f6c290f09cf17054372);
        roots[8] = bytes32(0xc8f5831956da3ce4f890980d6dd2f572f1bf0ad5984e1144a0eedda07587e35c);
        roots[9] = bytes32(0x9ddbb9b528c6c63db19fe55f18953dbe43c15dcf2effe51afee9d8e3e7aeee0d);
        roots[10] = bytes32(0x530f8754b64345c11706eca2851ac5bc94738eb26852c87b0cda34cec0909ca0);
        roots[11] = bytes32(0x9c0710c7d697b3103c6b07c942f25aac9e5e4718dd225dd5949671efdcdf6a4e);
        roots[12] = bytes32(0xc0aa5492ee3523d6992f301bf994ca27641d03da13a7fc015fb97930018b28bf);
        roots[13] = bytes32(0x609d03bca361f9bf980883d81226e7e61e80c4dc800cab987b937da5847bf38c);
        roots[14] = bytes32(0xc30d4a90accfc79eb40cf8ec2291b482d0ccf5b251fb400bc813f357fbef606d);
        roots[15] = bytes32(0x9204ac4a8fe70ab56350132fed5dc58ba2c73036e336c961f4210862ca1cb44b);
        roots[16] = bytes32(0xbb0f61dd54ffe4f7539c6effe9d78d1addadc392bd91b44d3ab1cbaf3250cf6e);
        roots[17] = bytes32(0xf6a7f1cf777a5c181af69d4768503e7485fcbd243e72acb6a6dbcb9b25de88f9);
        roots[18] = bytes32(0x6afdb1fb0c0dd74fff2941b4f56267b0cc2025a8957bfbe857530590897548c0);
        roots[19] = bytes32(0xb28f94199c48945569aa44c968fbe5d68f3de4063eb59317fc1f1f0e4f5c839c);
        roots[20] = bytes32(0xa3c816a95f29aaf8038ea65314aac1d15834c991868fcdadce7e2e1ec9b906a5);
        roots[21] = bytes32(0xe836dd7180037caaef1cd6f2d14de92c138cff774bb7ae1e2bdac3b02c45ee1f);
        roots[22] = bytes32(0x8fec95f1b1434720a13eaac79f215d1811b9d27ec6231cc264f6fd29384404c6);
        roots[23] = bytes32(0xf4ff1d720dffdb58f82974781cab4e560e4923b0086b1da6fe5c73b34c7db9bf);
        roots[24] = bytes32(0xe1cac43bd377fdcae629e455bef0c06782fc24311e696400905b91b34bbc1f43);
        roots[25] = bytes32(0xf51f65a3034ff7262870c91f3272308c62ae43ca86671b66a73228eefb48aa63);
        roots[26] = bytes32(0x8e51b7180ccad02f846cd6339825b5a7554e122c4914378a5877a124c5fbbfbb);

        return roots;
    }

    /**
     * Returns two proofs; these are valid for jsut these two users, for the data contained in
     * proposals/data/hack_repayment_data_real_sample.ts
     */
    function getExampleProofs() public pure returns (bytes32[][] memory proofs) {
        proofs = new bytes32[][](2);

        // proof for '0xb2d5CB72A621493fe83C6885E4A776279be595bC', '1' on ctoken 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945

        bytes32[] memory proofZero = new bytes32[](7);

        proofZero[0] = 0xc355980b7ddbe0f22f3305faadce5d785947fbc6bbe24b5eddf981532ae35633;
        proofZero[1] = 0x354069cb812e5279adbb788b78d7bcdc5cb95c779c34e5be9e14ace378beafc5;
        proofZero[2] = 0x4186179750d003c678f3c3a36b8581548db060057cb4e65fdffbc1ec2d6dad45;
        proofZero[3] = 0x0dca7d6114da50263ce4389134e3d61504bcdd1161ce8205bbc4d91550998445;
        proofZero[4] = 0xf50493874d6d3a80a4cf7fbd616b60b76f9e9684dcaff55df170b69b5073d5ed;
        proofZero[5] = 0x20b63b764e3128313cb59b8351cab8753e5a9a00e01701e6314cb927242bdec5;
        proofZero[6] = 0x5f013546dd5a228f64a78651e1426898381d7c5bedb0a83358fc79dc5436af8f;

        // proof for '0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9', '11152021915736699992171534' on ctoken 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945

        bytes32[] memory proofOne = new bytes32[](7);

        proofOne[0] = 0x6e69489751c0d2cf8bb897e58a12fa0cbfdc405f4aec83c97a0e97f950800d24;
        proofOne[1] = 0x7f7913cd65155427697493e02bcfe79418156989dd0c44da3eae1fa221251deb;
        proofOne[2] = 0x52fb3bc5cb7363a98c56ceec6fd16f37e6665233f4003bbf716be17e1b7ec810;
        proofOne[3] = 0xf7e5b7b544a6e060e215c3808ae4dd49ea950596db05d1b37127646500868037;
        proofOne[4] = 0x0c2dbfb21d799811ebc28a45543830840ac37b16aff95f5df231cf4b322f1ea0;
        proofOne[5] = 0x8f6e1401206c2969f4a2c923485ed4830a6c3081c51c899d7ec92c37ecbc76b9;
        proofOne[6] = 0x4e040b0a8945a716cefd1b511d9a02fa100ae18e738f40626e2afd4a112d0f82;

        proofs[0] = proofZero;
        proofs[1] = proofOne;

        return proofs;
    }

    /**
     * Returns two proofs; these are valid for jsut these two users, for the data contained in
     * proposals/data/hack_repayment_data_generated_accounts.ts
     */
    function getExampleProofsWithGeneratedAccounts() public pure returns (bytes32[][] memory proofs) {
        proofs = new bytes32[][](2);

        // proof for '0xb2d5CB72A621493fe83C6885E4A776279be595bC', '1' on ctoken 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945

        bytes32[] memory proofZero = new bytes32[](1);
        proofZero[0] = 0xa95c863d14ce5e1aced105eb6a32bb3c4b4911c5ba17c9e94ce275218da467f4;

        // proof for '0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9', '11152021915736699992171534' on ctoken 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945

        bytes32[] memory proofOne = new bytes32[](1);
        proofOne[0] = 0xba546b15530def2d01c86027160142721344c9e7576a6d083128ffe88d9af67c;

        proofs[0] = proofZero;
        proofs[1] = proofOne;

        return proofs;
    }
}

contract RariMerkleRedeemerIntegrationTest is Test {
    // redeemerNoSigs is a simple subclass of redeemer that doesn't actually verify signatures
    // we use this to test against the real sample data
    MockRariMerkleRedeemerNoSigs public redeemerNoSigs;

    // redeemer is the actual full redeemer contract
    // we generated fake data from accounts we know the privkeys to so that we can fully test
    // the sign-claim-redeem path, with real signatures (but with fake/sample data)
    RariMerkleRedeemer public redeemer;

    // test addresses & privkeys
    address[] internal addresses;
    uint256[] internal keys;

    address private constant cToken0 = 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945;
    address private constant realUser0 = 0xb2d5CB72A621493fe83C6885E4A776279be595bC;
    address private constant realUser1 = 0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9;

    function setUp() public {
        (addresses, keys) = getTestAccounts();

        redeemerNoSigs = new MockRariMerkleRedeemerNoSigs(
            MainnetAddresses.FEI,
            RariMerkleRedeemerTestingLib.getCTokens(),
            RariMerkleRedeemerTestingLib.getExampleRates(),
            RariMerkleRedeemerTestingLib.getExampleRoots()
        );

        redeemer = new RariMerkleRedeemer(
            MainnetAddresses.FEI,
            RariMerkleRedeemerTestingLib.getCTokens(),
            RariMerkleRedeemerTestingLib.getExampleRates(),
            RariMerkleRedeemerTestingLib.getExampleRootsWithGeneratedAccounts()
        );

        // give the redeemer contracts a bunch of fei
        deal(MainnetAddresses.FEI, address(redeemerNoSigs), 100_000_000_000e18);
        deal(MainnetAddresses.FEI, address(redeemer), 100_000_000_000e18);

        // give users one and two (from the real sample data) and the first generated address ctokens
        deal(cToken0, realUser0, 100_000_000e18);
        deal(cToken0, realUser1, 100_000_000e18);
        deal(cToken0, addresses[0], 100_000_000e18);

        // label some stuff to make testing more understandable
        vm.label(cToken0, "cToken0");
        vm.label(realUser0, "User0");
        vm.label(realUser1, "User1");
        vm.label(addresses[0], "GeneratedAddress0");
        vm.label(addresses[1], "GeneratedAddress1");
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

    /**
     * Test the main sign-claim-redeem flow with the sample data; uses the subclassed redeemer
     * contract which does not actually check signatures (since we dont have their private keys)
     */
    function testHappyPathNoSigChecks() public {
        RariMerkleRedeemerTestingLib.UserData[] memory users = RariMerkleRedeemerTestingLib.getUsers();

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cToken0;

        uint256[] memory amounts0 = new uint256[](1);
        amounts0[0] = users[0].balance;

        uint256[] memory amounts1 = new uint256[](1);
        amounts1[0] = users[1].balance;

        bytes32[][] memory proofs = RariMerkleRedeemerTestingLib.getExampleProofs();

        // when calling signAndClaimAndRedeem we take in an array of ctokens, amounts and proofs
        // thus we need to encapsulate everything into an array

        bytes32[][] memory proofZero = new bytes32[][](1);
        bytes32[][] memory proofOne = new bytes32[][](1);

        proofZero[0] = proofs[0];
        proofOne[0] = proofs[1];

        {
            vm.startPrank(users[0].user);
            IERC20(cTokensToTransfer[0]).approve(address(redeemerNoSigs), 100_000_000e18);
            uint256 user0PreBal = IERC20(cTokensToTransfer[0]).balanceOf(users[0].user);
            uint256 baseTokenStartBalance0 = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[0].user);
            redeemerNoSigs.signAndClaimAndRedeem("0xFFFF", cTokensToTransfer, amounts0, amounts0, proofZero);
            uint256 baseTokenEndBalance0 = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[0].user);
            assertEq(
                baseTokenEndBalance0 - baseTokenStartBalance0,
                amounts0[0] * 1,
                "User 0 base token balance not correct"
            );
            uint256 user0PostBal = IERC20(cTokensToTransfer[0]).balanceOf(users[0].user);
            assertEq(user0PreBal - user0PostBal, amounts0[0], "User 0 ctoken balance not correct");
        }

        {
            changePrank(users[1].user);
            IERC20(cTokensToTransfer[0]).approve(address(redeemerNoSigs), 100_000_000e18);
            uint256 user1PreBal = IERC20(cTokensToTransfer[0]).balanceOf(users[1].user);
            uint256 baseTokenStartBalance1 = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[1].user);
            redeemerNoSigs.signAndClaimAndRedeem("0xFFFF", cTokensToTransfer, amounts1, amounts1, proofOne);
            uint256 baseTokenEndBalance1 = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[1].user);
            assertEq(
                baseTokenEndBalance1 - baseTokenStartBalance1,
                amounts1[0] * 1,
                "User 1 base token balance not correct"
            );
            uint256 user1PostBal = IERC20(cTokensToTransfer[0]).balanceOf(users[1].user);
            assertEq(user1PreBal - user1PostBal, amounts1[0], "User 1 ctoken balance not correct");
            vm.stopPrank();
        }
    }

    /**
     * Test the main sign-claim-redeem flow with the sample data; uses the subclassed redeemer
     * contract which does not actually check signatures (since we dont have their private keys)
     * This second test provides separate values for amountsToClaim and amountsToRedeem
     */
    function testHappyPathNoSigChecksSeparateAmounts() public {
        RariMerkleRedeemerTestingLib.UserData[] memory users = RariMerkleRedeemerTestingLib.getUsers();

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cToken0;

        uint256[] memory amountsToClaim1 = new uint256[](1);
        amountsToClaim1[0] = users[1].balance;

        uint256[] memory amountsToRedeem1 = new uint256[](1);
        amountsToRedeem1[0] = users[1].balance - 1;

        bytes32[][] memory proofs = RariMerkleRedeemerTestingLib.getExampleProofs();

        // when calling signAndClaimAndRedeem we take in an array of ctokens, amounts and proofs
        // thus we need to encapsulate everything into an array

        bytes32[][] memory proofOne = new bytes32[][](1);

        proofOne[0] = proofs[1];

        changePrank(users[1].user);
        IERC20(cTokensToTransfer[0]).approve(address(redeemerNoSigs), 100_000_000e18);
        uint256 cTokenStartBalance = IERC20(cTokensToTransfer[0]).balanceOf(users[1].user);
        uint256 baseTokenStartBalance = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[1].user);
        redeemerNoSigs.signAndClaimAndRedeem("0xFFFF", cTokensToTransfer, amountsToClaim1, amountsToRedeem1, proofOne);
        uint256 basetTokenEndBalance = IERC20(redeemerNoSigs.baseToken()).balanceOf(users[1].user);
        assertEq(basetTokenEndBalance - baseTokenStartBalance, amountsToRedeem1[0] * 1);
        uint256 cTokenEndBalance = IERC20(cTokensToTransfer[0]).balanceOf(users[1].user);
        assertEq(cTokenStartBalance - cTokenEndBalance, amountsToRedeem1[0]);
        vm.stopPrank();
    }

    /**
     * Test the main sign-claim-redeem flow with fake/generated data; uses the real redeemer
     * contract (but with the fake merkle data) since we *do* have their private keys
     */
    function testWithGeneratedAccounts() public {
        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cToken0;

        uint256[] memory amounts0 = new uint256[](1);
        amounts0[0] = 1;

        bytes32[][] memory proofs = RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts();
        bytes32[][] memory proofZero = new bytes32[][](1);

        proofZero[0] = proofs[0];

        vm.startPrank(addresses[0]);

        IERC20(cTokensToTransfer[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        uint256 cTokenStartBalance = IERC20(cTokensToTransfer[0]).balanceOf(addresses[0]);
        uint256 baseTokenStartBalance = IERC20(redeemerNoSigs.baseToken()).balanceOf(addresses[0]);
        redeemer.signAndClaimAndRedeem(signature0, cTokensToTransfer, amounts0, amounts0, proofZero);
        uint256 cTokenEndBalance = IERC20(cTokensToTransfer[0]).balanceOf(addresses[0]);
        uint256 baseTokenEndBalance = IERC20(redeemerNoSigs.baseToken()).balanceOf(addresses[0]);
        assertEq(cTokenStartBalance - cTokenEndBalance, amounts0[0] * 1);
        assertEq(baseTokenEndBalance - baseTokenStartBalance, amounts0[0] * 1);
        vm.stopPrank();
    }

    function testNonAtomicRedemption() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        redeemer.claim(cToken0, 1, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[0]);
        uint256 baseBalPre = IERC20(redeemerNoSigs.baseToken()).balanceOf(addresses[0]);
        uint256 cTokenBalPre = IERC20(cToken0).balanceOf(addresses[0]);
        redeemer.redeem(cToken0, 1);
        uint256 baseBalPost = IERC20(redeemerNoSigs.baseToken()).balanceOf(addresses[0]);
        uint256 cTokenBalPost = IERC20(cToken0).balanceOf(addresses[0]);
        assertEq(cTokenBalPre - cTokenBalPost, 1);
        assertEq(baseBalPost - baseBalPre, 1);

        vm.stopPrank();
    }

    function testCannotSignTwice() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);

        vm.expectRevert("User has already signed");
        redeemer.sign(signature0);

        vm.stopPrank();
    }

    function testCannotClaimTwice() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        redeemer.claim(cToken0, 1, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[0]);

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[0];
        vm.expectRevert("User has already claimed for this cToken.");
        redeemer.claim(cToken0, 1, proof);

        vm.stopPrank();
    }

    function testCannotClaimEmptyProof() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cToken0, 1, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimInvalidAmount() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cToken0, 2, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimNonExistentUser() public {
        vm.startPrank(addresses[99]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[99], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cToken0, 2, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimWithoutSigning() public {
        vm.startPrank(addresses[0]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[0];

        vm.expectRevert("User has not signed.");
        redeemer.claim(cToken0, 1, proof);

        vm.stopPrank();
    }

    function testCannotRedeemWithoutApproval() public {
        vm.startPrank(addresses[1]);

        //IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 11152021915736699992171534;

        deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cToken0, amount, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[1]);

        vm.expectRevert("SafeERC20: ERC20 operation did not succeed");
        redeemer.redeem(cToken0, amount);

        vm.stopPrank();
    }

    function testCannotRedeemWithoutcTokens() public {
        vm.startPrank(addresses[1]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 11152021915736699992171534;

        //deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cToken0, amount, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[1]);

        vm.expectRevert("SafeERC20: ERC20 operation did not succeed");
        redeemer.redeem(cToken0, amount);

        vm.stopPrank();
    }

    function testCannotRedeemTooMuch() public {
        vm.startPrank(addresses[1]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 11152021915736699992171534;

        deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cToken0, amount, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[1]);
        redeemer.redeem(cToken0, amount - 1);
        redeemer.redeem(cToken0, 1);

        vm.expectRevert("Amount exceeds available remaining claim.");
        redeemer.redeem(cToken0, 1);

        vm.stopPrank();
    }

    function testRedeemInParts() public {
        vm.startPrank(addresses[1]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 11152021915736699992171534;

        deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cToken0, amount, RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts()[1]);
        redeemer.redeem(cToken0, amount - 1);
        redeemer.redeem(cToken0, 1);

        vm.stopPrank();
    }

    function testRedeemInPartsSeparateAmounts() public {
        vm.startPrank(addresses[1]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cToken0;

        uint256 amount = 11152021915736699992171534;

        uint256[] memory amountsToClaim = new uint256[](1);
        amountsToClaim[0] = amount;

        uint256[] memory amountsToRedeem = new uint256[](1);
        amountsToRedeem[0] = amount - 1;

        bytes32[][] memory proofs = RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts();
        bytes32[][] memory proofZero = new bytes32[][](1);
        proofZero[0] = proofs[1];

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.signAndClaimAndRedeem(signature, cTokensToTransfer, amountsToClaim, amountsToRedeem, proofZero);
        redeemer.redeem(cToken0, 1);

        vm.stopPrank();
    }

    function testRedeemInPartsSeparateAmountsSecondAmountTooMuch() public {
        vm.startPrank(addresses[1]);

        IERC20(cToken0).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(keys[1], redeemer.MESSAGE_HASH());

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cToken0;

        uint256 amount = 11152021915736699992171534;

        uint256[] memory amountsToClaim = new uint256[](1);
        amountsToClaim[0] = amount;

        uint256[] memory amountsToRedeem = new uint256[](1);
        amountsToRedeem[0] = amount - 1;

        bytes32[][] memory proofs = RariMerkleRedeemerTestingLib.getExampleProofsWithGeneratedAccounts();
        bytes32[][] memory proofZero = new bytes32[][](1);
        proofZero[0] = proofs[1];

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        deal(cToken0, addresses[1], 100_000_000e18);

        redeemer.signAndClaimAndRedeem(signature, cTokensToTransfer, amountsToClaim, amountsToRedeem, proofZero);

        vm.expectRevert("Amount exceeds available remaining claim.");
        redeemer.redeem(cToken0, 2);

        vm.stopPrank();
    }

    function testMultipleProofs() public {
        // user 0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab has 2 cTokens that he can claim in the real sample dataset:
        // ctoken 0xd8553552f8868c1ef160eedf031cf0bcf9686945, balance 993589106605953983
        // ctoken 0xbb025d470162cc5ea24daf7d4566064ee7f5f111, balance 690998780903

        bytes32[][] memory proofs = new bytes32[][](2);

        /* proof of 0xd855... ctoken:
            [
                "0x62dca27c719923b0b4153289b81c241bc8ef47f5cad5ec58ade92445aeb39425",
                "0x71cccc05bcc088efcb703861a77652785d97b902f142e54a88aa086e1a0b4b9d",
                "0x7ea144047c7d80af5adede075b1413985ae8c6414b3852bbf1eed5306cfe64da",
                "0x7f2f9d975d83fff6601d9a42c2d455427fc1905d1852e4f140b34ce94829ff6e",
                "0x9593e7925a7f31febb5129f974e732afcfdec22b7eb3c9c89d4e06d830d5cabd",
                "0x8f6e1401206c2969f4a2c923485ed4830a6c3081c51c899d7ec92c37ecbc76b9",
                "0x4e040b0a8945a716cefd1b511d9a02fa100ae18e738f40626e2afd4a112d0f82"
            ]
        */

        bytes32[] memory proofZero = new bytes32[](7);

        proofZero[0] = bytes32(0x62dca27c719923b0b4153289b81c241bc8ef47f5cad5ec58ade92445aeb39425);
        proofZero[1] = bytes32(0x71cccc05bcc088efcb703861a77652785d97b902f142e54a88aa086e1a0b4b9d);
        proofZero[2] = bytes32(0x7ea144047c7d80af5adede075b1413985ae8c6414b3852bbf1eed5306cfe64da);
        proofZero[3] = bytes32(0x7f2f9d975d83fff6601d9a42c2d455427fc1905d1852e4f140b34ce94829ff6e);
        proofZero[4] = bytes32(0x9593e7925a7f31febb5129f974e732afcfdec22b7eb3c9c89d4e06d830d5cabd);
        proofZero[5] = bytes32(0x8f6e1401206c2969f4a2c923485ed4830a6c3081c51c899d7ec92c37ecbc76b9);
        proofZero[6] = bytes32(0x4e040b0a8945a716cefd1b511d9a02fa100ae18e738f40626e2afd4a112d0f82);

        /* proof of 0xbb02... ctoken:
            [
                "0x559b86b696ea2560904747957cb4b6c622938a2253a7c564224010453dec5910",
                "0x00df7f59ac7c7df48999c1e7879a35d4b05650a4c1407f65a150fc362f78746d",
                "0xa5a7e6945e1ceba6d94998701ae8afd0ab99d85d9203f44b360d5b011b41af4e",
                "0x34af766f69be5f7fb507f8e41b8cb6d1d1fa40d90814072945d764536d46b59b",
                "0x4437c9684809f08315750d4062f27c2fb831a6d921bd36d1775770d36a7b9008",
                "0x327803747b0f1dd3d0103cc4ef0aba2b1155f78532eb926691a170428e2e2932",
                "0x227e55550409b39e95170a8f5ddb3fc56e5fad27cfdd658a8e587ea344ba674e"
            ]
        */

        bytes32[] memory proofOne = new bytes32[](7);

        proofOne[0] = bytes32(0x559b86b696ea2560904747957cb4b6c622938a2253a7c564224010453dec5910);
        proofOne[1] = bytes32(0x00df7f59ac7c7df48999c1e7879a35d4b05650a4c1407f65a150fc362f78746d);
        proofOne[2] = bytes32(0xa5a7e6945e1ceba6d94998701ae8afd0ab99d85d9203f44b360d5b011b41af4e);
        proofOne[3] = bytes32(0x34af766f69be5f7fb507f8e41b8cb6d1d1fa40d90814072945d764536d46b59b);
        proofOne[4] = bytes32(0x4437c9684809f08315750d4062f27c2fb831a6d921bd36d1775770d36a7b9008);
        proofOne[5] = bytes32(0x327803747b0f1dd3d0103cc4ef0aba2b1155f78532eb926691a170428e2e2932);
        proofOne[6] = bytes32(0x227e55550409b39e95170a8f5ddb3fc56e5fad27cfdd658a8e587ea344ba674e);

        proofs[0] = proofZero;
        proofs[1] = proofOne;

        address user = 0x3Ee505bA316879d246a8fD2b3d7eE63b51B44FAB;
        vm.startPrank(user);

        IERC20(cToken0).approve(address(redeemerNoSigs), 100_000_000e18);

        uint256 amount0 = 993589106605953983;
        uint256 amount1 = 690998780903;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = amount0;
        amounts[1] = amount1;

        address _cToken0 = 0xd8553552f8868C1Ef160eEdf031cF0BCf9686945;
        address _cToken1 = 0xbB025D470162CC5eA24daF7d4566064EE7f5F111;

        address[] memory cTokens = new address[](2);
        cTokens[0] = _cToken0;
        cTokens[1] = _cToken1;

        deal(_cToken0, user, 100_000_000e18);
        deal(_cToken1, user, 100_000_000e18);

        redeemerNoSigs.sign("0xFFFF");
        redeemerNoSigs.multiClaim(cTokens, amounts, proofs);

        uint256 baseTokenBalPre = IERC20(redeemerNoSigs.baseToken()).balanceOf(user);
        uint256 cToken0BalPre = IERC20(_cToken0).balanceOf(user);
        uint256 cToken1BalPre = IERC20(_cToken1).balanceOf(user);

        IERC20(_cToken0).approve(address(redeemerNoSigs), type(uint256).max);
        IERC20(_cToken1).approve(address(redeemerNoSigs), type(uint256).max);

        redeemerNoSigs.multiRedeem(cTokens, amounts);

        uint256 cToken0BalPost = IERC20(_cToken0).balanceOf(user);
        uint256 cToken1BalPost = IERC20(_cToken1).balanceOf(user);
        uint256 baseTokenBalPost = IERC20(redeemerNoSigs.baseToken()).balanceOf(user);

        assertEq(cToken0BalPre - cToken0BalPost, amount0, "ctoken 0 amount incorrect");
        assertEq(cToken1BalPre - cToken1BalPost, amount1, "ctoken 1 amount incorrect");
        assertEq(baseTokenBalPost - baseTokenBalPre, (1 * amount0) + (2 * amount1), "base token amount incorrect");

        vm.stopPrank();
    }
}
