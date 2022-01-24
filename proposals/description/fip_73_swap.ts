import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'FIP-73: Fei Peg Policy Changes',
  commands: [
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{lusdToDaiLBPSwapper}', '680000000000000000000000'],
      description: 'Withdraw 680k DAI from Compound to the swapper'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{lusdToDaiLBPSwapper}', '6000000000000000000000000'],
      description: 'Withdraw 6M LUSD from BAMM to the swapper'
    },
    {
      target: 'lusdToDaiLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Start LUSD->DAI auction'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{guardian}'],
      description: 'Grant guardian multisig the SWAP_ADMIN_ROLE role'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{lusdToDaiLBPSwapper}'],
      description: 'Set LUSD->DAI swapper as a safe address'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{lusdToDaiLensDai}'],
      description: 'Add DAI lens on swapper to CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{lusdToDaiLensLusd}'],
      description: 'Add LUSD lens on swapper to CR oracle'
    }
  ],
  description: `
Forum discussion: https://tribe.fei.money/t/fei-peg-policy-changes/3906
Snapshot: https://snapshot.org/#/fei.eth/proposal/0x825420b492363969de1d728655904181d92df2984631a232533e6a86b2125ee3

Create a new swapper for LUSD->DAI whitelisted as a safe address to allow the PCVGuardian to exchange LUSD for DAI using an LBP swapper like used for the buybacks.

The DAI received will be sent to Compound, where the dripper can pull it to the DAI PSM.
`
};

export default fip_73;
