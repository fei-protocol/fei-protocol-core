## `TokemakPCVDepositBase`






### `constructor(address _core, address _pool, address _rewards)` (internal)

Tokemak PCV Deposit constructor




### `balance() → uint256` (public)

returns total balance of PCV in the Deposit excluding the FEI



### `balanceReportedIn() → address` (public)

display the related token of the balance reported



### `requestWithdrawal(uint256 amountUnderlying)` (external)

request to withdraw a given amount of tokens to Tokemak. These
tokens will be available for withdraw in the next cycles.
This function can be called by the contract admin, e.g. the OA multisig,
in anticipation of the execution of a DAO proposal that will call withdraw().


note that withdraw() calls will revert if this function has not been
called before.


### `claimRewards(uint256 cycle, uint256 amount, uint8 v, bytes32 r, bytes32 s)` (external)

For an example of IPFS json file, see :




### `ClaimRewards(address _caller, address _token, address _to, uint256 _amount)`

event generated when rewards are claimed



### `RequestWithdrawal(address _caller, address _to, uint256 _amount)`

event generated when a withdrawal is requested





