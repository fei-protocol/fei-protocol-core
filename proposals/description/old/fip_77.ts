import { ProposalDescription } from '@custom-types/types';

const fip_77: ProposalDescription = {
  title: 'FIP-77: FEI-3Crv rewards',
  commands: [
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['1', '0', '0x0000000000000000000000000000000000000000', false],
      description: 'Update FEI-3Crv on TribalChief to 0 AP'
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'set(uint256,uint120,address,bool)',
      arguments: ['14', '1000', '0x0000000000000000000000000000000000000000', false],
      description: 'Update FEI-3Crv on FeiRari to 1000 AP'
    },
    {
      target: 'fuseGuardian',
      values: '0',
      method: '_setMarketSupplyCapsByUnderlying(address[],uint256[])',
      arguments: [['{curve3Metapool}'], ['250000000000000000000000000']],
      description: 'Set FEI-3Crv supply cap to 250m'
    }
  ],
  description: ``
};

export default fip_77;
