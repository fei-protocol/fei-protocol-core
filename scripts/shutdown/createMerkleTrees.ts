import { ethers } from 'ethers';
import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import fs from 'fs';
import { MerkleTree } from 'merkletreejs';
import { cTokens } from '../../proposals/data/merkle_redemption/cTokens';

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/createMerkleTree [dataJSONFilename] [outputPath] [debug] [additionalDataJSONFilename] 
      
      Args:
        dataJSONFilename = string (default: "./proposals/data/merkle_redemption/scripts/shutdown/data/sample/snapshot.json")
        outputFilename = string (default: "./proposals/data/merkle_redemption/scripts/shutdown/data/sample/merkleRoots.json")
        debug = true | false (default: false)
        additionalDataJSONFilename = string (default: undefined)
      
      Examples: 
        npx ts-node scripts/shutdown/createMerkleTree
        npx ts-node scripts/shutdown/createMerkleTree ./proposals/data/merkle_redemption/scripts/shutdown/data/sample/snapshot.json
        npx ts-node scripts/shutdown/createMerkleTree ./proposals/data/merkle_redemption/scripts/shutdown/data/sample/snapshot.json ./proposals/data/merkle_redemption/scripts/shutdown/data/prod/roots.json true ./proposals/data/merkle_redemption/scripts/shutdown/data/prod/testingSnapshot.json
    `);
    return;
  }

  let dataJSONFilename = './proposals/data/merkle_redemption/scripts/shutdown/data/sample/snapshot.json';
  let extraDataJSONFilename = undefined;
  let outputFilename = './proposals/data/merkle_redemption/scripts/shutdown/data/sample/merkleRoots.json';
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

  // should have 20 keys, one for each ctoken, and all of the 20 ctoken addresses exactly
  if (Object.keys(balances).length !== 20)
    throw new Error(`Snapshot data should have 20 keys, one for each ctoken. Actual: ${Object.keys(balances).length}`);
  if (Object.keys(balances).some((key) => !cTokens.includes(ethers.utils.getAddress(key))))
    throw new Error(`Snapshot data has invalid ctoken address`);

  // @todo perhaps further validation if we need it

  // create 20 merkle trees & output them to folder

  const trees: MerkleTree[] = [];
  const roots: Buffer[] = [];
  const proofs: { [key: string]: { [key: string]: string[] } } = {};
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

    proofs[cTokenAddress] = {};

    //for (const leaf of leaves) {
    for (let i = 0; i < leaves.length; i++) {
      const proof = tree.getHexProof(leaves[i]);
      const hexProof = tree.getHexProof(leaves[i]);
      proofs[cTokenAddress as keyof typeof proofs][cTokenBalancesArray[i][0]] = hexProof;
      const verified = tree.verify(proof, leaves[i], root);
      if (!verified) throw new Error(`Proof for ${leaves[i]} failed`);
    }
  }

  if (debug) console.log('All trees & roots generated & roots verified.');

  fs.writeFileSync(`${outputFilename}`, JSON.stringify(hexRoots, null, 2));
  console.log(`Merkle roots written to ${outputFilename}`);

  fs.writeFileSync(`${outputFilename.slice(0, -5)}_proofs.json`, JSON.stringify(proofs, null, 2));
  console.log(`Merkle proofs written to ${outputFilename.slice(0, -5)}_proofs.json`);

  if (extraDataJSONFilename) {
    const mergedDataFilename = `${extraDataJSONFilename?.slice(0, -5)}.merged.json`;
    fs.writeFileSync(mergedDataFilename, JSON.stringify(balances, null, 2));
    console.log(`Merged data written to ${mergedDataFilename}`);
  }
}

main();
