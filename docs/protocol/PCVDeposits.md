# PCV Deposits

The PCV Deposit is a standard interface implemented across the FEI protocol codebase.

A PCV Deposit is a contract that hold funds on behalf of the protocol. There are multiple types (implementations) of PCV Deposits, and each type of PCV Deposit can be instanciated multiple times on-chain. Collectively, all the funds deposited across various PCV Deposits constitute the [Protocol Controlled Value](PCVManagement.md).

For instance, an `ERC20CompoundPCVDeposit` ([link]([aaaa](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/pcv/compound/ERC20CompoundPCVDeposit.sol))) can deposit and withdraw a given `token` to and from a given `cToken` (Compound protocol interest-bearing deposit token). There are multiple on-chain deployments of the `ERC20CompoundPCVDeposit`, such as the DAI Compound PCVDeposit, that deposits DAI on Compound, or the FEI Fuse Pool 8 PCVDeposit, that deposits FEI in Fuse pool 8.

A PCV Deposit manages only one type of token, and if additional tokens are available on the deposit (e.g. COMP rewards earned by the DAI Compound PCVDeposit), they are ignored in accounting and can't be used, so should probably be moved somewhere else.

## Interface
The following methods must be implemented on all PCV Deposits :

```sol
// Accounting
function balanceReportedIn() external view returns (address);
function balance() external view returns (uint256);
function resistantBalanceAndFei() external view returns (uint256, uint256);

// Enter / Exit
function deposit() external;
function withdraw(address to, uint256 amount) external;

// Movements 
function withdrawERC20(address token, address to, uint256 amount) external;
function withdrawETH(address payable to, uint256 amount) external;
```

**Accounting**

The methods `balanceReportedIn()`, `balance()`, and `resistantBalanceAndFei()` are used for accounting and compatibility. These `view` methods are used in the [Collateralization](Collateralization.md) Oracle to determine the aggregated amount of PCV and FEI the protocol controls.

`balanceReportedIn()` is the address of the token managed & reported by a deposit.

`balance()` reports the instantaneous balance of a PCVDeposit. The instantaneous balance can be subject to in-block atomic manipulations (e.g. using flashloans).

`resistantBalanceAndFei()` reports the manipulation-resistant balance of a PCVDeposit, as well as the protocol-owned FEI controlled by the contract. This method is often based on "ideal balances" computed using Oracle prices, and not reading the actual balances in the current block.

**Enter / Exit**

The `deposit()` method is called after tokens have been sent to the PCV Deposit to deploy those tokens into the "strategy" implemented by the contract.

The `withdraw()` method is called by a [PCV Controller](AccessControl.md) to withdraw tokens from the "strategy" implemented by the contract.

The `withdrawERC20()` method is called by a PCV Controller to withdraw ERC20 tokens held in the PCV Deposit.

**Movements**

The `withdrawETH()` and `withdrawERC20()` methods are called by a [PCV Controller](AccessControl.md) to send the ETH and ERC20 held on the PCV Deposit somewhere else. 

These methods can move any tokens, and not just the token used in accounting by the PCV Deposit, so they can be used for instance to move rewards earned by the contract (e.g. CRV and CVX earned by a Convex PCVDeposit).

These methods can also be used to move the receipt tokens of a deposit to another contract: for instance,  `deposit()` on a Curve PCVDeposit, and then `withdrawERC20()` the Curve LP tokens to another Convex PCVDeposit that will stake these Curve LP tokens inside Convex. Some PCV Deposits are meant to hold funds over the long term, and some are meant to be used in a transitory manner, to enter or exit a yield strategy / liquidity pool.
