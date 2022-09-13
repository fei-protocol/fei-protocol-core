import * as dotenv from 'dotenv';
import { ethers } from 'ethers';
import { Vm, Vm__factory } from '../../types/contracts';

dotenv.config();

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/resetFork [forkBlock] [debug]
      
      Args:
        forkBlock = "latest" | number (default: "latest")
        debug = true | false (default: false)
      
      Examples: 
        npx ts-node scripts/shutdown/resetFork.ts
        npx ts-node scripts/shutdown/resetFork.ts latest true
        npx ts-node scripts/shutdown/resetFork.ts 1234567 false
    `);
    return;
  }

  let forkBlock: string | number = 'latest';
  let debug = false;

  if (process.argv[2] !== undefined) {
    forkBlock = process.argv[2];
  }

  if (process.argv[3] !== undefined) {
    debug = process.argv[3] === 'true';
  }

  if (debug) console.log('Connecting to node...');

  if (!process.env.ANVIL_NODE_URL) throw new Error('ANVIL_NODE_URL not set in .env or env var');
  const provider = new ethers.providers.JsonRpcProvider(process.env.ANVIL_NODE_URL);
  await provider.ready;

  if (debug) console.log('Nodeinator connected.');

  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  const vm = new ethers.Contract(
    '0x7109709ECfa91a80626fF3989D68f67F5b1DD12D',
    Vm__factory.createInterface(),
    wallet
  ) as Vm;

  if (forkBlock === 'latest') {
    if (debug) console.log(`Resetting fork to clean state @ latest block`);
    await (await vm['createSelectFork(string)']('http://127.0.0.1:8545')).wait();
  } else {
    if (debug) console.log(`Resetting fork to clean state @ block ${forkBlock}`);
    await (await vm['createSelectFork(string,uint256)']('http://127.0.0.1:8545', Number(forkBlock))).wait();
  }

  console.log(`Fork reset.`);
}

main();
