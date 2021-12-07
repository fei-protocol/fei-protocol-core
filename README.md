# Fei Protocol ·

Smart contract code for Fei Protocol and the FEI stablecoin

## Dependencies
 Note that this has only been tested on Linux; you may encounter issues running on other operating systems.
 
 - Node v12 or v16 (you can manage Node versions easily with [NVM](https://github.com/nvm-sh/nvm))

## Installation
 - run `npm install` in the root directory

## Usage
 - run `npm run test` to run unit tests
 - run `npm run test:e2e` to run end-to-end/integration tests
 - run `npm run test:all` to run all tests
 - run `npm run lint` to lint ts files; run `npm lint:all` to lint ts AND js files
 - run `npm run lint:fix` to fix linting errors, if fixable automatically
 - run `npm run prettier-format` to run prettier and automatically format all ts files
 - run `npm run coverage:hardhat` to run smart-contract coverage based off of all tests
 - run `npm run calldata` to generage calldata for a proposal
 - run `npm run check-proposal` to run tests for a specific dao proposal
 - run `npm run compile` to compile smart contracts, if needed

## Documentation
See the [docs](https://docs.fei.money)

## License
Fei Protocol is under [the AGPL v3 license](https://github.com/fei-protocol/fei-protocol-core/tree/7160dda163d45e6d6c7092ef021c365e0031a71f/LICENSE.md)

