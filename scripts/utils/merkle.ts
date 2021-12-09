import { keccak256, solidityKeccak256 } from 'ethers/lib/utils';
import MerkleTree from 'merkletreejs';
import merkleWallets from '@proposals/data/ragequit_data.json';
const hashFn = (data: string) => keccak256(data).slice(2);
export const createTree = (): MerkleTree => {
  const elements = Object.entries(merkleWallets).map(([account, balance]) =>
    solidityKeccak256(['address', 'uint256'], [account, balance])
  );
  const tree = new MerkleTree(elements, hashFn, { sort: true });

  return tree;
};
