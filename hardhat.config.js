require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-truffle5');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-web3");
require('solidity-coverage');

require('dotenv').config();

const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;
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
      allowUnlimitedContractSize: true,
      chainId: 5777, // Any network (default: none)
    },
    localhost: {},
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${rinkebyAlchemyApiKey}`,
      //   accounts: [testnetPrivateKey],
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
