import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { AbiCoder, defaultAbiCoder } from 'ethers/lib/utils';
import fs from 'fs';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { RariMerkleRedeemer__factory } from '../../types/contracts';
import { cTokens } from './data/prod/cTokens';

dotenv.config();

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer [ratesJSONFileName] [rootsJSONFileName] [forkMode] [debug]
      
      Args:
        ratesJSONFileName = relative or absolute file locator string (default: "./scripts/shutdown/data/sample/rates.json")
        rootsJSONFileName = relative or absolute file locator string (default: "./scripts/shutodwn/data/sample/roots.json")
        forkMode = true | false (default: true)
        debug = true | false (default: false)

      Examples: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./scripts/shutdown/data/actual/rates.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./scripts/shutdown/data/actual/rates.json ./scripts/shutdown/data/actual/roots.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./scripts/shutdown/data/actual/rates.json ./scripts/shutdown/data/actual/roots.json true true
    `);
    return;
  }

  // defaults
  const ratesFilename = process.argv[2] ? process.argv[2] : './scripts/shutdown/data/sample/rates.json';
  const rootsFilename = process.argv[3] ? process.argv[3] : './scripts/shutdown/data/sample/roots.json';
  let enableForking = true;
  let debug = false;

  if (process.argv[4] !== undefined && process.argv[4] === 'false') enableForking = false;

  if (process.argv[5] !== undefined && process.argv[5] === 'true') debug = true;

  // sanity check rates & roots
  const rates: { [key: string]: string } = JSON.parse(fs.readFileSync(ratesFilename).toString());
  const roots: { [key: string]: string } = JSON.parse(fs.readFileSync(rootsFilename).toString());

  // rates should be an object with 27 keys (one for each token address), with values being strings
  // each value is a string representing how much fei you'd get for 1e18 of the ctoken
  if (Object.entries(rates).length != 27)
    throw new Error(`Rates should be an object with 27 entries. Actual: ${rates.length}`);

  if (
    Object.entries(rates).some((entry) => {
      !(entry[0].startsWith('0x') && entry[0].length == 42);
    })
  ) {
    throw new Error('Not all keys for rates file are valid addresses');
  }

  if (
    Object.entries(roots).some((entry) => {
      !(typeof entry[1] === 'string');
    })
  ) {
    throw new Error(
      'Not all values for rates file are strings. Values should be strings representing the base-10 number of Fei you would get for 1e18 of the ctoken'
    );
  }

  // roots should be an object with 27 keys (one for each token address), with values being strings
  // each value is a string (a merkle root)
  if (Object.entries(roots).length != 27)
    throw new Error(`Roots should be an object with 27 entries. Actual: ${roots.length}`);

  if (
    Object.entries(rates).some((entry) => {
      !(entry[0].startsWith('0x') && entry[0].length == 42);
    })
  ) {
    throw new Error('Not all keys for roots file are valid addresses');
  }

  if (
    Object.entries(roots).some((entry) => {
      !(typeof entry[1] === 'string');
    })
  ) {
    throw new Error(
      'Not all values for roots file are strings. Values should be strings representing the merkle root (in hex) for the ctoken'
    );
  }

  // parse rates & roots into arrays to pass into the contract constructor
  const ratesArray: string[] = Object.values(rates);
  const rootsArray: string[] = Object.values(roots);

  if (enableForking) {
    if (debug) console.log('Connecting to nodeinator (anvil fork)...');
  } else {
    console.warn(`Connecting to ETH MAINNET through Nodineator.`);
  }

  let provider: ethers.providers.JsonRpcProvider;

  if (!enableForking) {
    provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8545');
  } else {
    provider = new ethers.providers.JsonRpcProvider('http://nodeinator.kryptoklob.io:8999');
  }

  await provider.ready;

  if (debug) console.log('Node connected.');

  let wallet: ethers.Wallet;

  if (!enableForking) {
    if (process.env.MAINNET_PRIVATE_KEY === undefined)
      throw new Error('MAINNET_PRIVATE_KEY not set, please export env or set in .env file.');
    wallet = new ethers.Wallet(process.env.MAINNET_PRIVATE_KEY, provider);
    console.log(`Deploying from ${wallet.address} on Mainnet.`);
  } else {
    if (debug) console.log('Using default wallet to deploy on fork.');
    wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  }

  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory(wallet);

  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address,
    cTokens,
    ratesArray,
    rootsArray
  );

  console.log(`Rari Merkle Redeemer deployed to ${rariMerkleRedeemer.address}`);

  if (!enableForking) {
    console.log(
      `Here are the abi-encoded constructor args so that you can verify the contract on etherscan. Also writing to ./scripts/shutdown/data/prod/constructorArgs.txt.\n`
    );

    const args = defaultAbiCoder.encode(['address[]', 'uint256[]', 'bytes32[]'], [cTokens, ratesArray, rootsArray]);
    console.log(args);
    console.log('\n');
    fs.writeFileSync('./scripts/shutdown/data/prod/constructorArgs.txt', args);
  }
}

main();
