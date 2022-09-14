import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import { cTokens } from './data/prod/cTokens';

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/createMerkleTree [dataJSONFilename] [outputPath] [debug] [additionalDataJSONFilename] 
      
      Args:
        dataJSONFilename = string (default: "./scripts/shutdown/data/sample/snapshot.json")
        outputFilename = string (default: "./scripts/shutdown/data/sample/merkleRoots.json")
        debug = true | false (default: false)
        additionalDataJSONFilename = string (default: undefined)
      
      Examples: 
        npx ts-node scripts/shutdown/createMerkleTree
        npx ts-node scripts/shutdown/createMerkleTree scripts/shutdown/prod/snapshot.json
        npx ts-node scripts/shutdown/createMerkleTree scripts/shutdown/sample/snapshot.json scripts/shutdown/prod/roots.json true scripts/shutdown/sample/testingSnapshot.json
    `);
    return;
  }

  let dataJSONFilename = './scripts/shutdown/data/sample/snapshot.json';
  let extraDataJSONFilename = undefined;
  let outputFilename = './scripts/shutdown/data/sample/merkleRoots.json';
  let debug = false;

  if (process.argv[2] !== undefined) {
    dataJSONFilename = process.argv[2];
  }

  if (process.argv[3] !== undefined) {
    outputFilename = process.argv[3];
  }

  if (process.argv[4] !== undefined) {
    debug = process.argv[4] === 'true';
  }

  if (process.argv[5] !== undefined) {
    extraDataJSONFilename = process.argv[5];
  }

  const balances: { [key: string]: { [key: string]: string } } = JSON.parse(
    fs.readFileSync(dataJSONFilename).toString()
  );

  if (extraDataJSONFilename !== undefined) {
    const extraBalances: { [key: string]: { [key: string]: string } } = JSON.parse(
      fs.readFileSync(extraDataJSONFilename).toString()
    );

    // merge the data in each
    Object.keys(extraBalances).forEach((key) => {
      if (debug)
        console.log(
          `Merging entries for token ${key}; ${Object.keys(balances[key]).length} in original data & ${
            Object.keys(extraBalances[key]).length
          } in appended data.`
        );
      balances[key] = { ...balances[key], ...extraBalances[key] };
    });
  }

  /*

  data format:
  {
    cTokenAddress : {
      holderAddress1 : amount1,
      holderAddress2 : amount2
      ...
    }
  }

  */

  // should have 27 keys, one for each ctoken, and all of the 27 ctoken addresses exactly
  if (Object.keys(balances).length !== 25)
    throw new Error(`Snapshot data should have 25 keys, one for each ctoken. Actual: ${Object.keys(balances).length}`);
  if (Object.keys(balances).some((key) => !cTokens.includes(key.toLowerCase())))
    throw new Error(`Snapshot data has invalid ctoken address`);

  // @todo perhaps further validation if we need it

  // create 25 merkle trees & output them to folder

  const trees: MerkleTree[] = [];
  const roots: Buffer[] = [];
  const hexRoots: { [key: string]: string } = {};

  const hashFn = (data: string) => keccak256(data).slice(2);

  for (const cTokenAddress of Object.keys(balances)) {
    const cTokenBalancesData = balances[cTokenAddress];
    const cTokenBalancesArray = Object.entries(cTokenBalancesData);

    const leaves = cTokenBalancesArray.map((x) => solidityKeccak256(['address', 'uint256'], x));
    const tree = new MerkleTree(leaves, hashFn, { sort: true });

    trees.push(tree);

    if (debug) console.log(`Tree generated for token ${cTokenAddress}. ${tree.getLeaves().length} leaves.`);

    const root = tree.getRoot();
    const hexRoot = tree.getHexRoot();
    roots.push(root);
    hexRoots[cTokenAddress] = hexRoot;

    for (const leaf of leaves) {
      const proof = tree.getHexProof(leaf);
      const verified = tree.verify(proof, leaf, root);
      if (!verified) throw new Error(`Proof for ${leaf} failed`);
    }
  }

  if (debug) console.log('All trees & roots generated & roots verified.');

  fs.writeFileSync(`${outputFilename}`, JSON.stringify(hexRoots, null, 2));
  console.log(`Merkle roots written to ${outputFilename}`);

  if (extraDataJSONFilename) {
    const mergedDataFilename = `${extraDataJSONFilename?.slice(0, -5)}.merged.json`;
    fs.writeFileSync(mergedDataFilename, JSON.stringify(balances, null, 2));
    console.log(`Merged data written to ${mergedDataFilename}`);
  }
}

main();
