pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

/// @title IDO interface
/// @author Fei Protocol
interface IDOInterface {
    // ----------- Events -----------

    event Deploy(uint256 _amountFei, uint256 _amountTribe);

    // ----------- Genesis Group only state changing API -----------

    function deploy(Decimal.D256 calldata feiRatio) external;

    function swapFei(uint256 amountFei) external returns (uint256);

    // ----------- Governor only state changing API -----------

    function unlockLiquidity() external;

}
