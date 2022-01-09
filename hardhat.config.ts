import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import '@idle-finance/hardhat-proposals-plugin';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'solidity-coverage';
import 'tsconfig-paths/register';

import * as dotenv from 'dotenv';

dotenv.config();

const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;
const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const privateKey = process.env.ETH_PRIVATE_KEY;
const runE2ETests = process.env.RUN_E2E_TESTS;
const enableMainnetForking = process.env.ENABLE_MAINNET_FORKING;
const mainnetAlchemyApiKey = process.env.MAINNET_ALCHEMY_API_KEY;
const runAllTests = process.env.RUN_ALL_TESTS;

if (!(process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.includes('max-old-space-size'))) {
  throw new Error(
    `Please export node env var max-old-space-size before running hardhat. "export NODE_OPTIONS=--max-old-space-size=4096"`
  );
} else {
  console.log(`Node option max-old-space-size correctly set. Good job.`);
}

if (!rinkebyAlchemyApiKey || !testnetPrivateKey || !privateKey || !mainnetAlchemyApiKey) {
  console.warn('Not all Ethereum keys provided; some functionality will be unavailable.');
}

if (enableMainnetForking) {
  if (!mainnetAlchemyApiKey) {
    throw new Error('Cannot fork mainnet without mainnet alchemy api key.');
  }

  console.log('Mainnet forking enabled.');
} else {
  console.log('Mainnet forking disabled.');
}

export default {
  gasReporter: {
    enabled: !!process.env.REPORT_GAS
  },

  networks: {
    hardhat: {
      gas: 12e6,
      chainId: 5777, // Any network (default: none)
      forking: enableMainnetForking
        ? {
            url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`
            // blockNumber: 13968350
          }
        : undefined
    },

    localhost: {
      url: 'http://127.0.0.1:8545'
    },

    rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${rinkebyAlchemyApiKey}`,
      accounts: testnetPrivateKey ? [testnetPrivateKey] : []
    },

    mainnet: {
      url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
      accounts: privateKey ? [privateKey] : [],
      gasPrice: 150000000000
    }
  },

  solidity: {
    compilers: [
      {
        version: '0.8.10',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: '0.4.18',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },

  paths: {
    tests: runAllTests ? './test/' : runE2ETests ? './test/integration/' : './test/unit/'
  },

  mocha: {
    timeout: 1000000
  },

  typechain: {
    outDir: './types/contracts/',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },

  proposals: {
    governor: '0x0BEF27FEB58e857046d630B2c03dFb7bae567494',
    votingToken: '0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B'
  }
} as HardhatUserConfig;
