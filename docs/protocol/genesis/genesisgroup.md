# GenesisGroup

## Contract

[GenesisGroup.sol](https://github.com/fei-protocol/fei-protocol-core/blob/master/contracts/genesis/GenesisGroup.sol) implements [IGenesisGroup](https://github.com/fei-protocol/fei-protocol-core/wiki/IGenesisGroup), [CoreRef](https://github.com/fei-protocol/fei-protocol-core/wiki/CoreRef), [ERC20](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20), [ERC20Burnable](https://docs.openzeppelin.com/contracts/3.x/api/token/erc20#ERC20Burnable), [Timed](https://github.com/fei-protocol/fei-protocol-core/wiki/Timed)

## Description

The Genesis Group Contract is responsible for launching Fei Protocol. It allows for pro rata access to the first bonding curve transaction, and includes a TRIBE distribution.

## Implementation

The Genesis Group is managed by an ERC 20 called FGEN.

### Purchasing

Users can purchase into the Genesis Group with ETH and receive FGEN minted from the contract 1:1. Purchasing should only be available during the Genesis Period and not after. The Genesis Period is a time window of 3 days from the contract deployment. It has an early completion condition of reaching a certain max FEI price discussed below.

The contract exposes a method for calculating how much FEI and TRIBE a user would receive if the GenesisGroup were to close at that moment. This could be calculated for a hypothetical purchase as well.

### Pre-Commitment

Users can pre-commit their Genesis FEI to participate in the initial DEX offering of TRIBE on Uniswap. This can only be done during the Genesis Period.

When a user pre-commits, their FGEN is burned. This makes it a one-way action. Users can decide how much of their FGEN they want to commit, if any. At redemption time, both the held FGEN and pre-committed balance are used to determine ownership of the Genesis Group TRIBE \(the non-IDO TRIBE allocated to Genesis Group\). Only the held FGEN is used for determining FEI ownership, because the pre-commited FGEN FEI allocation was used to buy TRIBE. Of the IDO TRIBE allocation, users get the pro-rata percentage of their pre-committed FGEN over all of the pre-committed FGEN.

### Launch

The critical functionality that the GenesisGroup is responsible for is launching Fei Protocol. Launching is only open at the end of the Genesis Period. The following actions happen at launch:

* Mark Genesis Group as completed in Core \(for other contracts to reference\)
* Appointing the GovernorAlpha Timelock as a Governor to unlock the DAO \(otherwise dev TRIBE could vote monopolistically during Genesis Period\)
* Initializing the BondingCurveOracle price for thawing
* Making the first bonding curve purchase of FEI with all held ETH. \(needs to happen after oracle init so the FEI is deployed at right ratio on Uniswap\)
* Initialize the FEI/TRIBE staking pool
* Deploy the IDO FEI/TRIBE funds to Uniswap.

There is a max price associated with the GenesisGroup which is an early completion condition. If the average price of FEI in dollars reaches this amount, set to $.90, then the GenesisGroup can launch even if the period has not ended. It is calculated by dividing the dollar amount of incoming ETH by the total amount of FEI issued.

The Genesis Group sets the initial exchange rate of the IDO. This number is set by dividing the amount of FEI by the amount of TRIBE held by the contract after the bonding curve purchase. It then takes in an additional preset scaling factor initially set to 10. This should set the fully diluted TRIBE market cap to ~1x the incoming ETH PCV at Genesis.

The Genesis Group also initializes the BondingCurveOracle to the average price of the FEI at genesis.

### Redemption

Post launch, users can redeem their FGEN for a pro rata share of the FEI purchased on the bonding curve and the Genesis TRIBE allocation. Any contract can redeem on behalf of a user if they have FGEN approval. Redemptions must be for the entire held balance of FGEN.

Note emergency escape is out of scope for OpenZeppelin audit. There is an emergency escape embedded within the Genesis Group contract that allows FGEN \(and committed FGEN\) to redeem for ETH 1:1 3 days AFTER the Genesis Group ends. This is intended only for the scenario where the launch functionality is bricked as a way for users to get their ETH back. This method is `emergencyExit(address from, address to)`

