pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/Decimal.sol";

/// @title Equal access to the first bonding curve transaction
/// @author Fei Protocol
interface IGenesisGroup {
	// ----------- Events -----------

	event Purchase(address indexed _to, uint _value);

	event Redeem(address indexed _to, uint _amountIn, uint _amountFei, uint _amountTribe);

    event Commit(address indexed _from, address indexed _to, uint _amount);

	event Launch(uint _timestamp);

    // ----------- State changing API -----------

    /// @notice allows for entry into the Genesis Group via ETH. Only callable during Genesis Period.
    /// @param to address to send FGEN Genesis tokens to
    /// @param value amount of ETH to deposit
    function purchase(address to, uint value) external payable;

    /// @notice redeem FGEN genesis tokens for FEI and TRIBE. Only callable post launch
    /// @param to address to send redeemed FEI and TRIBE to.
    function redeem(address to) external;

    /// @notice commit Genesis FEI to purchase TRIBE in DEX offering
    /// @param from address to source FGEN Genesis shares from
    /// @param to address to earn TRIBE and redeem post launch
    /// @param amount of FGEN Genesis shares to commit
    function commit(address from, address to, uint amount) external;

    /// @notice launch Fei Protocol. Callable once Genesis Period has ended or the max price has been reached
    function launch() external;


    // ----------- Getters -----------

    /// @notice calculate amount of FEI and TRIBE received if the Genesis Group ended now.
    /// @param amountIn amount of FGEN held or equivalently amount of ETH purchasing with
    /// @param inclusive if true, assumes the `amountIn` is part of the existing FGEN supply. Set to false to simulate a new purchase.
    /// @return feiAmount the amount of FEI received by the user
    /// @return tribeAmount the amount of TRIBE received by the user
    function getAmountOut(uint amountIn, bool inclusive) external view returns (uint feiAmount, uint tribeAmount);

    /// @notice check whether GenesisGroup has reached max FEI price. Sufficient condition for launch
    function isAtMaxPrice() external view returns(bool);
}