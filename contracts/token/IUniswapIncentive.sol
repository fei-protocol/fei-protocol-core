pragma solidity ^0.6.2;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../external/Decimal.sol";

/// @title Uniswap trading incentive contract
/// @author Fei Protocol
/// @dev incentives are only appplied if the contract is appointed as a Minter or Burner, otherwise skipped
interface IUniswapIncentive is IIncentive {

	// ----------- Events -----------

    event TimeWeightUpdate(uint _weight, bool _active);

    event GrowthRateUpdate(uint _growthRate);

    event ExemptAddressUpdate(address indexed _account, bool _isExempt);

    event SellAllowedAddressUpdate(address indexed _account, bool _isSellAllowed);

	// ----------- Governor only state changing api -----------

	/// @notice set an address to be exempted from Uniswap trading incentives
	/// @param account the address to update
	/// @param isExempt a flag for whether to exempt or unexempt
 	function setExemptAddress(address account, bool isExempt) external;

	/// @notice set an address to be able to send tokens to Uniswap
	/// @param account the address to update
	/// @param isAllowed a flag for whether the account is allowed to sell or not
	function setSellAllowlisted(address account, bool isAllowed) external;

	/// @notice set the time weight growth function
	function setTimeWeightGrowth(uint32 growthRate) external;

	/// @notice sets all of the time weight parameters
	// @param blockNo the stored last block number of the time weight
	/// @param weight the stored last time weight
	/// @param growth the growth rate of the time weight per block
	/// @param active a flag signifying whether the time weight is currently growing or not
	function setTimeWeight(uint32 weight, uint32 growth, bool active) external;

	// ----------- Getters -----------

	/// @notice return true if burn incentive equals mint
	function isIncentiveParity() external view returns (bool);

	/// @notice returns true if account is marked as exempt
	function isExemptAddress(address account) external view returns (bool);

	/// @notice return true if the account is approved to sell to the Uniswap pool
	function isSellAllowlisted(address account) external view returns (bool);

	/// @notice the granularity of the time weight and growth rate
	// solhint-disable-next-line func-name-mixedcase
	function TIME_WEIGHT_GRANULARITY() external view returns(uint32);

	/// @notice the growth rate of the time weight per block
	function getGrowthRate() external view returns (uint32);

	/// @notice the time weight of the current block
	/// @dev factors in the stored block number and growth rate if active
	function getTimeWeight() external view returns (uint32);

	/// @notice returns true if time weight is active and growing at the growth rate
	function isTimeWeightActive() external view returns (bool);

	/// @notice get the incentive amount of a buy transfer
	/// @param amount the FEI size of the transfer
	/// @return incentive the FEI size of the mint incentive
	/// @return weight the time weight of thhe incentive
	/// @return initialDeviation the Decimal deviation from peg before a transfer
	/// @return finalDeviation the Decimal deviation from peg after a transfer
	/// @dev calculated based on a hypothetical buy, applies to any ERC20 FEI transfer from the pool
	function getBuyIncentive(uint amount) external view returns(
        uint incentive, 
        uint32 weight,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    );

	/// @notice get the burn amount of a sell transfer
	/// @param amount the FEI size of the transfer
	/// @return penalty the FEI size of the burn incentive
	/// @return initialDeviation the Decimal deviation from peg before a transfer
	/// @return finalDeviation the Decimal deviation from peg after a transfer
	/// @dev calculated based on a hypothetical sell, applies to any ERC20 FEI transfer to the pool
	function getSellPenalty(uint amount) external view returns(
        uint penalty, 
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    );
}
