import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'Withdraw Fei from Aave and Compound',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{aaveFeiPCVDeposit}', '{daiFixedPricePSM}', '6400000000000000000000000', false, false],
      description: 'Withdraw 6.4M Fei from Aave to the DAI PSM'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: ['{compoundFeiPCVDeposit}', '{daiFixedPricePSM}', '3000000000000000000000000', false, false],
      description: 'Withdraw 3M Fei from Compound to the DAI PSM'
    }
  ],
  description: 'Withdraw 6.4M FEI from Aave and 3M FEI from Compound to the DAI PSM'
};

export default fip_x;
