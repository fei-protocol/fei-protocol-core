pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {Vm} from "../../../utils/Vm.sol";
import {DSTest} from "../../../utils/DSTest.sol";
import {TribeRedeemer} from "../../../../shutdown/redeem/TribeRedeemer.sol";
import {MockERC20} from "../../../../mock/MockERC20.sol";
import {getAddresses, FeiTestAddresses} from "../../../utils/Fixtures.sol";

contract TribeRedeemerTest is DSTest {
    event Redeemed(address indexed owner, address indexed receiver, uint256 amount, uint256 base);

    uint256 private constant REDEEM_BASE = 250000000 ether; // 250M

    TribeRedeemer private redeemer;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    FeiTestAddresses public addresses = getAddresses();

    MockERC20 private redeemToken;
    MockERC20 private token1;
    MockERC20 private token2;
    MockERC20 private token3;

    address payable owner = payable(address(42));

    function setUp() public {
        redeemToken = new MockERC20();

        token1 = new MockERC20();
        token2 = new MockERC20();
        token3 = new MockERC20();

        address[] memory tokensReceived = new address[](3);
        tokensReceived[0] = address(token1);
        tokensReceived[1] = address(token2);
        tokensReceived[2] = address(token3);

        redeemer = new TribeRedeemer(address(redeemToken), tokensReceived, REDEEM_BASE);

        token1.mint(address(redeemer), 50000 ether); // 50k
        token2.mint(address(redeemer), 20000 ether); // 20k
        token3.mint(address(redeemer), 30000000 ether); // 30M
        redeemToken.mint(address(owner), REDEEM_BASE); // 250M
    }

    /// @notice Validate initiate state when deployed
    function testInitialState() public {
        assertEq(redeemer.redeemedToken(), address(redeemToken));
        assertEq(redeemer.redeemBase(), REDEEM_BASE);
        assertEq(redeemer.tokensReceivedOnRedeem().length, 3);
        assertEq(redeemer.tokensReceivedOnRedeem()[0], address(token1));
        assertEq(redeemer.tokensReceivedOnRedeem()[1], address(token2));
        assertEq(redeemer.tokensReceivedOnRedeem()[2], address(token3));
    }

    ///////////////////// previewRedeem() /////////////////////////
    function testPreviewRedeem() public {
        (address[] memory tokensRedeemed, uint256[] memory amountsRedeemAll) = redeemer.previewRedeem(REDEEM_BASE);

        assertEq(tokensRedeemed.length, 3);
        assertEq(tokensRedeemed[0], address(token1));
        assertEq(tokensRedeemed[1], address(token2));
        assertEq(tokensRedeemed[2], address(token3));
        assertEq(amountsRedeemAll.length, 3);
        assertEq(amountsRedeemAll[0], 50000 ether); // 50k
        assertEq(amountsRedeemAll[1], 20000 ether); // 20k
        assertEq(amountsRedeemAll[2], 30000000 ether); // 30M

        (, uint256[] memory amountsRedeemHalf) = redeemer.previewRedeem(REDEEM_BASE / 2);
        assertEq(amountsRedeemHalf[0], 25000 ether); // 25k
        assertEq(amountsRedeemHalf[1], 10000 ether); // 10k
        assertEq(amountsRedeemHalf[2], 15000000 ether); // 15M
    }

    //////////////////////// redeem() /////////////////////////////
    function testRedeemForSelf() public {
        // redeem for self
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), REDEEM_BASE);
        vm.expectEmit(true, true, true, true);
        emit Redeemed(owner, owner, REDEEM_BASE, REDEEM_BASE);
        redeemer.redeem(owner, REDEEM_BASE);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(address(redeemer)), REDEEM_BASE);
        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(owner), 50000 ether);
        assertEq(token2.balanceOf(owner), 20000 ether);
        assertEq(token3.balanceOf(owner), 30000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 0);
        assertEq(token2.balanceOf(address(redeemer)), 0);
        assertEq(token3.balanceOf(address(redeemer)), 0);
    }

    function testRedeemTwoUsers() public {
        address payable otherOwner = payable(address(43));

        // send half of the redeem tokens to a 2nd user
        vm.prank(owner);
        redeemToken.transfer(otherOwner, REDEEM_BASE / 2);

        // first user redeems
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), REDEEM_BASE / 2);
        redeemer.redeem(owner, REDEEM_BASE / 2);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(otherOwner), REDEEM_BASE / 2);
        assertEq(redeemToken.balanceOf(address(redeemer)), REDEEM_BASE / 2);

        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(owner), 25000 ether);
        assertEq(token2.balanceOf(owner), 10000 ether);
        assertEq(token3.balanceOf(owner), 15000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 25000 ether);
        assertEq(token2.balanceOf(address(redeemer)), 10000 ether);
        assertEq(token3.balanceOf(address(redeemer)), 15000000 ether);

        // second user redeems
        vm.startPrank(otherOwner);
        redeemToken.approve(address(redeemer), REDEEM_BASE / 2);
        redeemer.redeem(otherOwner, REDEEM_BASE / 2);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(otherOwner), 0);
        assertEq(redeemToken.balanceOf(address(redeemer)), REDEEM_BASE);

        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(otherOwner), 25000 ether);
        assertEq(token2.balanceOf(otherOwner), 10000 ether);
        assertEq(token3.balanceOf(otherOwner), 15000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 0);
        assertEq(token2.balanceOf(address(redeemer)), 0);
        assertEq(token3.balanceOf(address(redeemer)), 0);
    }

    function testRedeemSendAway() public {
        // owner redeems and sends to receiver
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), REDEEM_BASE);
        vm.expectEmit(true, true, true, true);
        emit Redeemed(owner, address(this), REDEEM_BASE, REDEEM_BASE);
        redeemer.redeem(address(this), REDEEM_BASE);
        vm.stopPrank();

        // check tokens spent & received by the redeemer
        assertEq(redeemToken.balanceOf(owner), 0);
        assertEq(redeemToken.balanceOf(address(redeemer)), REDEEM_BASE);
        // check received balances & sent by the redeemer
        assertEq(token1.balanceOf(address(this)), 50000 ether);
        assertEq(token2.balanceOf(address(this)), 20000 ether);
        assertEq(token3.balanceOf(address(this)), 30000000 ether);
        assertEq(token1.balanceOf(address(redeemer)), 0);
        assertEq(token2.balanceOf(address(redeemer)), 0);
        assertEq(token3.balanceOf(address(redeemer)), 0);
    }

    function testRedeemRevertNoBalance() public {
        // empty tokens from the redeemer
        vm.startPrank(address(redeemer));
        token1.transfer(address(this), token1.balanceOf(address(redeemer)));
        token2.transfer(address(this), token2.balanceOf(address(redeemer)));
        token3.transfer(address(this), token3.balanceOf(address(redeemer)));
        vm.stopPrank();

        // redeem for self
        vm.startPrank(owner);
        redeemToken.approve(address(redeemer), REDEEM_BASE);
        vm.expectRevert(bytes("ZERO_BALANCE"));
        redeemer.redeem(owner, REDEEM_BASE);
        vm.stopPrank();
    }
}
