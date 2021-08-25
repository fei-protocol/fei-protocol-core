pragma solidity ^0.8.4;

import "./../PCVDeposit.sol";
import "./../../utils/Timed.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract ERC20Dripper is PCVDeposit, Timed, Initializable {
   using Address for address payable;
 
   /// @notice target address to drip tokens to
   address public target;
   address public token;

   /// @notice amount to drip after each window
   uint256 public amountToDrip;

   event Dripped(uint256 amount);
   event Withdrawal(address indexed to, uint256 amount);

   /// @notice ERC20 PCV Dripper constructor
   /// @param _core Fei Core for reference
   /// @param _target address to drip to
   /// @param _frequency frequency of dripping
   /// @param _amountToDrip amount to drip on each drip
   /// @param _token amount to drip on each drip
   constructor(
       address _core,
       address _target,
       uint256 _frequency,
       uint256 _amountToDrip,
       address _token
   ) CoreRef(_core) Timed(_frequency) {
       require(_target != address(0), "INV_ADDR");
       require(_token != address(0), "INV_TOKEN_ADDR");
       require(_amountToDrip > 0, "INV_DRIP");

       target = _target;
       amountToDrip = _amountToDrip;
       token = _token;

       // start timer
       _initTimed();
   }

   /// @notice drip ERC20 tokens to target for the first time
   /// only callable once, and should be called immediately after construction
   function init() external initializer {
       _drip();
   }
 
   /// @notice drip ERC20 tokens to target
   function drip()
       external
       afterTime
       whenNotPaused
   {
       _drip();
   }

   /// @notice private helper function to drip tokens to the target
   function _drip() private {
       // reset timer
       _initTimed();

       // drip
       _withdrawERC20(token, target, amountToDrip);
       emit Dripped(amountToDrip);
   }


    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
    {
        _withdrawERC20(address(token), to, amountUnderlying);
    }

    /// @notice no-op
    function deposit() external override {}

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}