import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';
import { balances } from '../../proposals/data/merkle_redemption/fakeExtraBalances';

const hashFn = (data: string) => keccak256(data).slice(2);
//const ctokens = Object.keys(balances).map((token) => ethers.utils.getAddress(token));
const ctokens = Object.entries(balances);

console.log(`cToken Addresses: ${ctokens.length} tokens`);
console.log(JSON.stringify(ctokens, null, 2));

const trees: MerkleTree[] = [];
const roots: Buffer[] = [];

for (const ctoken of ctokens) {
  const cTokenBalancesObject = balances[ctoken[0] as keyof typeof balances];
  const cTokenBalancesArray = Object.entries(cTokenBalancesObject);

  const leaves = cTokenBalancesArray.map((x) => solidityKeccak256(['address', 'uint256'], x));
  const tree = new MerkleTree(leaves, hashFn, { sort: true });

  trees.push(tree);

  console.log(`Tree generated. ${tree.getLeaves().length} leaves.`);

  const root = tree.getRoot();
  roots.push(root);

  for (const leaf of leaves) {
    const proof = tree.getHexProof(leaf);
    const verified = tree.verify(proof, leaf, root);
    if (!verified) throw new Error(`Proof for ${leaf} failed`);
  }

  // write to file
  //fs.writeFileSync(`./rariTrees/${ctoken}.json`, tree.getHexLeaves().toString());
}

console.log(`All leaf proofs in all ${trees.length} trees successfully verified.`);

console.log(`Roots:`);

for (const root of roots) {
  console.log(`0x${root.toString('hex')}`);
}

/*
const leafZero = solidityKeccak256(['address', 'uint256'], ['0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1', '1']);

const leafOne = solidityKeccak256(
  ['address', 'uint256'],
  ['0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e', '11152021915736699992171534']
);

const proofZero = trees[0].getHexProof(leafZero);
const proofOne = trees[0].getHexProof(leafOne);

console.log(`For testing, here are the two proofs for cToken 0xd8553552f8868c1ef160eedf031cf0bcf9686945:`);
console.log(`User 0x82a978b3f5962a5b0957d9ee9eef472ee55b42f1 (1 wei): ${JSON.stringify(proofZero, null, 2)}`);
console.log(
  `User 0x7d577a597b2742b498cb5cf0c26cdcd726d39e6e (11152021915736699992171534 wei): ${JSON.stringify(
    proofOne,
    null,
    2
  )}`
);
*/
