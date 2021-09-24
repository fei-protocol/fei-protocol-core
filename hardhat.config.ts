import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-web3';
import 'hardhat-gas-reporter';
import 'hardhat-contract-sizer';
import 'solidity-coverage';
import '@typechain/hardhat'
import "@idle-finance/hardhat-proposals-plugin";
import "solidity-coverage"
import { HardhatUserConfig } from "hardhat/config";

require('dotenv').config();

const rinkebyAlchemyApiKey = process.env.RINKEBY_ALCHEMY_API_KEY;
const testnetPrivateKey = process.env.TESTNET_PRIVATE_KEY;
const privateKey = process.env.ETH_PRIVATE_KEY;
const runE2ETests = process.env.RUN_E2E_TESTS;
const enableMainnetForking = process.env.ENABLE_MAINNET_FORKING;
const mainnetAlchemyApiKey = process.env.MAINNET_ALCHEMY_API_KEY;

if (!(process.env.NODE_OPTIONS && process.env.NODE_OPTIONS.includes('max-old-space-size'))) {
  throw new Error(`Please export node env var max-old-space-size before running hardhat. "export NODE_OPTIONS=--max-old-space-size=4096"`);
} else {
  console.log(`Node option max-old-space-size correctly set. Good job.`);
}

if (!rinkebyAlchemyApiKey || !testnetPrivateKey || !privateKey || !mainnetAlchemyApiKey) {
  console.warn("Not all Ethereum keys provided; some functionality will be unavailable.")
}

if (enableMainnetForking) {
  if (!mainnetAlchemyApiKey) {
    throw new Error("Cannot fork mainnet without mainnet alchemy api key.")
  }

  console.log("Mainnet forking enabled.")
} else {
  console.log("Mainnet forking disabled.")
}

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
  },
  networks: {
    hardhat: {
      gas: 12e6,
      chainId: 5777, // Any network (default: none)
      forking: enableMainnetForking ? {
        url: `https://eth-mainnet.alchemyapi.io/v2/${mainnetAlchemyApiKey}`,
        blockNumber: 13285105
      }: undefined
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
      accounts: privateKey ? [privateKey] : []
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
    tests: runE2ETests ? './test/integration/' : './test/unit/',
  },
  mocha: {
    timeout: 1000000,
  },
  typechain: {
    outDir: 'types',
    target: 'web3-v1',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
  },
  proposals: {
    governor: "0xE087F94c3081e1832dC7a22B48c6f2b5fAaE579B",
    votingToken: "0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B"
  }
};

export default config