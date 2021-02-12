# Goals
Goal of this audit to:
1. Have a second set of eyes on critical contracts
2. Focus on changes out of scope for primary OpenZeppelin audit
3. Build relationship and familiarity with Fei with ConsenSys auditors for future incremental work

## Commit hash
[ff892c5d](https://github.com/fei-protocol/fei-protocol-core/tree/ff892c5d0b9697f249d713bbb2b3bd1da7980ed2)

## Files in scope
* contracts/genesis/*.sol
* contracts/router/*.sol

If time: spot check changes in [this PR](https://github.com/fei-protocol/fei-protocol-core/pull/9/files) for the files:
* contracts/token/UniswapIncentive.sol
* contracts/token/IUniswapIncentive.sol
* contracts/pool/Pool.sol
* contracts/bondingcurve/EthBondingCurve.sol

## Key risks to mitigate
### Pool subsidized sell
* any sender contract into the FEI/ETH Uniswap Pool pays the burn
* If someone can "withdraw" from a pool with other people's FEI they can have the pool subsidize their sell
* to mitigate this, I added an allowlist for any tx into the uniswap pool, including the FeiRouter and some internal contracts

Please verify that:
* the FeiRouter cannot be used to maliciously have pool subsidized burns unless the possibility is "opted into" via a contract approving router transfers
* No one can LP the FEI/ETH pool

### Bricked/Insecure Genesis Launch
The Genesis Group should have the following properties:
* `launch()` can't be stuck in a bad state such that it fails each time
* `emergencyExit()` allows everyone to get back the entire amount of ETH they put in if the above is somehow broken
* `commit()` has the desired effect of taking the FEI earned pro-rata and purchasing TRIBE with it on the IDO offering
* `redeem()` will succeed regardless of the breakdown of committed/non-committed with the appropriate FEI/TRIBE returned

## Abstractions
Dependencies on files not in scope should be abstracted from the audit unless there is time to dive deeper in which case I can help prioritize.

### Routers
UniswapSingleEthRouter is self contained and is modeled after the [Uniswap Router](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol) functions of the same name.

The FeiRouter depends on UniswapIncentive.sol. Assume:
* `updateOracle()` cannot fail and doesn't affect functionality
* `getBuyIncentive()` and `getSellPenalty()` return the appropriate reward and penalty respectively with no side effects

The FeiRouter is also allowed to send FEI to the FEI/ETH uniswap pool where most contracts are blocked.

### GenesisGroup
Dependency web is more complex here but will try to simplify. 

`IDO` depends on `UniRef` (and by extension `OracleRef` and `CoreRef`) and the `LinearTokenTimelock`. You can make the following assumptions:
* `setLockedToken(_pair)` only affects the `LinearTokenTimelock` functionality
* `tribeBalance()` (CoreRef) returns the TRIBE balance of the contract.
* `_mintFei()` (CoreRef) mints FEI to the contract itself
* `router` (UniRef) returns the standard [Uniswap Router](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/UniswapV2Router02.sol)
* `getReserves()` (UniRef) returns the fei and tribe Uniswap pair reserves of the referenced pair in that order.
* `fei()` returns the Fei.sol contract 
* `pair` (UniRef) returns the FEI/TRIBE Uniswap pair contract
* `onlyGenesisGroup` (CoreRef) is a modifier that only allows the GenesisGroup contract to execute the function

`GenesisGroup` depends on `CoreRef` and `Timed` in our code base as well as the OpenZeppelin `ERC20` and `ERC20Burnable`. Assume:
* The contract starts out with a TRIBE balance to be split pro rata by FGEN holders (including committed)
* no external call fails (except ido calls which are in scope)
* `bondingcurve.purchase()` nets the contract FEI at the cost of all of its ETH
* `feiBalance()` and `tribeBalance()` (CoreRef) return the FEI and TRIBE balance of the contract, respectively
* `_initTimed()` (Timed) starts the window of `_duration` seconds after which `isTimeEnded()` returns true.
* `postGenesis` (CoreRef) is a modifier that means the GenesisGroup `launch()` method must have already been called to use the function
