# Protocol Controlled Value (PCV) Deposits

The PCV Deposit is a standard interface implemented across the FEI protocol codebase. The following methods must be implemented on all PCV Deposits.

    function deposit() external;

    function withdraw(address to, uint256 amount) external;

    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external;

    function withdrawETH(address payable to, uint256 amount) external;

    function balance() external view returns (uint256);

    function balanceReportedIn() external view returns (address);

    function resistantBalanceAndFei() external view returns (uint256, uint256);

A PCV Deposit is a contract that holds PCV on behalf of the protocol. PCV Deposits must expose standard getter methods for protocol accounting and compatibility. These methods are `balance()`, `balanceReportedIn()` and `resistantBalanceAndFei()`. These getter methods are used in the collateralization oracle to determine the amount of PCV the FEI protocol controls.

The `deposit()` method is called after tokens have been sent to the PCV Deposit to put those tokens into the target contract.

The `withdraw()` method is called by a PCV Controller to withdraw tokens from the target contract.

The `withdrawERC20()` method is called by a PCV Controller to withdraw ERC20 tokens held in the PCV Deposit.

The `withdrawETH()` method is called by a PCV Controller to withdraw eth held in the PCV Deposit.

Examples of PCV Deposits include the Peg Stability Module and ERC20PCVDeposits.
