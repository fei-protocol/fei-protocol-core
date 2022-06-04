// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

abstract contract CToken {
    function getCash() external view virtual returns (uint256);

    function underlying() external view virtual returns (address);

    function borrowBalanceCurrent() external virtual returns (uint256);
}

abstract contract CTokenFuse {
    function getCash() external view virtual returns (uint256);

    function underlying() external view virtual returns (address);

    function borrowBalanceCurrent(address debtor) external virtual returns (uint256);

    function repayBorrowBehalf(address borrower, uint256 repayAmount) external virtual returns (uint256);
}

abstract contract CEtherFuse {
    function getCash() external view virtual returns (uint256);

    function underlying() external view virtual returns (address);

    function borrowBalanceCurrent(address debtor) external virtual returns (uint256);

    function repayBorrowBehalf(address borrower) external payable virtual;
}
