// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";

contract MockStEthToken is MockERC20 {

    uint public pooledEth;
    uint public totalShares;
    mapping (address => uint) public shares;

    constructor () public {

        pooledEth = 1_000_000e18;
        totalShares = 999_999e18;
        shares[address(msg.sender)] = totalShares;

    }

    function submit (
        address _referral
    ) external payable returns (uint amount_) {

        amount_ = msg.value;

        uint _shares = getSharesByPooledEth(amount_);

        pooledEth += amount_;

        _mintShares(_shares, msg.sender);

    }

    function mintAt (address _dst) public {

        uint _shares = getSharesByPooledEth(100_000e18);

        pooledEth += 100_000e18;

        _mintShares(_shares, _dst);

    }

    function balanceOf (address _account) public view override returns (uint amount_) {

        return getPooledEthByShares(shares[_account]);

    }

    function getSharesByPooledEth (
        uint _ethAmount
    ) public view returns (
        uint shares_
    ) {

        shares_ = ( _ethAmount *  totalShares ) / pooledEth;

    }

    function transfer (address dst, uint amount) public override returns (bool) {
        _transfer(msg.sender, dst, amount);
        return true;
    }

    function transferFrom (address from, address to, uint amount) public override returns (bool) {
        _transfer(from, to, amount);
        return true;
    }

    function _transfer (address _sender, address _recipient, uint _amount) internal override {

        uint256 _sharesToTransfer = getSharesByPooledEth(_amount);

        uint256 _currentSenderShares = shares[_sender];
        require(_sharesToTransfer <= _currentSenderShares, "TRANSFER_AMOUNT_EXCEEDS_BALANCE");

        shares[_sender] = _currentSenderShares - _sharesToTransfer;
        shares[_recipient] = shares[_recipient] + _sharesToTransfer;

    }

    function getPooledEthByShares(
        uint256 _sharesAmount
    ) public view returns (
        uint256 eth_
    ) {

        eth_ = ( _sharesAmount * pooledEth ) / totalShares;

    }


    function _mintShares (
        uint _sharesAmount,
        address _recipient
    ) internal {

        totalShares += _sharesAmount;

        shares[_recipient] += _sharesAmount;

    }

    function getTotalPooledEther () public view returns (
        uint totalEther_
    ) {

        totalEther_ = pooledEth;

    }

    function getTotalShares () public returns (
        uint totalShares_
    ) {

        totalShares_ = totalShares;

    }

    receive () external payable { }

}
