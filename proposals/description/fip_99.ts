import { ProposalDescription } from '@custom-types/types';

const fip_x: ProposalDescription = {
  title: 'FIP-99: Sell RAI',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20',
      arguments: ['{rariPool9RaiPCVDeposit}', '{rai}', '{aaveRaiPCVDeposit}, 10000'],
      description: 'Withdraw all Rai from the rari pool 9 pcv deposit and sent to the aave rai pcv deposit'
    },
    {
      target: 'aaveRaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Call deposit() on the aave rai pcv deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{globalRateLimitedMinter}'],
      description: 'Grant the MINTER_ROLE to the global rate limited minter'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{nonCustodialPriceBoundPSM}'],
      description: 'Grant the PCV_CONTROLLER_ROLE to the non-custodial price-bound psm'
    }
  ],
  description: 'Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure'
};

export default fip_x;
