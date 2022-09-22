import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import fs from 'fs';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { MerkleRedeemerDripper__factory, RariMerkleRedeemer__factory } from '../../types/contracts';
import { cTokens } from '../../proposals/data/merkle_redemption/cTokens';

const dripPeriod = 3600; // 1 hour
const dripAmount = ethers.utils.parseEther('1000000'); // 1m Fei

dotenv.config();

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer [ratesJSONFileName] [rootsJSONFileName] [forkMode] [debug]
      
      Args:
        ratesJSONFileName = relative or absolute file locator string (default: "./proposals/data/merkle_redemption/sample/rates.json")
        rootsJSONFileName = relative or absolute file locator string (default: "./proposals/data/merkle_redemption/sample/roots.json")
        forkMode = true | false (default: true)
        debug = true | false (default: false)

      Examples: 
        npx ts-node scripts/shutdown/deployMerkleRedeemer
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./proposals/data/merkle_redemption/sample/rates.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./proposals/data/merkle_redemption/sample/rates.json ./proposals/data/merkle_redemption/sample/roots.json
        npx ts-node scripts/shutdown/deployMerkleRedeemer ./proposals/data/merkle_redemption/sample/rates.json ./proposals/data/merkle_redemption/sample/roots.json true true
    `);
    return;
  }

  // defaults
  const ratesFilename = process.argv[2] ? process.argv[2] : './proposals/data/merkle_redemption/sample/rates.json';
  const rootsFilename = process.argv[3] ? process.argv[3] : './proposals/data/merkle_redemption/sample/roots.json';
  let enableForking = true;
  let debug = false;

  if (process.argv[4] !== undefined && process.argv[4] === 'false') enableForking = false;

  if (process.argv[5] !== undefined && process.argv[5] === 'true') debug = true;

  // sanity check rates & roots
  const rates: { [key: string]: string } = JSON.parse(fs.readFileSync(ratesFilename).toString());
  const roots: { [key: string]: string } = JSON.parse(fs.readFileSync(rootsFilename).toString());

  // rates should be an object with 20 keys (one for each token address), with values being strings
  // each value is a string representing how much fei you'd get for 1e18 of the ctoken
  if (Object.entries(rates).length != 20)
    throw new Error(`Rates should be an object with 20 entries. Actual: ${rates.length}`);

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

  // roots should be an object with 20 keys (one for each token address), with values being strings
  // each value is a string (a merkle root)
  if (Object.entries(roots).length != 20)
    throw new Error(`Roots should be an object with 20 entries. Actual: ${roots.length}`);

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

  console.log(`Rates Array: ${JSON.stringify(ratesArray, null, 2)}`);
  console.log(`Roots Array: ${JSON.stringify(rootsArray, null, 2)}`);

  if (enableForking) {
    if (debug) console.log('Connecting to anvil fork...');
  } else {
    console.warn(`Connecting to ETH MAINNET through Nodineator.`);
    console.warn(`Using url ${process.env.MAINNET_NODE_URL}`);
  }

  let provider: ethers.providers.JsonRpcProvider;

  if (!enableForking) {
    if (!process.env.MAINNET_NODE_URL) throw new Error('MAINNET_NODE_URL not set in .env or exported as env var');
    provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_NODE_URL);
  } else {
    if (!process.env.ANVIL_NODE_URL) throw new Error('ANVIL_NODE_URL not set in .env or exported as env var');
    provider = new ethers.providers.JsonRpcProvider(process.env.ANVIL_NODE_URL);
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

  console.log(JSON.stringify(cTokens, null, 2));
  console.log(JSON.stringify(ratesArray, null, 2));
  console.log(JSON.stringify(rootsArray, null, 2));

  const rariMerkleRedeemerFactory = new RariMerkleRedeemer__factory(wallet);

  const rariMerkleRedeemer = await rariMerkleRedeemerFactory.deploy(
    MainnetContractsConfig.fei.address,
    cTokens,
    ratesArray,
    rootsArray
  );

  await rariMerkleRedeemer.deployed();

  const merkleRedeemerDripperFactory = new MerkleRedeemerDripper__factory(wallet);

  const merkleRedeemerDripper = await merkleRedeemerDripperFactory.deploy(
    MainnetContractsConfig.core.address,
    rariMerkleRedeemer.address,
    dripPeriod,
    dripAmount,
    MainnetContractsConfig.fei.address
  );

  await merkleRedeemerDripper.deployed();

  console.log(`MerkleRedeemerDripper deployed to ${merkleRedeemerDripper.address}\n`);
  console.log(`RariMerkleRedeemer deployed to ${rariMerkleRedeemer.address}\n`);

  if (!enableForking) {
    console.log(
      `Here are the abi-encoded constructor args so that you can verify the contract on etherscan. Also writing to ./scripts/shutdown/data/prod/constructorArgs.txt.\n`
    );

    const args = defaultAbiCoder.encode(['address[]', 'uint256[]', 'bytes32[]'], [cTokens, ratesArray, rootsArray]);
    console.log(args);
    console.log('\n');
    fs.writeFileSync('./constructorArgs.txt', args.slice(2));
  }
}

main();
