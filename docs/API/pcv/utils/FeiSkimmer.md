## `FeiSkimmer`






### `constructor(address _core, contract IPCVDeposit _source, uint256 _threshold)` (public)

FEI Skimmer




### `skimEligible() → bool` (external)





### `skim()` (external)

skim FEI above the threshold from the source. Pausable. Requires skimEligible()



### `setThreshold(uint256 newThreshold)` (external)

set the threshold for FEI skims. Only Governor or Admin





### `ThresholdUpdate(uint256 newThreshold)`







