import { ProposalDescription } from '@custom-types/types';

const fip_104b: ProposalDescription = {
  title: 'Withdraw LBP liquidity',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddresses(address[])',
      arguments: [['{tribalCouncilSafe}', '{tribalCouncilTimelock}', '{compoundDaiPCVDeposit}']],
      description:
        'Set the Compound DAI PCV deposit and TribalCouncil multisig and timelock to be safe addresses for PCV withdrawal'
    },
    {
      target: 'dpiToDaiLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: ['{compoundDaiPCVDeposit}'],
      description: 'Withdraw all DAI and DPI from LBP pool to the compoundDAIPCVDeposit'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawERC20ToSafeAddress(address,address,address,uint256,bool,bool)',
      arguments: [
        '{compoundDaiPCVDeposit}',
        '{tribalCouncilSafe}',
        '{dpi}',
        '100000000000000000000', // TODO, update with accurate figure
        false,
        false
      ],
      description: 'Withdraw DPI from the compound DAI PCV deposit to the TribalCouncil multisig'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit DAI on compoundDAIPCVdeposit into Compound'
    }
  ],
  description: `
  FIP_104b: Withdraw all liquidity from the DPI LBP. 

  This FIP cleans up and finishes elements of the PCV reinforcement process snapshotted here:
  https://snapshot.fei.money/#/proposal/0x2fd5bdda0067098f6c0520fe309dfe90ca403758f0ce98c1854a00bf38999674  
  and discussed here: https://tribe.fei.money/t/fip-104-fei-pcv-reinforcement-proposal/4162 .

  Specifically it:
  - Sets the TribalCouncil multisig, timelock and compoundDAIPCVDeposit to be safe addresses for PCV withdrawal
  - Exits the LBP pool and withdraws all liquidity to the compound DAI deposit
  - Withdraws the DPI from the deposit to the TribalCouncil multisig, uisng the pcvGuardian
  - Deposits the DAI on the deposit into Compound
  `
};

export default fip_104b;
