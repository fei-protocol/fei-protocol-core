pragma solidity ^0.8.4;

import "../IPCVDepositBalances.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
  @notice a lightweight contract to wrap ERC20 holding PCV contracts
  @author Fei Protocol
  When upgrading the PCVDeposit interface, there are many old contracts which do not support it.
  The main use case for the new interface is to add read methods for the Collateralization Oracle.
  Most PCVDeposits resistant balance method is simply returning the balance as a pass-through
  If the PCVDeposit holds FEI it may be considered as protocol FEI

  This wrapper can be used in the CR oracle which reduces the number of contract upgrades and reduces the complexity and risk of the upgrade
*/
contract ERC20PCVDepositWrapper is IPCVDepositBalances {
    /// @notice the referenced token deposit
    address public tokenDeposit;

    /// @notice the balance reported in token
    IERC20 public token;

    /// @notice a flag for whether to report the balance as protocol owned FEI
    bool public isProtocolFeiDeposit;

    constructor(
        address _tokenDeposit,
        IERC20 _token,
        bool _isProtocolFeiDeposit
    ) {
        tokenDeposit = _tokenDeposit;
        token = _token;
        isProtocolFeiDeposit = _isProtocolFeiDeposit;
    }

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return token.balanceOf(tokenDeposit);
    }

    /// @notice returns the resistant balance and FEI in the deposit
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256 resistantBalance = balance();
        uint256 reistantFei = isProtocolFeiDeposit ? resistantBalance : 0;
        return (resistantBalance, reistantFei);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }
}
