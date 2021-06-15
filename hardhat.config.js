require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-truffle5');
require('@nomiclabs/hardhat-web3');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('solidity-coverage');

require('dotenv').config();

const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;
const mainnetAlchemyApiKey = process.env.MAINNET_ALCHEMY_API_KEY;
const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const privateKey = process.env.ETH_PRIVATE_KEY;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  networks: {
    hardhat: {
      gas: 12e6,
      chainId: 5777, // Any network (default: none)
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
        block: 12585055
      }
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${rinkebyAlchemyApiKey}`,
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {}
};
