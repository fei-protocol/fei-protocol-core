// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IERC20Airdropper {

    function pricePerTx() external view returns (uint256);

    function transfer(address _token, address payable _referral, address[] calldata _addresses, uint256[] calldata _values) external payable returns (bool); 

}