pragma solidity ^0.8.4;

import "./MockPCVDepositV2.sol";

contract MockEthReceiverPCVDeposit is MockPCVDepositV2 {
    constructor(
      address _core,
      address _token,
      uint256 _resistantBalance,
      uint256 _resistantProtocolOwnedFei
    ) MockPCVDepositV2(_core, _token, _resistantBalance, _resistantProtocolOwnedFei) {}

    receive() external payable {}
}
