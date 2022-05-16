import { ProposalDescription } from '@custom-types/types';

const liquidate_cre: ProposalDescription = {
  title: 'Liquidate CREAM position',
  commands: [
    {
      target: 'cream',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{feiDAOTimelock}', '31780370000000000000000'],
      description: 'Transfer CREAM from FEI DAO Timelock to the Cream swapper'
    }
  ],
  description: `
  Liquidate CREAM position by slowing selling CREAM into the Sushiswap CREAM-WETH market. 

  This proposal specifically transfers the DAO's remaining CREAM tokens to the CREAM swapper.
  `
};

export default liquidate_cre;
