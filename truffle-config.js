/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like @truffle/hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

const HDWalletProvider = require("@truffle/hdwallet-provider");
const privateKey = process.env.ETH_PRIVATE_KEY;

const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const ropstenAlchemyApiKey = process.env.ROPSTEN_ALCHEMY_API_KEY;
const mainnetAlchemyApiKey = process.env.MAINNET_ALCHEMY_API_KEY;
const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;

module.exports = {
  /**
   * Networks define how you connect to your ethereum client and let you set the
   * defaults web3 uses to send transactions. If you don't specify one truffle
   * will spin up a development blockchain for you on port 9545 when you
   * run `develop` or `test`. You can ask a truffle command to use a specific
   * network from the command line, e.g
   *
   * $ truffle test --network <network-name>
   */

  networks: {
    // Useful for testing. The `development` name is special - truffle uses it by default
    // if it's defined here and no other network is specified at the command line.
    // You should run a client (like ganache-cli, geth or parity) in a separate terminal
    // tab if you use this network and you must also set the `host`, `port` and `network_id`
    // options below to some value.
    
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     gas: 8e6,
     gasPrice: 20,
     network_id: "5777",       // Any network (default: none)
    },

    ganache: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     gas: 8e6,
     gasPrice: 20,
     network_id: "5777",       // Any network (default: none)
    },

    ropsten: {
      provider: () => new HDWalletProvider({
        privateKeys: [testnetPrivateKey], 
        providerOrUrl: `https://eth-ropsten.alchemyapi.io/v2/${ropstenAlchemyApiKey}`
      }),
      network_id: 3,       // Ropsten's id
      networkCheckTimeout: 1000000000,
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      gasPrice: 4000000000, // 4 gwei
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 50000,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },

    rinkeby: {
      provider: () => new HDWalletProvider({
        privateKeys: [testnetPrivateKey], 
        providerOrUrl: `https://eth-rinkeby.alchemyapi.io/v2/${rinkebyAlchemyApiKey}`
      }),
      network_id: 4,       // Rinkeby's id
      networkCheckTimeout: 1000000,
      gas: 5500000,        
      gasPrice: 2000000000, // 2 gwei
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 50000,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },

    mainnet: {
      provider: () => new HDWalletProvider({
        privateKeys: [privateKey], 
        providerOrUrl: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`
      }),
      network_id: 1,       // Mainnet's id
      networkCheckTimeout: 1000000000,
      gas: 2000000,        
      gasPrice: 100000000000, // 100 gwei
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 50000,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },

    rinkeby: {
      provider: () => new PrivateKeyProvider(testnetPrivateKey, `https://eth-rinkeby.alchemyapi.io/v2/${ropstenAlchemyApiKey}`),
      network_id: 4,       // Rinkeby's id
      networkCheckTimeout: 1000000,
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      gasPrice: 2000000000, // 2 gwei
      confirmations: 1,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.6.6",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
      //  evmVersion: "byzantium"
      // }
    }
  },

  plugins: ["solidity-coverage"]
}
