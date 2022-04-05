## `StakingTokenWrapper`

Allows the TribalChief to distribute TRIBE to a beneficiary contract
The beneficiary is the sole holder of a dummy token staked in the TribalChief




### `constructor(contract ITribalChief _tribalChief, address _beneficiary)` (public)

constructor for the StakingTokenWrapper




### `init(uint256 _pid)` (external)

initialize the pool with this token as the sole staker




### `harvest()` (external)

send rewards to the beneficiary






