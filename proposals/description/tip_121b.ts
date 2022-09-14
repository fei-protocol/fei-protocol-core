import { TemplatedProposalDescription } from '@custom-types/types';
import { parseEther } from 'ethers/lib/utils';

/* Configuration Constants */

const total = parseEther('50000000'); // 50m Fei total
const dripSize = parseEther('2500000'); // 2.5m Fei per drip
const initialFeiAmount = dripSize.mul(2); // 2 x initial drip size for seed amount (5m Fei)
const dripperFeiAmount = total.sub(initialFeiAmount); // Remaining Fei for dripper (45m Fei)

/* DAO Vote Commands */

const tip_121b: TemplatedProposalDescription = {
  title: 'Part 2: RariFuse Merkle Redemption',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.rariMerkleRedeemer, initialFeiAmount],
      description: 'Mint initial Fei amount to the RariMerkleRedeemer'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.merkleRedeemerDripper, dripperFeiAmount],
      description: 'Mint remainder of Fei to the MerkleRedeemerDripper'
    }
  ],
  description: `
  [Part 2: RariFuse Merkle Redemption] /n/n
  [<does stuff>] \n\n
  ` // @todo - add description
};

export default tip_121b;
