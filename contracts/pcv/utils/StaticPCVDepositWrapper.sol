pragma solidity ^0.8.4;

import "../IPCVDepositBalances.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";

/**
  @notice a contract to report static PCV data to cover PCV not held with a reliable oracle or on-chain reading 
  @author Fei Protocol

  Returns PCV in USD terms
*/
contract StaticPCVDepositWrapper is IPCVDepositBalances, CoreRef {
   
    // -------------- Events ---------------
    event BalanceUpdate(uint256 oldBalance, uint256 newBalance);

    event FeiBalanceUpdate(uint256 oldFeiBalance, uint256 newFeiBalance);

    /// @notice the PCV balance
    uint256 public override balance;

    /// @notice the reported FEI balance
    uint256 public feiReportBalance;

    constructor(address _core, uint256 _balance, uint256 _feiBalance) CoreRef(_core) {
        balance = _balance;
        feiReportBalance = _feiBalance;
    }

    /// @notice set the PCV balance
    function setBalance(uint256 newBalance) external onlyGovernor {
        uint256 oldBalance = balance;
        balance = newBalance;
        emit BalanceUpdate(oldBalance, newBalance);
    }

    /// @notice set the protocol owned FEI amount
    function setFeiReportBalance(uint256 newFeiBalance) external onlyGovernor {
        uint256 oldFeiBalance = feiReportBalance;
        feiReportBalance = newFeiBalance;
        emit BalanceUpdate(oldFeiBalance, newFeiBalance);
    }

    /// @notice returns the resistant balance and FEI in the deposit
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        return (balance, feiReportBalance);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public pure override returns (address) {
        return Constants.USD;
    }
}