## `PCVEquityMinter`

A FeiTimedMinter that mints based on a percentage of PCV equity




### `constructor(address _core, address _target, uint256 _incentive, uint256 _frequency, contract ICollateralizationOracle _collateralizationOracle, uint256 _aprBasisPoints, uint256 _maxAPRBasisPoints, uint256 _feiMintingLimitPerSecond)` (public)

constructor for PCVEquityMinter
        @param _core the Core address to reference
        @param _target the target to receive minted FEI
        @param _incentive the incentive amount for calling buy paid in FEI
        @param _frequency the frequency buybacks happen
        @param _collateralizationOracle the collateralization oracle used for PCV equity calculations
        @param _aprBasisPoints the APR paid out from pcv equity per year expressed in basis points



### `mint()` (public)

triggers a minting of FEI based on the PCV equity



### `mintAmount() → uint256` (public)





### `setCollateralizationOracle(contract ICollateralizationOracle newCollateralizationOracle)` (external)

set the collateralization oracle



### `setAPRBasisPoints(uint256 newAprBasisPoints)` (external)

sets the new APR for determining buyback size from PCV equity



### `_setAPRBasisPoints(uint256 newAprBasisPoints)` (internal)





### `_setCollateralizationOracle(contract ICollateralizationOracle newCollateralizationOracle)` (internal)





### `_afterMint()` (internal)








