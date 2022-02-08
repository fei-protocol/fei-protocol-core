import { ProposalDescription } from '@custom-types/types';

const fip_9001: ProposalDescription = {
  title: 'FIP-9001: Metagov update [find a cool name]',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'createRole(bytes32,bytes32)',
      arguments: [
        '0x5b5763ebd14d5a5d64e0b90c5e541f0e220ced6d249a6188d33227d6d799380b',
        '0x899bd46557473cb80307a9dabc297131ced39608330a2d29b2d52b660c03923e'
      ],
      description: 'Create METAGOV_ADMIN_ROLE Role'
    },
    {
      target: 'indexDelegator',
      values: '0',
      method: 'setContractAdminRole(bytes32)',
      arguments: ['0x5b5763ebd14d5a5d64e0b90c5e541f0e220ced6d249a6188d33227d6d799380b'],
      description: 'Set INDEX delegator Contract Admin Role to METAGOV_ADMIN_ROLE'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x5b5763ebd14d5a5d64e0b90c5e541f0e220ced6d249a6188d33227d6d799380b', '{opsOptimisticTimelock}'],
      description: 'Grant METAGOV_ADMIN_ROLE Role to OPS OA Timelock'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20',
      arguments: [
        '{agEurAngleUniswapPCVDeposit}', // deposit
        '{angle}', // token
        '{angleDelegatorPCVDeposit}', // to
        '10000' // basis poins
      ],
      description: 'Move all ANGLE tokens to the new Angle deposit'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{agEurAngleUniswapPCVDeposit}', '{agEurUniswapPCVDeposit}', '10000'],
      description: 'Move all agEUR from old to new deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{agEurAngleUniswapPCVDeposit}'],
      description: 'Revoke Minter from old Angle deposit'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{agEurUniswapPCVDeposit}', '10050000000000000000000000'],
      description: 'Mint 10.05M FEI on the new agEUR Uniswap deposit'
    },
    {
      target: 'agEurUniswapPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit agEUR/FEI to Uniswap v2'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20',
      arguments: [
        '{agEurUniswapPCVDeposit}', // deposit
        '{angleAgEurFeiPool}', // token
        '{angleDelegatorPCVDeposit}', // to
        '10000' // basis poins
      ],
      description: 'Move all Uni-v2 LP tokens to the new Angle delegator deposit'
    },
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'lock()',
      arguments: [],
      description: 'Vote-lock ANGLE to veANGLE'
    },
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'voteForGaugeWeight(address,address,uint256)',
      arguments: [
        '{angleGaugeController}', // gauge controller
        '{angleGaugeUniswapV2FeiAgEur}', // gauge address
        '10000' // weight
      ],
      description: 'Vote 100% weight for the FEI/agEUR Uniswap-v2 pool gauge'
    },
    {
      target: 'angleDelegatorPCVDeposit',
      values: '0',
      method: 'stakeAllInGauge(address,address)',
      arguments: [
        '{angleGaugeUniswapV2FeiAgEur}', // gauge
        '{angleAgEurFeiPool}' // token
      ],
      description: 'Stake all Uni-v2 LP tokens in gauge'
    }
  ],
  description: `

TODO
`
};

export default fip_9001;
