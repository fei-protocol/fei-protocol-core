import { ProposalDescription } from '@custom-types/types';

const fip_99: ProposalDescription = {
  title: 'FIP-99: Sell RAI',
  commands: [
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address, address, uint256)',
      arguments: ['{rariPool9RaiPCVDeposit}', '{aaveRaiPCVDeposit}', '8000'],
      description: 'Withdraw 80% of the Rai from the rari pool 9 pcv deposit and send to the aave rai pcv deposit'
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
      method: 'grantPCVController(address)',
      arguments: ['{raiPCVDripController}'],
      description: 'Grant the PCV_CONTROLLER_ROLE to the rai pcv drip controller'
    },
    {
      target: 'raiPriceBoundPSM',
      values: '0',
      method: 'pauseMint()',
      arguments: [],
      description: 'Pause mint on the rai price-bound psm'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddresses(address[])',
      arguments: [['{rariPool9RaiPCVDeposit}', '{aaveRaiPCVDeposit}', '{raiPriceBoundPSM}']],
      description:
        'Whitelist the fuse pool 9 rai pcv deposit and the aave rai pcv deposit on the pcv guardian, as well as the new rai psm'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{raiPriceBoundPSM}'],
      description: 'Add the rai price-bound psm to the collateralization oracle'
    }
  ],
  description: `Sell RAI to replenish DAI reserves and/or relieve upcoming peg pressure.
  Forum post: https://tribe.fei.money/t/fip-99-sell-rai/4120
  Steps:

  - Withdraw 80% of the rai from fuse pool 9 and send to the aave rai pcv deposit
  - Call deposit() on the aave rai pcv deposit
  - Grant the PCV_CONTROLLER_ROLE to the rai pcv drip controller
  - Pause mint on the rai price-bound psm
  - Whitelist the fuse pool 9 rai pcv deposit on the pcv guardian, as well as the new rai psm and the aave rai pcv deposit
  - Add the rai price-bound psm to the collateralization oracle
  `
};

export default fip_99;
