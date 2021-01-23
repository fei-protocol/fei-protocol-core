pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../external/Decimal.sol";

/// @title an initial DeFi offering for the TRIBE token
/// @author Fei Protocol
interface IDOInterface {

	// ----------- Events -----------

	event Deploy(uint _amountFei, uint _amountTribe);

	// ----------- Genesis Group only state changing API -----------

    /// @notice deploys all held TRIBE on Uniswap at the given ratio
    /// @param feiRatio the exchange rate for FEI/TRIBE
    /// @dev the contract will mint any FEI necessary to do the listing. Assumes no existing LP
	function deploy(Decimal.D256 calldata feiRatio) external;

	/// @notice swaps Genesis Group FEI on Uniswap For TRIBE
	/// @param amountFei the amount of FEI to swap
	/// @return uint amount of TRIBE sent to Genesis Group
	function swapFei(uint amountFei) external returns(uint);
}
