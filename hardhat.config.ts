import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-web3';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'solidity-coverage';
import '@typechain/hardhat'
import { HardhatUserConfig } from "hardhat/config";

require('dotenv').config();

const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;
const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const privateKey = process.env.ETH_PRIVATE_KEY;
const runE2ETests = process.env.RUN_E2E_TESTS;
const mainnetAlchemyApiKey = process.env.MAINNET_ALCHEMY_API_KEY;

if (!rinkebyAlchemyApiKey || !testnetPrivateKey || !privateKey || !mainnetAlchemyApiKey) {
  throw new Error('Please set your Ethereum keys in a .env')
}

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  networks: {
    hardhat: {
      gas: 12e6,
      chainId: 5777, // Any network (default: none)
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
        blockNumber: 13031280
      }
    },
    localhost: {
      url: 'http://127.0.0.1:8545'
    },
    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${rinkebyAlchemyApiKey}`,
      accounts: [testnetPrivateKey]
    },
    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
      accounts: [privateKey]
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
  paths: {
    tests: runE2ETests ? './end-to-end' : './test',
  },
  mocha: {
    timeout: 100000,
  },
  typechain: {
    outDir: 'types',
    target: 'web3-v1',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
};

export default config