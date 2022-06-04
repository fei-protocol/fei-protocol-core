import { ProposalDescription } from '@custom-types/types';

const eth_lbp: ProposalDescription = {
  title: 'FIP-110: Reinforce PCV via ETH LBP and tighter spread',
  commands: [
    {
      target: 'pcvGuardianNew',
      values: '0',
      method: 'setSafeAddresses(address[])',
      arguments: [['{ethToDaiLBPSwapper}']],
      description: 'Set the ethToDai LBP swapper to be guardian Safe addresses'
    },
    ////////    ETH LBP    ////////
    {
      target: 'aaveEthPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethToDaiLBPSwapper}', '20000000000000000000000'],
      description: 'Transfer DPI from DAO timelock to the LBP swapper'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{ethToDaiLBPSwapper}', '2000000000000000000000000'],
      description: 'Withdraw 2M DAI from the CompoundPCVDeposit and transfer to the LBP pool'
    },
    // Correcting the oracle needs to happen before forceSwap()
    // {
    //   target: 'ethToDaiLBPSwapper',
    //   values: '0',
    //   method: 'setDoInvert(bool)',
    //   arguments: [false],
    //   description: 'Set the dpiToDai LBP swapper to not invert'
    // },
    {
      target: 'ethToDaiLBPSwapper',
      values: '0',
      method: 'forceSwap()',
      arguments: [],
      description: 'Start the auction and override the current no-op auction'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{ethToDaiLensDai}'],
      description: 'Add DAI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{ethToDaiLensEth}'],
      description: 'Add ETH swapper lens to the CR oracle'
    },
    //////// Tighten ETH PSM //////////
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x1749ca1ca3564d20da6efea465c2a5ae869a9e4b006da7035e688beb14d704e0', '{tribalCouncilTimelock}'],
      description: 'Grant TribalCouncilTimelock PSM_ADMIN_ROLE so it can tighten ETH redemption spread'
    },
    {
      target: 'ethPSM',
      values: '0',
      method: 'setRedeemFee(uint256)',
      arguments: ['60'],
      description: 'set PSM spread to 60'
    }
  ],
  description: `
  FIP-110: Reinforce PCV via ETH LBP and tighter spread.
  `
};

export default eth_lbp;
