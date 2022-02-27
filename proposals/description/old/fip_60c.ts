import { ProposalDescription } from '@custom-types/types';

const fip_60c: ProposalDescription = {
  title: 'FIP-60c: FeiRari Rewards Upgrade',
  commands: [
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['16', '500', '0x0000000000000000000000000000000000000000', false],
      description: 'Update FEI-USDC on TribalChief to 500 AP'
    },
    {
      target: 'fei',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{rariPool128FeiPCVDeposit}', '1000000000000000000000000'],
      description: 'Send 1M FEI to UMA pool'
    },
    {
      target: 'rariPool128FeiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 1M FEI to UMA pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [
        [
          '{rariPool90FeiPCVDepositWrapper}',
          '{rariPool91FeiPCVDepositWrapper}',
          '{rariPool79FeiPCVDepositWrapper}',
          '{rariPool72FeiPCVDepositWrapper}',
          '{rariPool128FeiPCVDepositWrapper}',
          '{rariPool22FeiPCVDepositWrapper}',
          '{rariPool28FeiPCVDepositWrapper}',
          '{rariPool31FeiPCVDepositWrapper}'
        ]
      ],
      description: 'Add wrappers to CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{rariPool90FeiPCVDeposit}',
          '{rariPool91FeiPCVDeposit}',
          '{rariPool79FeiPCVDeposit}',
          '{rariPool72FeiPCVDeposit}',
          '{rariPool28FeiPCVDeposit}',
          '{rariPool31FeiPCVDeposit}'
        ]
      ],
      description: 'Remove deposits from CR oracle'
    }
  ],
  description: ``
};

export default fip_60c;
