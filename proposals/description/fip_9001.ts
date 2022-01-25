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
    }
    // TODO: add token delegator deposits to CR oracle
  ],
  description: `

TODO
`
};

export default fip_9001;
