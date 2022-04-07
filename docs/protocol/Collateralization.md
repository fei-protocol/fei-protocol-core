# Collateralization

The "collateralization" is the ratio between the [Protocol Controlled Value](PCVManagement.md) and the User-Circulating FEI (FEI tokens that are not held by the protocol's [PCV Deposits](PCVDeposits.md)). It represents the dollar-value of assets held in the protocol, that can be used to back the FEI in circulation at 1$.

The Collateralization Ratio is expressed as a percentage, for instance if 100$ of assets are held in the protocol (PCV), and there are 50 User-Circulating FEI, the Collateralization Ratio is 200%.

The [Collateralization Oracle]([aaaa](https://github.com/fei-protocol/fei-protocol-core/blob/develop/contracts/oracle/collateralization/CollateralizationOracle.sol)) is a contract [deployed on-chain](https://etherscan.io/address/0xFF6f59333cfD8f4Ebc14aD0a0E181a83e655d257) that reports the list of token addresses of each asset held in the PCV `getTokensInPcv()`, and for each token address, the list of PCV Deposits that hold it `getDepositsForToken(address)`. The oracle also holds a mapping of token to oracle `tokenToOracle(address)` to know the "asset to USD" conversion for each of the PCV assets. A helper method `pcvStats()` is present and returns the PCV, user-circulating FEI (defined as FEI `totalSupply()` minus FEI held by PCV Deposits), PCV Equity (PCV minus user-circulating FEI), and a validity status.

In the CR Oracle, a special token address `0x1111...` is used to represent "USD". This is used for instance for LP tokens of stableswaps (like Curve) where the amount of stablecoins owned is known, but not the percent of each of the underlying stablecoins.

By convention, FEI deposited in lending markets is reported as both PCV asset worth 0$, and protocol-owned FEI (to be deduced from circulating supply).

Reading the CR Oracle on-chain is very expensive, and should only be used in extreme situations. For instance, when Collateralization drops below 100%, the protocol can trigger backstop mechanisms to drain the amount of FEI in circulation & restore the CR above 100%.
