pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

/// @title an initial DeFi offering for the TRIBE token
/// @author Fei Protocol
interface IDOInterface {

    /// @notice deploys all held TRIBE on Uniswap at the given ratio. Only callable by GenesisGroup
    /// @param feiRatio the exchange rate for FEI/TRIBE
    /// @dev the contract will mint any FEI necessary to do the listing. Assumes no existing LP
	function deploy(Decimal.D256 calldata feiRatio) external;
}
