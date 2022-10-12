import { TemplatedProposalDescription } from '@custom-types/types';

const fip_x: TemplatedProposalDescription = {
  title: 'Rari Governance Deprecation',
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
  Rari Governance Deprecation

  This proposal in whole will deprecate the Rari Yield Aggregator and Rari Timelock.

The Rari timelock will claim remaining USDC and DAI fees through a series of txs.

The USDC will be sent to the Fuse multisig (0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F), where it will be converted to DAI and sent to the Tribe Redeemer.

This is to minimize technical risk. 

The claimed DAI fees will be send directly to the redeemer. Finally the Rari timelock will have its ownership transferred to the DAOTimelockBurner contract (0x6F6580285a63f1e886548458f427f8695BA1a563) for deprecation.
  `
};

export default fip_x;
