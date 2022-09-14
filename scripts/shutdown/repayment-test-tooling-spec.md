# Rari Merkle Redeemer Tooling

## Goals:

- easily generate merkle tree(s) from json data
- easily create mainnet fork for testing
- easily grant ctokens to accounts for testing
- add fake data into the real data so that we have real keys to test/sign with

## Individual Scripts

- Run each command with a single param, "help" to get usage details. Example:

```
npx ts-node scripts/shutdown/createMerkleTree help
```

- createMerkleTree.ts - done. writes the roots to a file. optionally takes a sample/test data file to add in extra balances.
- resetFork.ts - done. resets the forked-anvil instance to a fresh state and updated block.
- deployMerkleRedeemer.ts - done. deploys the merkle redeemer contract to the forked-anvil instance.
- setTokenBalance.ts - done. takes in process args and transfers the requested amount of ctoken from the top holder of the ctoken

## Combination Scripts

- Note: All three of these scripts have filename params in them that you should edit if you are not using the defaults.

- run-all-mainnet.sh - edit the filenames in here if needed. this is the production deploy script
- run-all-forked-dry-run.sh - this is useful for testing the actual prod data, but on the anvil-forked instance
- run-all-forked-test-run.sh - this is useful for incorporating fake data to test with the real ones, so that signatures can be tested

## Needed for Contract Deployment

- ctokens
- rates
- merkle roots

## Initial Setup

- This is run on nodeinator to create an anvil fork of mainnet. You can ignore it, only Caleb needs this info.

- `anvil --fork-url http://127.0.0.1:8545 --host 0.0.0.0 --port 8546`
- `const forkId = vm.createSelectFork("http://127.0.0.1:8545);`

## Test Accounts - Forked Instance

```
Available Accounts
==================

(0) 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
(1) 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 (10000 ETH)
(2) 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc (10000 ETH)
(3) 0x90f79bf6eb2c4f870365e785982e1f101e93b906 (10000 ETH)
(4) 0x15d34aaf54267db7d7c367839aaf71a00a2c6a65 (10000 ETH)
(5) 0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc (10000 ETH)
(6) 0x976ea74026e726554db657fa54763abd0c3a0aa9 (10000 ETH)
(7) 0x14dc79964da2c08b23698b3d3cc7ca32193d9955 (10000 ETH)
(8) 0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f (10000 ETH)
(9) 0xa0ee7a142d267c1f36714e4a8f75612f20a79720 (10000 ETH)

Private Keys
==================

(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
(2) 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
(3) 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
(4) 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a
(5) 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba
(6) 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e
(7) 0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356
(8) 0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97
(9) 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6
```