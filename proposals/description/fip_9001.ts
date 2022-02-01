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
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{comp}', // token
        '{compoundDaiPCVDeposit}', // from
        '{compDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of COMP tokens to the delegator [DAI deposit]'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{comp}', // token
        '{compoundEthPCVDeposit}', // from
        '{compDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of COMP tokens to the delegator [ETH deposit]'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{crv}', // token
        '{d3poolConvexPCVDeposit}', // from
        '{convexDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of CRV tokens to the delegator'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{cvx}', // token
        '{d3poolConvexPCVDeposit}', // from
        '{convexDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of CVX tokens to the delegator'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{stkaave}', // token
        '{aaveEthPCVDeposit}', // from
        '{aaveDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of stkAAVE tokens to the delegator [ETH deposit]'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{stkaave}', // token
        '{aaveRaiPCVDeposit}', // from
        '{aaveDelegatorPCVDeposit}' // to
      ],
      description: 'Whitelist movement of stkAAVE tokens to the delegator [RAI deposit]'
    },
    {
      target: 'permissionlessPcvMover',
      values: '0',
      method: 'addToWhitelist',
      arguments: [
        '{toke}', // token
        '{ethTokemakPCVDeposit}', // from
        '{tokeTokemakPCVDepositVoting}' // to
      ],
      description: 'Whitelist movement of TOKE tokens to the TOKE deposit/voter'
    },
    {
      target: 'tokeTokemakPCVDepositVoting',
      values: '0',
      method: 'setReactorKeysAndAllocations(bytes32[],uint256[])',
      arguments: [
        ['0x6665692d64656661756c74000000000000000000000000000000000000000000'], // fei-default
        ['10000'] // 100%
      ],
      description: 'Set TOKE votes as 100% for fei-default strategy'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantPCVController(address)',
      arguments: ['{permissionlessPcvMover}'],
      description: 'Grant PCV_CONTROLLER_ROLE to the permissionlessPcvMover'
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
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracles(address[],address[])',
      arguments: [
        ['{comp}', '{stkaave}', '{cvx}'],
        ['{chainlinkCompUsdOracleWrapper}', '{chainlinkAaveUsdOracleWrapper}', '{chainlinkCvxUsdOracleWrapper}']
      ],
      description: 'Add governance price feed oracles to Collateralization Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [
        [
          '{compDelegatorPCVDeposit}',
          '{aaveDelegatorPCVDeposit}',
          '{convexDelegatorPCVDeposit}' // CRV is not reported, only CVX
          // ANGLE and INDEX are not reported because no oracle price feed exists on Chainlink
        ]
      ],
      description: 'Add Delegator PCVDeposits to Collateralization Oracle'
    },
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: ['{agEurAngleUniswapPCVDeposit}', '{agEurAngleUniswapPCVDepositNoStaking}', '10000'],
      description: 'Move all agEUR from old to new Angle deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeMinter(address)',
      arguments: ['{agEurAngleUniswapPCVDeposit}'],
      description: 'Revoke Minter from old Angle deposit'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{agEurAngleUniswapPCVDepositNoStaking}'],
      description: 'Grant Minter to new Angle deposit'
    },
    {
      target: 'agEurAngleUniswapPCVDepositNoStaking',
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
        '{agEurAngleUniswapPCVDepositNoStaking}', // deposit
        '{angleAgEurFeiPool}', // token
        '{angleDelegatorPCVDeposit}', // to
        '10000' // basis poins
      ],
      description: 'Move all Uni-v2 LP tokens to the new Angle delegator deposit'
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
