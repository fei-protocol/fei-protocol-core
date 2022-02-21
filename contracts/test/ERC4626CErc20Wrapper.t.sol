pragma solidity ^0.8.4;

import {Vm} from "./utils/Vm.sol";
import {DSTest} from "./utils/DSTest.sol";
import {Core} from "../core/Core.sol";
import {MockERC20} from "../mock/MockERC20.sol";
import {MockCToken} from "../mock/MockCToken.sol";
import {ERC4626CErc20Wrapper} from "../pcv/compound/ERC4626CErc20Wrapper.sol";
import {getCore, getAddresses, FeiTestAddresses} from "./utils/Fixtures.sol";

contract ERC4626CErc20WrapperTest is DSTest {
    MockERC20 private token;
    MockCToken private cToken;
    ERC4626CErc20Wrapper private vault;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        token = new MockERC20();
        cToken = new MockCToken(address(token), false);
        vault = new ERC4626CErc20Wrapper(address(cToken), "fTRIBE-8 ERC4626 wrapper", "4626-fTRIBE-8");
      
        vm.label(address(token), "token");
        vm.label(address(cToken), "cToken");
        vm.label(address(vault), "vault");
        vm.label(address(this), "user");
    }

    /*///////////////////////////////////////////////////////////////
                init
    //////////////////////////////////////////////////////////////*/

    function testInit() public {
        // wrapper metadata
        assertEq(address(vault.cToken()), address(cToken));
        assertEq(address(vault.cTokenUnderlying()), address(token));
        
        // vault metadata
        assertEq(vault.asset(), address(token));
        assertEq(vault.totalAssets(), 0);

        // invariant checks
        assertEq(vault.totalAssets(), 0);
        assertEq(token.balanceOf(address(this)), 0);
        assertEq(token.balanceOf(address(cToken)), 0);
        assertEq(cToken.balanceOf(address(vault)), 0);
        assertEq(vault.balanceOf(address(this)), 0);
    }

    /*///////////////////////////////////////////////////////////////
                deposit()
    //////////////////////////////////////////////////////////////*/

    function testDeposit1(uint128 assets) public {
        address receiver = address(0x42);

        token.mint(address(this), assets);
        token.approve(address(vault), assets);
        uint256 shares = vault.deposit(assets, receiver);
        uint256 expectedShares = uint256(assets) / 2;
        assertEq(shares, expectedShares);

        assertEq(vault.totalAssets(), assets);
        assertEq(token.balanceOf(address(this)), 0);
        assertEq(token.balanceOf(address(cToken)), assets);
        assertEq(cToken.balanceOf(address(vault)), expectedShares);
        assertEq(vault.balanceOf(receiver), expectedShares);
    }

    function testDeposit2() public {
        cToken.setError(true);
        token.mint(address(this), 1e18);
        token.approve(address(vault), 1e18);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: error on cToken.mint"));
        vault.deposit(1e18, address(this));
    }

    /*///////////////////////////////////////////////////////////////
                mint()
    //////////////////////////////////////////////////////////////*/

    function testMint1(uint128 shares) public {
        address receiver = address(0x42);

        uint256 expectedAssets = uint256(shares) * 2;
        token.mint(address(this), expectedAssets);
        token.approve(address(vault), expectedAssets);
        uint256 assets = vault.mint(shares, receiver);
        assertEq(assets, expectedAssets);

        assertEq(vault.totalAssets(), expectedAssets);
        assertEq(token.balanceOf(address(this)), 0);
        assertEq(token.balanceOf(address(cToken)), expectedAssets);
        assertEq(cToken.balanceOf(address(vault)), shares);
        assertEq(vault.balanceOf(receiver), shares);
    }

    function testMint2() public {
        cToken.setError(true);
        token.mint(address(this), 1e18);
        token.approve(address(vault), 1e18);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: error on cToken.mint"));
        vault.mint(5e17, address(this));
    }

    /*///////////////////////////////////////////////////////////////
                withdraw()
    //////////////////////////////////////////////////////////////*/

    function testWithdraw1(uint128 assets) public {
        address receiver = address(0x42);
        address owner = address(this);

        token.mint(owner, assets);
        token.approve(address(vault), assets);
        uint256 depositShares = vault.deposit(assets, owner);
        uint256 withdrawShares = vault.withdraw(assets, receiver, owner);
        assertEq(withdrawShares, depositShares);

        assertEq(vault.totalAssets(), 0);
        assertEq(token.balanceOf(receiver), assets);
        assertEq(token.balanceOf(address(cToken)), 0);
        assertEq(cToken.balanceOf(address(vault)), 0);
        assertEq(vault.balanceOf(owner), 0);
    }

    function testWithdraw2() public {
        address receiver = address(0x42);
        address owner = address(this);

        token.mint(owner, 1e18);
        token.approve(address(vault), 1e18);
        vault.deposit(1e18, owner);
        cToken.setError(true);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: error on cToken.redeemUnderlying"));
        vault.withdraw(1e18, receiver, owner);
    }

    function testWithdraw3() public {
        address receiver = address(0x42);
        address owner = address(this);

        token.mint(owner, 1e18);
        token.approve(address(vault), 1e18);
        vault.deposit(1e18, owner);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: spender not authorized"));
        vm.prank(receiver);
        vault.withdraw(1e18, receiver, owner);
    }

    /*///////////////////////////////////////////////////////////////
                redeem()
    //////////////////////////////////////////////////////////////*/

    function testRedeem1(uint128 shares) public {
        address receiver = address(0x42);
        address owner = address(this);

        uint256 assets = uint256(shares) * 2;

        token.mint(owner, assets);
        token.approve(address(vault), assets);
        uint256 depositAssets = vault.mint(shares, owner);
        uint256 redeemAssets = vault.redeem(shares, receiver, owner);
        assertEq(redeemAssets, depositAssets);

        assertEq(vault.totalSupply(), 0);
        assertEq(token.balanceOf(receiver), assets);
        assertEq(token.balanceOf(address(cToken)), 0);
        assertEq(cToken.balanceOf(address(vault)), 0);
        assertEq(vault.balanceOf(owner), 0);
    }

    function testRedeem2() public {
        address receiver = address(0x42);
        address owner = address(this);

        token.mint(owner, 1e18);
        token.approve(address(vault), 1e18);
        vault.mint(5e17, owner);
        cToken.setError(true);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: error on cToken.redeemUnderlying"));
        vault.redeem(5e17, receiver, owner);
    }

    function testRedeem3() public {
        address receiver = address(0x42);
        address owner = address(this);

        token.mint(owner, 1e18);
        token.approve(address(vault), 1e18);
        vault.mint(5e17, owner);

        vm.expectRevert(bytes("ERC4626CErc20Wrapper: spender not authorized"));
        vm.prank(receiver);
        vault.redeem(5e17, receiver, owner);
    }

    /*///////////////////////////////////////////////////////////////
                vault accounting viewers
    //////////////////////////////////////////////////////////////*/

    function testConvertToShares(uint128 assets) public {
        uint256 expected = uint256(assets) / 2;
        uint256 actual = vault.convertToShares(assets);
        assertEq(actual, expected);
    }
    
    function testConvertToAssets(uint128 shares) public {
        uint256 expected = uint256(shares) * 2;
        uint256 actual = vault.convertToAssets(shares);
        assertEq(actual, expected);
    }
    
    function testMaxDeposit() public {
        address owner = address(0x42);
        uint256 expected = type(uint256).max;
        uint256 actual = vault.maxDeposit(owner);
        assertEq(actual, expected);
    }
    
    function testPreviewDeposit(uint128 assets) public {
        uint256 expected = uint256(assets) / 2;
        uint256 actual = vault.previewDeposit(assets);
        assertEq(actual, expected);
    }
    
    function testMaxMint() public {
        address owner = address(0x42);
        uint256 expected = type(uint256).max;
        uint256 actual = vault.maxMint(owner);
        assertEq(actual, expected);
    }
    
    function testPreviewMint(uint128 shares) public {
        uint256 expected = uint256(shares) * 2;
        uint256 actual = vault.previewMint(shares);
        assertEq(actual, expected);
    }
    
    function testMaxWithdraw() public {
        address owner = address(0x42);
        assertEq(vault.maxWithdraw(owner), 0);
        token.mint(owner, 1e18);
        vm.prank(owner);
        token.approve(address(vault), 1e18);
        vm.prank(owner);
        vault.deposit(1e18, owner);
        assertEq(vault.maxWithdraw(owner), 1e18);
    }
    
    function testPreviewWithdraw(uint128 assets) public {
        uint256 expected = assets / 2;
        uint256 actual = vault.previewWithdraw(assets);
        assertEq(actual, expected);
    }

    function testMaxRedeem() public {
        address owner = address(0x42);
        assertEq(vault.maxRedeem(owner), 0);
        token.mint(owner, 1e18);
        vm.prank(owner);
        token.approve(address(vault), 1e18);
        vm.prank(owner);
        vault.mint(1e17, owner);
        assertEq(vault.maxRedeem(owner), 1e17);
    }
    
    function testPreviewRedeem(uint128 shares) public {
        uint256 expected = uint256(shares) * 2;
        uint256 actual = vault.previewRedeem(shares);
        assertEq(actual, expected);
    }
}
