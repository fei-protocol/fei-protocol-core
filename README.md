# Fei Protocol ·

Smart contract code for Fei Protocol and the FEI stablecoin

## To get started:

1. Git clone this repo: git clone git@github.com:fei-protocol/fei-protocol-core.git
2. Install dependencies: `npm install`
3. Set the relevant environment variables in a gitignored `.env`: `MAINNET_ALCHEMY_API_KEY` and `ETH_PRIVATE_KEY`. You can use the `.env.example` as a base
4. To run the Hardhat based unit tests, run `npm run test:hardhat`

### Setting up Forge

Fei makes use of Forge as a smart contract development framework alongside Hardhat. To set this up run: `npm run setup`

## Dependencies

Note that this has only been tested on Linux; you may encounter issues running on other operating systems.

- Node v12 or v16 (you can manage Node versions easily with [NVM](https://github.com/nvm-sh/nvm))

## Usage

- run `npm run test` to run Forge based unit tests
- run `npm run test:hardhat` to run Hardhat based unit tests
- run `npm run test:integration` to run Solidity integration tests, forked from a pinned Mainnet block
- run `npm run test:integration:latest` to run Solidity integration tests, forked from the latest block
- run `npm run test:e2e` to run end-to-end/integration tests
- run `npm run test:all` to run all tests
- run `npm run lint` to lint ts files and sol files
- run `npm lint:all` to lint ts AND js files
- run `npm run lint:sol` to lint .sol files
- run `npm run lint:fix` to fix linting errors, if fixable automatically
- run `npm run prettier:ts` to run prettier and automatically format all ts files
  automatically
- run `npm run prettier:sol` to run prettier and automatically format all Solidity files
  automatically
- run `npm run prettier` to run prettier and format all files
- run `npm run coverage:hardhat` to run smart-contract coverage based off of all tests
- run `npm run calldata` to generage calldata for a proposal
- run `npm run check-proposal` to run tests for a specific dao proposal
- run `npm run compile` to compile smart contracts, if needed

## Documentation

See the [docs](https://docs.fei.money)

## Release Process

Every Thursday, do the following for the weekly release:

### Release Fei-Protocol-Core

1.  Update the current release branch's fixed hardhat block to something within the last hour
2.  Clean the release branch if necessary:
    - fix any failing tests
    - clear out proposals-config
3.  Merge the release branch into master. Create a release via the github UI, using the version number of the release branch.
4.  Merge master back into develop to ensure that any fixes added are pulled back into develop, and so that the hardcoded fork block is set correctly for the most recent release.
5.  Create a new branch off of develop of the format release/major.minor.patch, using an incremented minor version number

For hotfix releases or bugfixes to master, branch off of master, add in the necessary fixes, and merge back into master.
Then tag that commit with a new release number (increment the patch version number here).
Finally merge master back into develop.

### Release Docs (If Applicable)

1. @Joey should update this, because I am confused about the difference between the gh-pages and the master branch. Which one should we update,
   and which one should we run commands on? Also, do we need to change the default branch of this repo?

## License

Fei Protocol is under [the AGPL v3 license](https://github.com/fei-protocol/fei-protocol-core/tree/7160dda163d45e6d6c7092ef021c365e0031a71f/LICENSE.md)
