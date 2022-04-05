## `FeiTimedMinter`

a contract which mints FEI to a target address on a timed cadence




### `constructor(address _core, address _target, uint256 _incentive, uint256 _frequency, uint256 _initialMintAmount)` (public)

constructor for FeiTimedMinter
        @param _core the Core address to reference
        @param _target the target for minted FEI
        @param _incentive the incentive amount for calling mint paid in FEI
        @param _frequency the frequency minting happens
        @param _initialMintAmount the initial FEI amount to mint



### `mint()` (public)

triggers a minting of FEI


timed and incentivized

### `mintAmount() → uint256` (public)





### `setTarget(address newTarget)` (external)

set the new FEI target



### `setFrequency(uint256 newFrequency)` (external)

set the mint frequency



### `setMintAmount(uint256 newMintAmount)` (external)





### `_setTarget(address newTarget)` (internal)





### `_setMintAmount(uint256 newMintAmount)` (internal)





### `_mintFei(address to, uint256 amountIn)` (internal)





### `_afterMint()` (internal)








