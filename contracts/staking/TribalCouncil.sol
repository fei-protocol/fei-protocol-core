pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../refs/CoreRef.sol";
import "./IMasterChief.sol";

interface CErc20Interface {
    function mint(uint mintAmount) external returns (uint);
    function approve(address spender, uint256 amount) external;
    function balanceOf(address account) external view returns(uint256);

    function redeem(uint redeemTokens) external returns (uint);
    function balanceOfUnderlying(address owner) external returns (uint);
    function exchangeRateCurrent() external view returns (uint);
}

contract TribalCouncil is ERC20, CoreRef {
    IMasterChief public masterChief;

    uint256 public pid;

    CErc20Interface public fTribe;

    constructor(
        address _core,
        IMasterChief _masterChief, 
        uint256 _pid,
        CErc20Interface _fTribe
    ) CoreRef(_core) ERC20("TribalCouncil", "xTRIBE") {
        masterChief = _masterChief;
        pid = _pid;
        fTribe = _fTribe;

        tribe().approve(address(fTribe), type(uint256).max);
        fTribe.approve(address(masterChief), type(uint256).max);
    }

    // Join the council. Pay some TRIBE. Earn some shares.
    function enter(uint256 _amount) public {
        uint256 totalTribe = getTotalTribe();
        uint256 totalShares = totalSupply();
        if (totalShares == 0 || totalTribe == 0) {
            _mint(msg.sender, _amount);
        } else {
            uint256 what = _amount * totalShares / totalTribe;
            _mint(msg.sender, what);
        }
        tribe().transferFrom(msg.sender, address(this), _amount);
    }

    function getTotalTribe() public view returns(uint256) {
        uint256 stakedFTribe = masterChief.userInfo(pid, address(this)).amount;
        uint256 underlyingTribe = stakedFTribe * fTribe.exchangeRateCurrent() / 1e18;
        return tribeBalance() + underlyingTribe + masterChief.pendingSushi(pid, address(this));
    }

    // Leave the council. Claim back your TRIBE.
    function leave(uint256 _share) public {
        uint256 totalShares = totalSupply();
        uint256 what = _share * getTotalTribe() / totalShares;
        _burn(msg.sender, _share);

        _unstake(what);
        tribe().transfer(msg.sender, what);
    }

    function compound() public {
        // claim TRIBE rewards
        masterChief.harvest(pid, address(this));

        // deposit rewards plus previously held TRIBE to Fuse
        uint256 heldTribe = tribeBalance();
        fTribe.mint(heldTribe);

        // deposit Fuse tokens to MasterChief
        masterChief.deposit(pid, fTribe.balanceOf(address(this)));
    }

    function _unstake(uint256 _amount) internal {
        // calculate how much fTRIBE will redeem _amount TRIBE
        // inversion of `amount = fTribe * exchangeRate / 1e18`
        uint256 fTribeToWithdraw = _amount * 1e18 / fTribe.exchangeRateCurrent();

        // withdraw and claim rewards, harvested rewards can help with rounding errors, if any
        masterChief.withdrawAndHarvest(pid, fTribeToWithdraw, address(this));

        // claim fTribe for underlying
        fTribe.redeem(fTribeToWithdraw);
    }
}