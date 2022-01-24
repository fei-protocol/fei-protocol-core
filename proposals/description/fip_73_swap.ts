import { ProposalDescription } from '@custom-types/types';

const fip_73: ProposalDescription = {
  title: 'FIP-73: Fei Peg Policy Changes',
  commands: [
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{feiDAOTimelock}', '20000000000000000000000000'],
      description: 'Withdraw 20M LUSD from BAMM to the DAO Timelock'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{curveLusdMetapool}', '20000000000000000000000000'],
      description: 'Approve 20M LUSD on Curve LUSD metapool'
    },
    {
      target: 'curveLusdMetapool',
      values: '0',
      method: 'exchange_underlying(int128,int128,uint256,uint256,address)',
      arguments: [
        '0', // i
        '1', // j
        '20000000000000000000000000', // dx
        '19960000000000000000000000', // min_dy (tolerate 0.2% slip)
        '{compoundDaiPCVDeposit}'
      ],
      description: 'Swap 20M LUSD on Curve for at least 19.96M DAI and send to Compound DAI deposit'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit 20M DAI on Compound'
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

Immediately swap 20M LUSD for 20M DAI using Curve to re-fill the DAI reserves and allow DAI redemptions.

Create a new swapper for LUSD->DAI whitelisted as a safe address to allow the PCVGuardian to exchange LUSD for DAI using an LBP swapper like used for the buybacks.

The DAI received by swapping will be sent to Compound, where the dripper can pull it to the DAI PSM.
`
};

export default fip_73;
