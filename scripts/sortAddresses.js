
import addresses from '../contract-addresses/mainnetAddresses';

const categories = {
    Core: 0,
    Governance: 1,
    Peg: 2,
    PCV: 3,
    Collateralization: 4,
    Oracle: 5,
    Keeper: 6,
    Rewards: 7,
    FeiRari: 8,
    External: 9,
    Deprecated: 10,
    TBD: 11
  }

const result =
  Object.keys(addresses)
    .sort((a, b) => 
    { 
        let order = categories[addresses[a].category] - categories[addresses[b].category];
        if (order === 0) {
            order = a.localeCompare(b);
        }
        return order;
    })
    .reduce(
      (_sortedObj, key) => ({
        ..._sortedObj,
        [key]: addresses[key]
      }),
      {}
    );

console.log(result);