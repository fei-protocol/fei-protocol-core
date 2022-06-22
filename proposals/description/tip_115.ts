import { TemplatedProposalDescription } from '@custom-types/types';

const tip_115: TemplatedProposalDescription = {
  title: 'TIP-115: Timelock Updates',
  commands: [
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.rariTimelockFeiOldLens],
      description: 'Add FEI lens to CR oracle for old timelocked FEI'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.tribalCouncilTimelockFeiLens],
      description: 'Add FEI lens to CR oracle for tribal council timelock FEI'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposit(address)',
      arguments: (addresses) => [addresses.namedStaticPCVDepositWrapper],
      description: 'Remove NamedStaticPCVDepositWrapper from CR oracle'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: (addresses) => [1],
      description: 'Remove NamedStaticPCVDepositWrapper FEI deposit'
    },
    {
      target: 'namedStaticPCVDepositWrapper',
      values: '0',
      method: 'removeDeposit(uint256)',
      arguments: (addresses) => [0],
      description: 'Remove NamedStaticPCVDepositWrapper INDEX deposit'
    },
    {
      target: 'rariInfraFeiTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of rari infra fei timelock'
    },
    {
      target: 'rariInfraTribeTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary of rari infra tribe timelock'
    }
  ],
  description: `Accept beneficiary of the old rari timelocks to tribal council timelock. Add a FEI lens to the FEI there`
};

export default tip_115;
