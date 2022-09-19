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

  By passing this proposal, the Tribe DAO authorizes La Tribu SARL to operate this OTC trade between the Tribe DAO and Wintermute Trading and KYC on behalf of the DAO, but this delegation of power is scope-limited to this operation only. The Tribe DAO does not authorize La Tribu SARL to represent it in other contexts or take any other engagements on its behalf. The Tribe DAO shall bear all responsibilities regarding this trade, including accounting and reporting requirements, or tax obligations. The Tribe DAO shall keep custody of the exchanged funds at all times, and La Tribu SARL only acts as a technical operator for this transaction.
  `
};

export default proposal;
