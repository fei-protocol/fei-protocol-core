import { TemplatedProposalDescription } from '@custom-types/types';

const fip_x: TemplatedProposalDescription = {
  title: 'Verify Rari deprecation proposal',
  commands: [
    {
      target: 'rariUSDCPoolControllerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => [addresses.rariTimelock],
      description: ''
    },
    {
      target: 'rariDAIPoolControllerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => [addresses.rariTimelock],
      description: ''
    },
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => [addresses.rariTimelock],
      description: ''
    },
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => [addresses.rariTimelock],
      description: ''
    },
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'depositFees()',
      arguments: (addresses) => [],
      description: ''
    },
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'depositFees()',
      arguments: (addresses) => [],
      description: ''
    },
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'withdraw(string,uint256)',
      arguments: (addresses) => ['USDC', '336235000000'],
      description: ''
    },
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'withdraw(string,uint256)',
      arguments: (addresses) => ['DAI', '94218000000000000000000'],
      description: ''
    },
    {
      target: 'usdc',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.fuseMultisig, '336235000000'],
      description: ''
    },
    {
      target: 'dai',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, '94218000000000000000000'],
      description: ''
    },
    {
      target: 'rariTimelock',
      values: '0',
      method: 'setPendingAdmin(address)',
      arguments: (addresses) => [addresses.daoTimelockBurner],
      description: ''
    },
    {
      target: 'daoTimelockBurner',
      values: '0',
      method: 'acceptRariDAOTimelockAdmin()',
      arguments: (addresses) => [],
      description: ''
    }
  ],
  description: `
  Verify Rari deprecation proposal
  `
};

export default fip_x;
