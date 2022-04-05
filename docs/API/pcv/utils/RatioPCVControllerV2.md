## `RatioPCVControllerV2`

v2 includes methods for transferring approved ERC20 balances and wrapping and unwrapping WETH in transit




### `constructor(address _core)` (public)

PCV controller constructor




### `receive()` (external)





### `withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)` (public)

withdraw tokens from the input PCV deposit in basis points terms




### `withdrawRatioUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 basisPoints)` (public)

withdraw WETH from the input PCV deposit in basis points terms and send as ETH




### `withdrawRatioWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints)` (public)

withdraw ETH from the input PCV deposit in basis points terms and send as WETH




### `withdrawUnwrapWETH(contract IPCVDeposit pcvDeposit, address payable to, uint256 amount)` (public)

withdraw WETH from the input PCV deposit and send as ETH




### `withdrawWrapETH(contract IPCVDeposit pcvDeposit, address to, uint256 amount)` (public)

withdraw ETH from the input PCV deposit and send as WETH




### `withdrawRatioERC20(contract IPCVDeposit pcvDeposit, address token, address to, uint256 basisPoints)` (public)

withdraw a specific ERC20 token from the input PCV deposit in basis points terms




### `transferFromRatio(address from, contract IERC20 token, address to, uint256 basisPoints)` (public)

transfer a specific ERC20 token from the input PCV deposit in basis points terms




### `transferFrom(address from, contract IERC20 token, address to, uint256 amount)` (public)

transfer a specific ERC20 token from the input PCV deposit




### `transferETHAsWETH(address to)` (public)

send ETH as WETH




### `transferWETHAsETH(address payable to)` (public)

send WETH as ETH




### `transferERC20(contract IERC20 token, address to)` (public)

send away ERC20 held on this contract, to avoid having any stuck.




### `_withdrawRatio(contract IPCVDeposit pcvDeposit, address to, uint256 basisPoints) → uint256` (internal)





### `_transferETHAsWETH(address to, uint256 amount)` (internal)





### `_transferWETHAsETH(address payable to, uint256 amount)` (internal)








