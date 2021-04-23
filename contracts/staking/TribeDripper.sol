pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
 
import "../refs/CoreRef.sol";
import "../utils/Timed.sol";

/// @title a Tribe dripper
/// @author Fei Protocol
contract TribeDripper is CoreRef, Timed {
 
   /// @notice target address to drip to
   address public target;

   /// @notice amount to drip after each window
   uint256[] public amountsToDrip;

   /// @notice index of the amount to drip
   uint256 public dripIndex;

   event Dripped(uint256 amount, uint256 dripIndex);
   event Withdrawal(address indexed to, uint256 amount);

   /// @notice Tribe Dripper constructor
   /// @param _core Fei Core for reference
   /// @param _target target address to receive TRIBE
   /// @param _frequency TRIBE drip frequency
   constructor(
       address _core,
       address _target,
       uint256 _frequency,
       uint256[] memory _amountsToDrip
   ) public CoreRef(_core) Timed(_frequency) {
       target = _target;
       amountsToDrip = _amountsToDrip;
   }
 
   receive() external payable {}
 
   /// @notice withdraw TRIBE from the Tribe dripper
   /// @param amount of tokens withdrawn
   /// @param to the address to send PCV to
   function withdraw(address to, uint256 amount)
       external
       onlyPCVController
   {
       tribe().transfer(to, amount);
       emit Withdrawal(to, amount);
   }
 
   /// @notice drip TRIBE to target
   function drip()
       external
       whenNotPaused
   {
       require(!isTimeStarted() || isTimeEnded(), "TribeDripper: time not ended");

       // reset timer
       _initTimed();

       uint256 currentDripIndex = dripIndex;
       require(currentDripIndex < amountsToDrip.length, "TribeDripper: index out of bounds");
       
       uint256 amountToDrip = amountsToDrip[currentDripIndex];
       dripIndex = currentDripIndex + 1;

       // drip
       tribe().transfer(target, amountToDrip);
       emit Dripped(amountToDrip, currentDripIndex);
   }
}