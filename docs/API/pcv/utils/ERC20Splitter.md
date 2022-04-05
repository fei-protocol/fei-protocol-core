## `ERC20Splitter`

a contract to split token held to multiple locations




### `constructor(address _core, contract IERC20 _token, address[] _pcvDeposits, uint256[] _ratios)` (public)

constructor for ERC20Splitter
        @param _core the Core address to reference
        @param _token the ERC20 token instance to split
        @param _pcvDeposits the locations to send tokens
        @param _ratios the relative ratios of how much tokens to send each location, in basis points



### `allocate()` (external)

distribute held TRIBE



### `_allocateSingle(uint256 amount, address pcvDeposit)` (internal)








