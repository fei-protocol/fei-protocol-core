## `PCVSplitter`






### `constructor(address[] _pcvDeposits, uint256[] _ratios)` (internal)

PCVSplitter constructor




### `checkAllocation(address[] _pcvDeposits, uint256[] _ratios)` (public)

make sure an allocation has matching lengths and totals the ALLOCATION_GRANULARITY




### `getAllocation() → address[], uint256[]` (public)

gets the pcvDeposits and ratios of the splitter



### `setAllocation(address[] _allocations, uint256[] _ratios)` (external)

sets the allocation of held PCV



### `_allocateSingle(uint256 amount, address pcvDeposit)` (internal)

distribute funds to single PCV deposit




### `_setAllocation(address[] _pcvDeposits, uint256[] _ratios)` (internal)

sets a new allocation for the splitter




### `_allocate(uint256 total)` (internal)

distribute funds to all pcv deposits at specified allocation ratios





### `AllocationUpdate(address[] oldPCVDeposits, uint256[] oldRatios, address[] newPCVDeposits, uint256[] newRatios)`





### `Allocate(address caller, uint256 amount)`







