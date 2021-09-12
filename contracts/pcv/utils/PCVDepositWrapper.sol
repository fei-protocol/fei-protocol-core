pragma solidity ^0.8.4;

import "../IPCVDepositBalances.sol";

/**
  @notice a lightweight contract to wrap old PCV deposits to use the new interface 
  @author Fei Protocol
  When upgrading the PCVDeposit interface, there are many old contracts which do not support it.
  The main use case for the new interface is to add read methods for the Collateralization Oracle.
  Most PCVDeposits resistant balance method is simply returning the balance as a pass-through
  If the PCVDeposit holds FEI it may be considered as protocol FEI

  This wrapper can be used in the CR oracle which reduces the number of contract upgrades and reduces the complexity and risk of the upgrade
*/
contract PCVDepositWrapper is IPCVDepositBalances {
   
    /// @notice the referenced PCV Deposit
    IPCVDepositBalances public pcvDeposit;

    /// @notice the balance reported in token
    address public token;

    /// @notice a flag for whether to report the balance as protocol owned FEI
    bool public isProtocolFeiDeposit;

    constructor(IPCVDepositBalances _pcvDeposit, address _token, bool _isProtocolFeiDeposit) {
        pcvDeposit = _pcvDeposit;
        token = _token;
        isProtocolFeiDeposit = _isProtocolFeiDeposit;
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return pcvDeposit.balance();
    }

    /// @notice returns the resistant balance and FEI in the deposit
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256 resistantBalance = balance();
        uint256 reistantFei = isProtocolFeiDeposit ? resistantBalance : 0;
        return (resistantBalance, reistantFei);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return token;
    }
}