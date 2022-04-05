## `OwnableTimedMinter`

A FeiTimedMinter that mints only when called by an owner




### `constructor(address _core, address _owner, uint256 _frequency, uint256 _initialMintAmount)` (public)

constructor for OwnableTimedMinter
        @param _core the Core address to reference
        @param _owner the minter and target to receive minted FEI
        @param _frequency the frequency buybacks happen
        @param _initialMintAmount the initial FEI amount to mint



### `mint()` (public)

triggers a minting of FEI by owner






