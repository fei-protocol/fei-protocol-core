import { TemplatedProposalDescription } from '@custom-types/types';

const fip_104b: TemplatedProposalDescription = {
  title: 'FIP_104b: Withdraw LBP liquidity',
  commands: [
    {
      target: 'dpiToDaiLBPSwapper',
      values: '0',
      method: 'exitPool(address)',
      arguments: (addresses) => [addresses.compoundDaiPCVDeposit],
      description: 'Withdraw all DAI and DPI from LBP pool to the compoundDAIPCVDeposit (~$3.8m)'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.compoundDaiPCVDeposit, // pcvDeposit
        addresses.dpi, // token
        addresses.tribalCouncilSafe, // to
        '10000' // basisPoints, 100%
      ],
      description:
        'Withdraw all DPI from the Compound DAI PCV deposit (~$200k) to the TribalCouncil multisig, where it will be liquidated'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: (addresses) => [],
      description: 'Deposit DAI on compoundDAIPCVdeposit into Compound'
    }
  ],
  description: `
  FIP_104b: Withdraw all liquidity from the DPI LBP. 

  This FIP cleans up and finishes elements of the PCV reinforcement process snapshotted here:
  https://snapshot.fei.money/#/proposal/0x2fd5bdda0067098f6c0520fe309dfe90ca403758f0ce98c1854a00bf38999674  
  and discussed here: https://tribe.fei.money/t/fip-104-fei-pcv-reinforcement-proposal/4162 .

  Specifically it:
  - Exits the LBP pool and withdraws all liquidity to the compound DAI deposit
  - Withdraws the DPI from the deposit to the TribalCouncil multisig, using the ratioPCVController
  - Deposits the DAI on the deposit into Compound
  `
};

export default fip_104b;
