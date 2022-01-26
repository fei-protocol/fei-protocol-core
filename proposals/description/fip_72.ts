import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'FIP-72: New DAI PSM',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{daiFixedPricePSM}'],
      description: 'Grant DAI psm minter role'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{daiPSM}'],
      description: 'Remove minter role from old DAI psm'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokePCVController(address)',
      arguments: ['{daiPSMFeiSkimmer}'],
      description: 'Revoke daiPSMFeiSkimmer PCV controller role from old DAI PSM FEI skimmer'
    },
    {
      target: 'daiPCVDripController',
      values: '0',
      method: 'setTarget(address)',
      arguments: ['{daiFixedPricePSM}'],
      description: 'Set the DAI PCV Drip Controller target to be the new DAI PSM'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{daiFixedPricePSM}'],
      description: 'Set DAI PSM deposit as safe address'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'unsetSafeAddress(address)',
      arguments: ['{daiPSM}'],
      description: 'Unset old DAI PSM deposit as safe address'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{daiPSM}', '{daiFixedPricePSM}', '10000'],
      description: 'Withdraw all DAI from current PSM and place in new PSM'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: ['{daiPSM}', '{fei}', '{daiFixedPricePSM}', '10000'],
      description: 'Withdraw all FEI from current DAI PSM and place in new PSM'
    },
    {
      target: 'daiFixedPricePSM',
      values: '0',
      method: 'setBackupOracle(address)',
      arguments: ['{oneConstantOracle}'],
      description: 'Set backup oracle to constant price oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{daiPSM}', '{daiFixedPricePSM}'],
      description: 'Add new DAI PSM to collateralization oracle'
    },
    {
      target: 'daiPSM',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Pause the old DAI PSM'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fip-72-peg-fei-to-dai/3905/11
Snapshot: https://snapshot.fei.money/#/proposal/0xbb8160b0835556d2472c27bd05750bb3060a2f4377bcb808d10daaeb603b117b

- Grant new DAI PSM minter role
- Revoke minter role from old DAI psm
- Set target of DAI PCV Drip Controller to new DAI PSM
- Revoke pcv controller role from deprecated DAI PSM FEI skimmer
- Remove old DAI PSM from pcv guardian
- Remove all FEI and DAI from old DAI PSM and deposit it into new DAI PSM
- Add new DAI PSM to pcv guardian as a safe address
- Add new DAI PSM to CR Oracle
- Set backup oracle to fixed price oracle
- Remove old DAI PSM from CR Oracle
- Deprecate old DAI PSM
`
};

export default fip_73;
