import { ProposalDescription } from '@custom-types/types';

const withdraw_lbp_liquidity: ProposalDescription = {
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
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawERC20ToSafeAddress(address,address,address,uint256,bool,bool)',
      arguments: [
        '{dpiToDaiLBPSwapper}',
        '{compoundDaiPCVDeposit}',
        '{dai}',
        '3000000000000000000000000', // TODO, update with accurate figure
        false,
        false
      ],
      description: 'Withdraw DAI from the LBP to the Compound PCV DAI deposit'
    },
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'withdrawERC20ToSafeAddress(address,address,address,uint256,bool,bool)',
      arguments: [
        '{dpiToDaiLBPSwapper}',
        '{tribalCouncilSafe}',
        '{dpi}',
        '100000000000000000000', // TODO, update with accurate figure
        false,
        false
      ],
      description: 'Withdraw DPI from the LBP to the TribalCouncil multisig'
    }
  ],
  description: `
  Withdraw LBP liquidity.

  Set the TribalCouncil multisig and timelock to be safe addresses for PCV withdrawal.

  Then use the PCV guardian to withdraw all DAI liquidity from the DPI LBP sale to the Compound DAI PCV deposit.

  Lastly, use the PCV guardian to withdraw all DPI liquidity from the DPI LBP sale to the TribalCouncil safe, where it will then be 
  sold via a DEX aggregator for DAI.
  `
};

export default withdraw_lbp_liquidity;
