import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { defaultAbiCoder } from 'ethers/lib/utils';
import fs from 'fs';
import { MainnetContractsConfig } from '../../protocol-configuration/mainnetAddresses';
import { TribeRedeemer__factory } from '../../types/contracts';

const TOKEN_REDEEMED = MainnetContractsConfig.tribe.address;

const TOKENS_TO_RECEIVE = [
  '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
  '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84', // stETH
  '0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D', // LQTY
  '0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d' // FOX
];

const REDEEM_BASE = '250000000000000000000000000'; // 250M

dotenv.config();

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/deployTribeRedeemer [forkMode] [debug]
      
      Args:
        forkMode = true | false (default: true)
        debug = true | false (default: false)

      Examples: 
        npx ts-node scripts/shutdown/deployTribeRedeemer
        npx ts-node scripts/shutdown/deployTribeRedeemer false
        npx ts-node scripts/shutdown/deployTribeRedeemer false true
    `);
    return;
  }

  // defaults

  let enableForking = true;
  let debug = false;

  if (process.argv[3] !== undefined && process.argv[4] === 'false') enableForking = false;
  if (process.argv[4] !== undefined && process.argv[5] === 'true') debug = true;

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

  const tribeRedeemerFactory = new TribeRedeemer__factory(wallet);

  const tribeRedeemer = await tribeRedeemerFactory.deploy(
    TOKEN_REDEEMED,
    TOKENS_TO_RECEIVE,
    REDEEM_BASE // 250
  );

  await tribeRedeemer.deployed();

  console.log(`TribeRedeemer deployed to ${tribeRedeemer.address}\n`);

  if (!enableForking) {
    console.log(
      `Here are the abi-encoded constructor args so that you can verify the contract on etherscan. Also writing to ./scripts/shutdown/data/prod/constructorArgs.txt.\n`
    );

    const args = defaultAbiCoder.encode(
      ['address', 'address[]', 'uint256'],
      [TOKEN_REDEEMED, TOKENS_TO_RECEIVE, REDEEM_BASE]
    );
    console.log(args);
    console.log('\n');
    fs.writeFileSync('./constructorArgs.txt', args.slice(2));
  }
}

main();
