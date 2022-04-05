## `TribeMinter`






### `constructor(address _core, uint256 _annualMaxInflationBasisPoints, address _owner, address _tribeTreasury, address _tribeRewardsDripper)` (public)

Tribe Reserve Stabilizer constructor




### `poke()` (public)

update the rate limit per second and buffer cap



### `setRateLimitPerSecond(uint256)` (external)



no-op, reverts. Prevent admin or governor from overwriting ideal rate limit

### `setBufferCap(uint256)` (external)



no-op, reverts. Prevent admin or governor from overwriting ideal buffer cap

### `mint(address to, uint256 amount)` (external)

mints TRIBE to the target address, subject to rate limit




### `setTribeTreasury(address newTribeTreasury)` (external)

sets the new TRIBE treasury address



### `setTribeRewardsDripper(address newTribeRewardsDripper)` (external)

sets the new TRIBE treasury rewards dripper



### `setMinter(address newMinter)` (external)

changes the TRIBE minter address




### `setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)` (external)

sets the max annual inflation relative to current supply




### `idealBufferCap() → uint256` (public)

return the ideal buffer cap based on TRIBE circulating supply



### `tribeCirculatingSupply() → uint256` (public)

return the TRIBE supply, subtracting locked TRIBE



### `totalSupply() → uint256` (public)

alias for tribeCirculatingSupply


for compatibility with ERC-20 standard for off-chain 3rd party sites

### `isPokeNeeded() → bool` (external)

return whether a poke is needed or not i.e. is buffer cap != ideal cap



### `_mint(address to, uint256 amount)` (internal)





### `_setAnnualMaxInflationBasisPoints(uint256 newAnnualMaxInflationBasisPoints)` (internal)








