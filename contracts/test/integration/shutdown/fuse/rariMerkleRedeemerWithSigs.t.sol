// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../../utils/Fixtures.sol";
import {RariMerkleRedeemer} from "../../../../shutdown/fuse/RariMerkleRedeemer.sol";
import {MainnetAddresses} from "../../fixtures/MainnetAddresses.sol";
import {Constants} from "../../../../Constants.sol";
import {Test} from "../../../libs/forge-standard/src/Test.sol";
import {console2} from "../../../libs/forge-standard/src/console2.sol";

/**
 * Library to assist with testing.
 */
library RariMerkleRedeemerTestingLib {
    /**
     * Returns the actual list of cTokens in address[] memory format
     */
    function getCTokens() public pure returns (address[] memory cTokens) {
        cTokens = new address[](20);

        cTokens[0] = address(0x001E407f497e024B9fb1CB93ef841F43D645CA4F);
        cTokens[1] = address(0x26267e41CeCa7C8E0f143554Af707336f27Fa051);
        cTokens[2] = address(0x3E5C122Ffa75A9Fe16ec0c69F7E9149203EA1A5d);
        cTokens[3] = address(0x647A36d421183a0a9Fa62717a64B664a24E469C7);
        cTokens[4] = address(0x6f95d4d251053483f41c8718C30F4F3C404A8cf2);
        cTokens[5] = address(0x7DBC3aF9251756561Ce755fcC11c754184Af71F7);
        cTokens[6] = address(0x7e9cE3CAa9910cc048590801e64174957Ed41d43);
        cTokens[7] = address(0x88d3557eB6280CC084cA36e425d6BC52d0A04429);
        cTokens[8] = address(0x8922C1147E141C055fdDfc0ED5a119f3378c8ef8);
        cTokens[9] = address(0x8E4E0257A4759559B4B1AC087fe8d80c63f20D19);
        cTokens[10] = address(0x9de558FCE4F289b305E38ABe2169b75C626c114e);
        cTokens[11] = address(0xA54c548d11792b3d26aD74F5f899e12CDfD64Fd6);
        cTokens[12] = address(0xEbE0d1cb6A0b8569929e062d67bfbC07608f0A47);
        cTokens[13] = address(0xF148cDEc066b94410d403aC5fe1bb17EC75c5851);
        cTokens[14] = address(0xFA1057d02A0C1a4885851e3F4fD496Ee7D38F56e);
        cTokens[15] = address(0xbB025D470162CC5eA24daF7d4566064EE7f5F111);
        cTokens[16] = address(0xd8553552f8868C1Ef160eEdf031cF0BCf9686945);
        cTokens[17] = address(0xda396c927e3e6BEf77A98f372CE431b49EdEc43D);
        cTokens[18] = address(0xe097783483D1b7527152eF8B150B99B9B2700c8d);
        cTokens[19] = address(0xe92a3db67e4b6AC86114149F522644b34264f858);

        return cTokens;
    }

    /**
     * Returns the the rates in uint256[] form
     * These are the rates in proposals/data/merkle_redemption/sample/rates_block_15523462.json
     * The rates are in the same order as the cTokens returned by getCTokens()
     * There are 20 of them
     */
    function getSampleRates() public pure returns (uint256[] memory rates) {
        rates = new uint256[](20);

        rates[0] = 231540746619934624;
        rates[1] = 341354010637578862592;
        rates[2] = 1091335033267090560;
        rates[3] = 207406232171308352;
        rates[4] = 1150549648364068064709035687936;
        rates[5] = 337053294976458489856;
        rates[6] = 1111166032322895360;
        rates[7] = 211125864165532163812184031232;
        rates[8] = 208082249701544352;
        rates[9] = 1145285931266335232;
        rates[10] = 1068448207979855616;
        rates[11] = 201022159924689216;
        rates[12] = 1798618655591938654208;
        rates[13] = 1127678320624508928;
        rates[14] = 1090297666819638528;
        rates[15] = 215443097045550450798749548544;
        rates[16] = 1282748676553260662784;
        rates[17] = 207077517760064270111556501504;
        rates[18] = 3878390633192979169280;
        rates[19] = 1797274337215806177280;
    }

    /**
     * Returns the the roots in bytes32[] form
     * These are the roots in proposals/data/merkle_redemption/sample/roots_block_15523462.json
     * Array will have 20 elements
     */
    function getSampleRoots() public pure returns (bytes32[] memory roots) {
        roots = new bytes32[](20);

        roots[0] = 0xf9894cc44a9658bafb08668feacbf893fe86489e9de3d2274c1ab35d6b1cf138;
        roots[1] = 0x08bd5ddcfc925f0527fca8b41b20948c4ded5854505166760e940948076344a7;
        roots[2] = 0x88d99a9222e118212bc1fb9c092380806e16ba2f70ef14965a8ec8a5a70c2de5;
        roots[3] = 0xb907439b22e1aa289c9108f0f19706db3bab91c48830032ca540bfb088fdafae;
        roots[4] = 0x9e22062937d6d9e735478957c506e79d20f39efad657aef7bfc628cdf4216c5d;
        roots[5] = 0x98ee6621e41de581da04b10a0d13c7b80a078040f87d82a72d0683e18b7ba443;
        roots[6] = 0x13be16f88851f6287c171e145e3f632e41d73b847883bfb51be3707bf231e1ba;
        roots[7] = 0xe753122fff71ab7280e77cf020639ceb592b6305a1ef3a672a8a7a8f788f4d9f;
        roots[8] = 0xb33ff7fa0acd7ab58a621cc02c2d7c5da33c2d99d0cd4cf9c63d015ff0a2623d;
        roots[9] = 0x969998c9a589ff11787d0d9efdf2be50ad720aad293f7f447eb2c3665cde7ce8;
        roots[10] = 0xea75e01b85e4a83321eaed2e905147d53657473c3082693eafdbf0c665278303;
        roots[11] = 0x92f7998a932d487b986f4ff23b9eadfb68ef027b1e9415ba5a88f5d4b2dd88f8;
        roots[12] = 0x3e5b78f703bd226d569a0f637188ccc635faac91ab4eaff48d47f99e3430cacc;
        roots[13] = 0x158d4633f057774dc4611b3f51169b80534e9949ac575184a9223dc9303d2815;
        roots[14] = 0x1d4bb73962a8fc8498d48b79f912d9d496536e4cccc901d9224bba5fcb2e5500;
        roots[15] = 0x9fa1e7de4fd116954a1bf4c8231b43685e90d18e8f143fd668be6c7c6410918c;
        roots[16] = 0xf7ba2ce5b09908c73fd69ea3017f727f1c1a66a4b6c815175efa933c0b959577;
        roots[17] = 0x5f94cabd44141752ac19ba37394bb51306a441f1a4cebdb8e7a3e95c6adc7577;
        roots[18] = 0xef9fadb47e415e97f85474565f5d2c149332daefd60a1bb41f785194dcf97798;
        roots[19] = 0x82eb47decb2589725239f2567e830434a30289320029793939169d6a3711b301;
    }

    /**
     * Returns a proof in bytes32[] form
     * These are the proofs in proposals/data/merkle_redemption/sample/proofs_block_15523462.json
     */
    function getSampleProof(address forWhom, address whichToken) public pure returns (bytes32[] memory proof) {
        if (forWhom != address(0x82A978B3f5962A5b0957d9ee9eEf472EE55B42F1)) {
            revert("Only 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1 is currently supported for user address");
        }

        if (whichToken != address(0x001E407f497e024B9fb1CB93ef841F43D645CA4F)) {
            revert("Only 0x001e407f497e024b9fb1cb93ef841f43d645ca4f is currently supported for token address");
        }

        proof = new bytes32[](2);

        proof[0] = bytes32(0xe8818b60f4d00f43ed2da2560cdfcbe3c7696245d74f10d474968ee4cd385560);
        proof[1] = bytes32(0xb1d897ef31fc3d92a0f68d89a21a2245d11cb3c5f3de8627d2f3120c3b447916);

        return proof;
    }
}

/// @notice This tests the RariMerkleRedeemer contract - not modified at all to remove restrictions eg a correct signature
/// In order to test the flow (since we obviously don't have the private testKeys for the snapshot accounts), we add in some test
/// accounts that we control in order make sure that every part of the claiming process works
/// We'll use some test users in the real snapshot, too, but they will be different addresses
contract RariMerkleRedeemerIntegrationTest is Test {
    RariMerkleRedeemer public redeemer;

    address[] internal cTokens;
    address[] internal testAddresses;
    uint256[] internal testKeys;

    function setUp() public {
        cTokens = RariMerkleRedeemerTestingLib.getCTokens();
        (testAddresses, testKeys) = getTestAccounts();

        redeemer = new RariMerkleRedeemer(
            MainnetAddresses.FEI,
            RariMerkleRedeemerTestingLib.getCTokens(),
            RariMerkleRedeemerTestingLib.getSampleRates(),
            RariMerkleRedeemerTestingLib.getSampleRoots()
        );

        // give the redeemer contract a bunch of fei
        deal(MainnetAddresses.FEI, address(redeemer), 100_000_000_000e18);

        // give all our test accounts a bunch of each ctoken
        for (uint256 i = 0; i < testAddresses.length; i++) {
            for (uint256 j = 0; j < cTokens.length; j++) {
                deal(cTokens[j], testAddresses[i], 100_000_000_000e18);
            }
        }

        // give our test accounts eth
        for (uint256 i = 0; i < testAddresses.length; i++) {
            deal(testAddresses[i], 10 ether);
        }
    }

    /**
     * Helper function to get 100 test user accounts
     * Can use the privkeys with vm.sign and can impersonate with pranks
     * index 0 is account 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1
     * index 1 is account 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e
     */
    function getTestAccounts() internal returns (address[] memory _addresses, uint256[] memory _keys) {
        _addresses = new address[](100);
        _keys = new uint256[](100);

        for (uint256 i = 0; i < 100; i++) {
            (_addresses[i], _keys[i]) = makeAddrAndKey(vm.toString(i));
        }
    }

    /**
     * Test the main sign-claim-redeem flow with fake/generated data; uses the real redeemer
     * contract (but with the fake merkle data) since we *do* have their private keys
     */
    function testWithGeneratedAccounts() public {
        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cTokens[0];

        uint256[] memory amounts = new uint256[](1);

        amounts[0] = 123456789123456789;

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]);
        bytes32[][] memory proofs = new bytes32[][](1);

        proofs[0] = proof;

        vm.startPrank(testAddresses[0]);

        IERC20(cTokensToTransfer[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 cTokenStartBalance = IERC20(cTokensToTransfer[0]).balanceOf(testAddresses[0]);
        uint256 baseTokenStartBalance = IERC20(redeemer.baseToken()).balanceOf(testAddresses[0]);
        redeemer.signAndClaimAndRedeem(signature, cTokensToTransfer, amounts, amounts, proofs);
        uint256 cTokenEndBalance = IERC20(cTokensToTransfer[0]).balanceOf(testAddresses[0]);
        uint256 baseTokenEndBalance = IERC20(redeemer.baseToken()).balanceOf(testAddresses[0]);
        assertEq(cTokenStartBalance - cTokenEndBalance, amounts[0] * 1);
        vm.stopPrank();
    }

    function testNonAtomicRedemption() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature);
        redeemer.claim(
            cTokens[0],
            123456789123456789,
            RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0])
        );
        uint256 cTokenBalPre = IERC20(cTokens[0]).balanceOf(testAddresses[0]);
        redeemer.redeem(cTokens[0], 1);
        uint256 cTokenBalPost = IERC20(cTokens[0]).balanceOf(testAddresses[0]);
        assertEq(cTokenBalPre - cTokenBalPost, 1);

        vm.stopPrank();
    }

    function testCannotSignTwice() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);

        vm.expectRevert("User has already signed");
        redeemer.sign(signature0);

        vm.stopPrank();
    }

    function testCannotClaimTwice() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature);
        redeemer.claim(
            cTokens[0],
            123456789123456789,
            RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0])
        );

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]);
        vm.expectRevert("User has already claimed for this cToken.");
        redeemer.claim(cTokens[0], 1, proof);

        vm.stopPrank();
    }

    function testCannotClaimEmptyProof() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cTokens[0], 1, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimInvalidAmount() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature0 = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature0);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cTokens[0], 2, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimNonExistentUser() public {
        vm.startPrank(testAddresses[99]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[99], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        redeemer.sign(signature);
        vm.expectRevert("Merkle proof not valid.");
        redeemer.claim(cTokens[0], 2, new bytes32[](0));

        vm.stopPrank();
    }

    function testCannotClaimWithoutSigning() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]);

        vm.expectRevert("User has not signed.");
        redeemer.claim(cTokens[0], 1, proof);

        vm.stopPrank();
    }

    function testCannotRedeemWithoutcTokens() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 123456789123456789;

        deal(cTokens[0], testAddresses[0], 0);

        redeemer.sign(signature);
        redeemer.claim(cTokens[0], amount, RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]));

        vm.expectRevert("SafeERC20: ERC20 operation did not succeed");
        redeemer.redeem(cTokens[0], amount);

        vm.stopPrank();
    }

    function testCannotRedeemTooMuch() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 123456789123456789;

        deal(cTokens[0], testAddresses[0], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cTokens[0], amount, RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]));
        redeemer.redeem(cTokens[0], amount - 1);
        redeemer.redeem(cTokens[0], 1);

        vm.expectRevert("Amount exceeds available remaining claim.");
        redeemer.redeem(cTokens[0], 1);

        vm.stopPrank();
    }

    function testRedeemInParts() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        uint256 amount = 123456789123456789;

        deal(cTokens[0], testAddresses[0], 100_000_000e18);

        redeemer.sign(signature);
        redeemer.claim(cTokens[0], amount, RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]));
        redeemer.redeem(cTokens[0], amount - 1);
        redeemer.redeem(cTokens[0], 1);

        vm.stopPrank();
    }

    function testRedeemInPartsSeparateAmounts() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cTokens[0];

        uint256 amount = 123456789123456789;

        uint256[] memory amountsToClaim = new uint256[](1);
        amountsToClaim[0] = amount;

        uint256[] memory amountsToRedeem = new uint256[](1);
        amountsToRedeem[0] = amount - 1;

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]);
        bytes32[][] memory proofs = new bytes32[][](1);
        proofs[0] = proof;

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        deal(cTokens[0], testAddresses[0], 100_000_000e18);

        redeemer.signAndClaimAndRedeem(signature, cTokensToTransfer, amountsToClaim, amountsToRedeem, proofs);
        redeemer.redeem(cTokens[0], 1);

        vm.stopPrank();
    }

    function testRedeemInPartsSeparateAmountsSecondAmountTooMuch() public {
        vm.startPrank(testAddresses[0]);

        IERC20(cTokens[0]).approve(address(redeemer), 100_000_000e18);
        (uint8 v0, bytes32 r0, bytes32 s0) = vm.sign(testKeys[0], redeemer.MESSAGE_HASH());

        address[] memory cTokensToTransfer = new address[](1);
        cTokensToTransfer[0] = cTokens[0];

        uint256 amount = 123456789123456789;

        uint256[] memory amountsToClaim = new uint256[](1);
        amountsToClaim[0] = amount;

        uint256[] memory amountsToRedeem = new uint256[](1);
        amountsToRedeem[0] = amount - 1;

        bytes32[] memory proof = RariMerkleRedeemerTestingLib.getSampleProof(testAddresses[0], cTokens[0]);
        bytes32[][] memory proofs = new bytes32[][](1);
        proofs[0] = proof;

        bytes memory signature = bytes.concat(r0, s0, bytes1(v0));

        deal(cTokens[0], testAddresses[0], 100_000_000e18);

        redeemer.signAndClaimAndRedeem(signature, cTokensToTransfer, amountsToClaim, amountsToRedeem, proofs);

        vm.expectRevert("Amount exceeds available remaining claim.");
        redeemer.redeem(cTokens[0], 2);

        vm.stopPrank();
    }
}
