import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'OA CR Fixes',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{balancerLensBpt30Fei70WethOld}', '{balancerLensBpt30Fei70Weth}'],
      description: 'Update B-70WETH-30FEI Lens'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{rariPool8FeiPCVDepositWrapper}', // Fuse Pool 8 FEI
          '{rariPool8DaiPCVDeposit}', // Fuse Pool 8 DAI
          '{rariPool8LusdPCVDeposit}', // Fuse Pool 8 LUSD
          '{rariPool18FeiPCVDepositWrapper}', // Fuse Pool 18 FEI
          '{rariPool27FeiPCVDepositWrapper}', // Fuse Pool 27 FEI
          '{rariPool90FeiPCVDepositWrapper}', // Fuse Pool 90 FEI
          '{rariPool146EthPCVDeposit}', // Fuse Pool 146 ETH
          '{convexPoolPCVDepositWrapper}' // Fuse Pool 156 FEI
        ]
      ],
      description: 'Remove PCV Deposits with bad debt'
    }
  ],
  description: 'Fix Collateralization Oracle config after the Fuse May 2022 hack.'
};

export default fip_x;
