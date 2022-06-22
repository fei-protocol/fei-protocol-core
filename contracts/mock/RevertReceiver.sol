pragma solidity ^0.8.0;

contract RevertReceiver {
    fallback() external payable {
        revert("RevertReceiver: cannot accept eth");
    }
}
