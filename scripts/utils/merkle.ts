import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import { MerkleTree } from 'merkletreejs';
import { balances } from '../../proposals/data/hack_repayment_data_real_sample';

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
const leafZero = solidityKeccak256(['address', 'uint256'], ['0xb2d5CB72A621493fe83C6885E4A776279be595bC', '1']);

const leafOne = solidityKeccak256(
  ['address', 'uint256'],
  ['0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9', '11152021915736699992171534']
);


const proofZero = trees[0].getHexProof(leafZero);
const proofOne = trees[0].getHexProof(leafOne);

console.log(`For testing, here are the two proofs for cToken 0xd8553552f8868c1ef160eedf031cf0bcf9686945:`);
console.log(`User 0xb2d5CB72A621493fe83C6885E4A776279be595bC (1 wei): ${JSON.stringify(proofZero, null, 2)}`);
console.log(
  `User 0x37349d9cc523D28e6aBFC03fc5F44879bC8BfFD9 (11152021915736699992171534 wei): ${JSON.stringify(
    proofOne,
    null,
    2
  )}`
);
*/

const leafZero = solidityKeccak256(
  ['address', 'uint256'],
  ['0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab', '993589106605953983']
);
const leafOne = solidityKeccak256(
  ['address', 'uint256'],
  ['0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab', '690998780903']
);

const proofZero = trees[0].getHexProof(leafZero);
const proofOne = trees[1].getHexProof(leafOne);

console.log(`For testing, here is one user with two ctokens of claim and their proofs:`);
console.log(
  `User 0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab, ctoken 0xd8553552f8868c1ef160eedf031cf0bcf9686945, amount 993589106605953983}`
);
console.log(JSON.stringify(proofZero, null, 2));
console.log(
  `User 0x3ee505ba316879d246a8fd2b3d7ee63b51b44fab, ctoken 0xbb025d470162cc5ea24daf7d4566064ee7f5f111, amount 690998780903`
);
console.log(JSON.stringify(proofOne, null, 2));
