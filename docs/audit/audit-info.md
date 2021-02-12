# Audit-Info

## Long Term Strategy

I hope to have Fei Protocol achieve full decentralization both technically and practically as soon as prudently possible. I also value security and auditing as a top priority. For this reason we are launching with a fully implemented DAO and a near quorum voting capacity with the ratio of dev controlled TRIBE decreasing quickly. The company behind the protocol will be willing to pay audit costs for both team generated and community generated code as long as we maintain the ability to do so.

We hope to do incremental upgrades via governance. Each critical change should be audited if possible. We will have multiple audit firm relationships. We are hoping to have the auditors who work on Fei Protocol in an ongoing relationship for both formal and informal auditing that can be compensated by the DAO or by the company. This is obviously only to the extent you have interest and availability.

## Risk Model

Fei Protocol has a unique mechanism which leads to interesting dynamics from the perspective of Risk assessment and auditing. Here I highlight some of the risks I notice and care particularly about. I also detail bugs I've found and hopefully avoided in the code.

### Custodied Funds

A benefit of FEI protocol from the perspective of attack surfaces is that core functionality doesn't rely on custodied funds. However there are some components which do custody funds and these need to be preserved from attack

#### User custodied funds

[FeiPool](https://github.com/fei-protocol/fei-protocol-core/wiki/FeiPool) holds both a staked asset and reward asset for users

[GenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/GenesisGroup) holds user ETH pre-genesis and TRIBE/FEI rewards post genesis

#### Admin controlled funds

[LinearTokenTimelock](https://github.com/fei-protocol/fei-protocol-core/wiki/LinearTokenTimelock) are responsible for holding admin TRIBE and IDO LP tokens. It should not be possible for the beneficiary to get tokens out from this contract early, not any other actor to get the tokens.

#### Protocol controlled funds

[UniswapPCVDeposit](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapPCVDeposit) holds protocol PCV

[Core](https://github.com/fei-protocol/fei-protocol-core/wiki/Core) acts as a TRIBE treasury

### Reentrancy

Reentrancy can be an issue in at least the following two ways. It can mess with incentive calculations or it can allow users to siphon excess funds from custody.

#### Incentive reentrancy

The [UniswapIncentive](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapIncentive) contract should be called from within ANY transfer to the ETH/FEI uniswap pool. It should not be possible to circumvent this requirement. Any transfer should be treated as a buy or sell and implement the expected mint or burn of the transfer. A bug I didn't originally catch would be to send multiple transfer calls of FEI to Uniswap before swapping to execute the sell. Since the reserves only update after each swap, the sequential transfers would all be underpenalized at the rate of a small sell. I changed the code to take the max of the FEI balance and reserve [here](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/refs/UniRef.sol#L54-L57) to make each subsequent transfer stack the penalty regardless of the true reserves. This has implications for flash swaps which would potentially break the model somehow. Please help me make sure flash swaps or any other creative interaction with Uniswap could be used to game the incentives. I recommend going deep on the [uniswap pair contract](https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol) if not familiar.

#### Custody Reentrancy

Some functions to evaluate here are [Genesis redeem](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/GenesisGroup.sol#L89), [pool claim](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol#L40), and [pool withdraw](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/pool/Pool.sol#L52). I believe since I am using ERC-20s here and that I do check-effect-interaction there shouldn't be any issues but if I need to add a reentrancy guard I will.

### Compulsory Redemption/Deposit

For any deposit or redeem flows, it should not be possible for an actor to force users in or out of a contract without explicit ERC-20 approval.

### Oracles

We use two oracles within the protocol. The [UniswapOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/UniswapOracle) should report the TWAP and have appropriate accuracy/manipulation resistance tradeoffs. It should only be used for the bonding curve at launch, but post scale/thawing will be swapped in everywhere to save on gas. Please comment on the use of 10min USDC/ETH Uniswap TWAP choice and verify accuracy of the mechanism. The [BondingCurveOracle](https://github.com/fei-protocol/fei-protocol-core/wiki/BondingCurveOracle) should be used for reweighting and incentivizing trading as we want the price to be in sync with bonding curve + thawing.

### Access Control

[Core](https://github.com/fei-protocol/fei-protocol-core/wiki/Core) and [Permissions](https://github.com/fei-protocol/fei-protocol-core/wiki/Permissions) used for access control are the most critical functionality to evaluate for both the security and long term upgradeability of the protocol. It should not be possible to acquire any role without going through a Governor, nor to abuse the existing functionality of any role including Minter, Burner, PCVController, or Reweight beyond the intended scope outlined in the documentation.

### Math errors

It goes without saying that formula accuracy, over/underflow protection and safe casting should all hold for any reasonable volume. I encountered a bug where at reasonable scale ~100k ETH the 2/3 root function in [Roots](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/utils/Roots.sol) was off by a factor of 10. This was highly concerning and I had to flip the order of the squaring and cube root which reduced the error to a tiny margin.

### Minimal Concern

Any contracts in [external](https://github.com/fei-protocol/fei-protocol-core/tree/master/contracts/external) are practically or literally forked from other audited code \(dydx + OpenZeppelin\).

Likewise the contracts in [dao](https://github.com/fei-protocol/fei-protocol-core/tree/master/contracts/dao) except TimelockedDelegator are forked from Compound with minimal changes.

Lastly the smaller uint safeMath contracts in [utils](https://github.com/fei-protocol/fei-protocol-core/tree/master/contracts/utils) are close to the OZ SafeMath implementation but should be spot checked for accuracy.

