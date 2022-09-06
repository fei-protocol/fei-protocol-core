import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'TIP-121c: INDEX OTC',
  commands: [
    {
      target: 'indexDelegator',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [addresses.feiDAOTimelock, ethers.constants.WeiPerEther.mul(100_000)],
      description: 'Move 100,000 INDEX to DAO Timelock'
    },
    {
      target: 'index',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.indexOtcEscrow, ethers.constants.WeiPerEther.mul(100_000)],
      description: 'Approve 100,000 INDEX on OtcEscrow contract'
    },
    {
      target: 'indexOtcEscrow',
      values: '0',
      method: 'swap()',
      arguments: (addresses) => [],
      description: 'Swap 100,000 INDEX to 200,000 DAI'
    },
    {
      target: 'dai',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit, ethers.constants.WeiPerEther.mul(200_000)],
      description: 'Send 200,000 DAI to daiHoldingPCVDeposit'
    }
  ],
  description: `
  TIP-121c: INDEX OTC

  This proposal sets up the protocol to be able to OTC its 100,000 INDEX to Wintermute for OTC trade, in exchange of 200,000 DAI.
  `
};

export default proposal;
