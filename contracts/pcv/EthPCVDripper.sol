pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
 
import "../refs/CoreRef.sol";
import "../utils/Timed.sol";

/// @title a PCV dripper
/// @author Fei Protocol
contract EthPCVDripper is CoreRef, Timed {
   using Address for address payable;
 
   /// @notice target address to drip to
   address public target;

   /// @notice amount to drip after each window
   uint256 public amountToDrip;

   event Dripped(uint256 amount);
   event Withdrawl(address indexed to, uint256 amount);

   /// @notice Uniswap PCV Deposit constructor
   /// @param _core Fei Core for reference
   constructor(
       address _core,
       address _target,
       uint256 _frequency,
       uint256 _amountToDrip
   ) public CoreRef(_core) Timed(_frequency) {
       target = _target;
       amountToDrip = _amountToDrip;

        // start timer
       _initTimed();
   }
 
   receive() external payable {}
 
   /// @notice withdraw ETH from the PCV dripper
   /// @param amount of tokens withdrawn
   /// @param to the address to send PCV to
   function withdrawETH(address to, uint256 amount)
       external
       onlyPCVController
   {
       payable(to).sendValue(amount);
       emit Withdrawl(to, amount);
   }
 
   /// @notice drip ETH to target
   function drip()
       external
       afterTime
       whenNotPaused
   {
       // reset timer
       _initTimed();

       // drip
       payable(target).sendValue(amountToDrip);
       emit Dripped(amountToDrip);
   }
}