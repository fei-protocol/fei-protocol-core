import { ethers } from 'ethers';
import balances from './balances.json';
import { testAccounts } from './testAccounts';

const keys = Object.keys(balances);
const newBalances = {} as any;

let accountIndex = 0;

function getNextTestAccount(): string {
  const nextAccount = testAccounts[accountIndex % testAccounts.length];
  accountIndex++;
  return nextAccount;
}

for (const key of keys) {
  const oldBalances = balances[key as keyof typeof balances];
  newBalances[ethers.utils.getAddress(key)] = Object.fromEntries(
    Object.entries(oldBalances).map((entry) => [getNextTestAccount(), entry[1]])
  );
}

//newBalances = Object.fromEntries(newBalances)

console.log(JSON.stringify(newBalances, null, 2));
