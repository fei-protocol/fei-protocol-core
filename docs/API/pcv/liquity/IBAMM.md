## `IBAMM`






### `fetchPrice() → uint256` (external)

returns ETH price scaled by 1e18



### `getSwapEthAmount(uint256 lusdQty) → uint256 ethAmount, uint256 feeEthAmount` (external)

returns amount of ETH received for an LUSD swap



### `LUSD() → contract IERC20` (external)

LUSD token address



### `SP() → contract IStabilityPool` (external)

Liquity Stability Pool Address



### `balanceOf(address account) → uint256` (external)

BAMM shares held by user



### `totalSupply() → uint256` (external)

total BAMM shares



### `bonus() → address` (external)

Reward token



### `deposit(uint256 lusdAmount)` (external)

deposit LUSD for shares in BAMM



### `withdraw(uint256 numShares)` (external)

withdraw shares  in BAMM for LUSD + ETH



### `transfer(address to, uint256 amount)` (external)

transfer shares



### `swap(uint256 lusdAmount, uint256 minEthReturn, address dest) → uint256` (external)

swap LUSD to ETH in BAMM






