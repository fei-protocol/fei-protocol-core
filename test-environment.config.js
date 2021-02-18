module.exports = {
  accounts: {
    ether: 1e6,
    amount: 13, // Number of unlocked accounts
  },

  contracts: {
    type: 'truffle',
    defaultGas: 6e6,
    defaultGasPrice: 20e9,
  },
  node: { // Options passed directly to Ganache client
    gasLimit: 1099511627775, // Maximum gas per block
    gas: 1099511627775,
    gasPrice: 1, // Sets the default gas price for transactions if not otherwise specified.
    allowUnlimitedContractSize: true,
  },
};