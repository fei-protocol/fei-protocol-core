import { ProposalDescription } from '@custom-types/types';

const fip_105: ProposalDescription = {
  title: 'FIP-105: Reinforce PCV by consolidating assets and performing technical maintenance',
  commands: [
    /////////  DAI PSM Skimmer   //////////////
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x0866eae1216ed05a11636a648003f3f62921eb97ccb05acc30636f62958a8bd6', '{daiFixedPricePSMFeiSkimmer}'],
      description: 'Grant the new DAI PSM Skimmer the PCV_CONTROLLER_ROLE'
    },

    ////////    DPI LBP    ////////
    {
      target: 'dpi',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{dpiToDaiLBPSwapper}', '37888449801955370645659'],
      description: 'Transfer DPI from DAO timelock to the LBP pool'
    },
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{dpiToDaiLBPSwapper}', '187947000000000000000000'],
      description: 'Withdraw Use the PCVGuardian to transfer DAI from the CompoundPCVDeposit to the LBP pool'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{daiBPTLens}'],
      description: 'Add DAI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{dpiBPTLens}'],
      description: 'Add DPI swapper lens to the CR oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'removeDeposits(address[])',
      arguments: [
        [
          '{rariPool31FeiPCVDepositWrapper}',
          '{rariPool25FeiPCVDepositWrapper}',
          '{rariPool9RaiPCVDepositWrapper}',
          '{aaveRaiPCVDepositWrapper}',
          '{rariPool19DpiPCVDepositWrapper}',
          '{liquityFusePoolLusdPCVDeposit}',
          '{rariPool72FeiPCVDepositWrapper}',
          '{raiDepositWrapper}',
          '{dpiDepositWrapper}'
        ]
      ],
      description: 'Remove DPI Deposit wrapper from CR oracle, as now empty'
    },
    {
      target: 'core',
      values: '0',
      method: 'grantRole(bytes32,address)',
      arguments: ['0x471cfe1a44bf1b786db7d7104d51e6728ed7b90a35394ad7cc424adf8ed16816', '{tribalCouncilTimelock}'],
      description: 'Grant TribalCouncilTimelock SWAP_ADMIN_ROLE so it can initiate the LBP swap'
    },
    /////////// Nope DAO /////////
    {
      target: 'nopeDAO',
      values: '0',
      method: 'setVotingPeriod(uint256)',
      arguments: ['26585'], // (86400 * 4) / 13 seconds (assumed 13s block time)
      description: 'Set the voting period for the NopeDAO to 4 days'
    },
    ////////  Transfer CREAM to TribalCouncil Multisig  /////////
    {
      target: 'cream',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: ['{tribalCouncilSafe}', '31780370000000000000000'],
      description: 'Transfer CREAM to TribalCouncil multisig where it will then be swapped'
    }
  ],
  description: `
  FIP-105: Reinforce PCV by consolidating assets and performing technical maintenance

  This FIP implements part of the PCV reinforcement proposal that was approved in this snapshot:
  https://snapshot.fei.money/#/proposal/0x2fd5bdda0067098f6c0520fe309dfe90ca403758f0ce98c1854a00bf38999674 
  and discussed in this forum post: https://tribe.fei.money/t/fip-104-fei-pcv-reinforcement-proposal/4162?page=2 

  Specifically, it liquidates the protocol's DPI holdings to DAI using a Balancer LBP and it transfers the protocol's 
  CREAM holdings to the TribalCouncil multisig. The TribalCouncil will then be able to liquidate the position on a DEX.

  In addition, the FIP introduces several technical maintenance tasks:
  - Add and remove the relevant PCV deposits from the Collaterization Oracle
  - Grant the TribalCouncil the role required to initiate the LBP auction
  - Grant a new skimmer contract the role necessary to skim excess Fei from the DAI PSM
  - Fix a bug in the NopeDAO configuration that previously set the voting period to 22 months rather than the
    expected 4 days
  `
};

export default fip_105;
