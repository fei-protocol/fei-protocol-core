import { ProposalDescription } from '@custom-types/types';

const fip_61: ProposalDescription = {
  title: 'FIP-61: Maintenance and Peg Updates',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'swapDeposit(address,address)',
      arguments: ['{staticPcvDepositWrapper2}', '{namedStaticPCVDepositWrapper}'],
      description: 'Swap static deposit out for named static deposit'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: ['{daiBondingCurveWrapper}'],
      description: 'Remove DAI bonding curve from cr oracle'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{daiBondingCurve}'],
      description: 'Deprecate DAI bonding curve'
    },
    {
      target: 'daiBondingCurve',
      values: '0',
      method: 'pause()',
      arguments: [],
      description: 'Deprecate DAI bonding curve'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{tribeRagequit}'],
      description: 'Deprecate TRIBE ragequit'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x23970cab3799b6876df4319661e6c03cc45bd59628799d92e988dd8cbdc90e31', '{tribalChiefSyncV2}'],
      description: 'Add TribalChiefSyncV2'
    },
    {
      target: 'optimisticTimelock',
      values: '0',
      method: 'becomeAdmin()',
      arguments: [],
      description: 'Become timelock admin'
    },
    {
      target: 'optimisticTimelock',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63', '{tribalChiefSyncV2}'],
      description: 'Add TribalChiefSyncV2 EXECUTOR_ROLE'
    },
    {
      target: 'optimisticTimelock',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: ['0xd8aa0f3194971a2a116679f7c2090f6939c8d4e01a2a8d7e41d55e5351469e63', '{tribalChiefSync}'],
      description: 'Revoke TribalChiefSync'
    },
    {
      target: 'daiPSM',
      values: '0',
      method: 'setMintFee(uint256)',
      arguments: ['25'],
      description: 'Set mint fee to 25bps'
    },
    {
      target: 'daiPSM',
      values: '0',
      method: 'setRedeemFee(uint256)',
      arguments: ['25'],
      description: 'Set redeem fee to 25bps'
    }
  ],
  description: `
  This proposal includes several maintenance upgrades that are bundled together:
  1. Upgrade static pcv deposit in Collateralization Oracle
  2. Deprecate DAI bonding curve + TRIBERagequit by removing Minter role
  3. Add TribalChief auto-decrease rewards
  4. Reduce DAI PSM spread to 25 bps

  Code: https://github.com/fei-protocol/fei-protocol-core/pull/411
`
};

export default fip_61;
