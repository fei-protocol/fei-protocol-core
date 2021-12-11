import { ProposalDescription } from '@custom-types/types';

const fip_45: ProposalDescription = {
  title: 'FIP-45: Angle Protocol Partnership',
  commands: [
    {
      target: 'core',
      values: '0',
      method: 'grantMinter(address)',
      arguments: ['{agEurAngleUniswapPCVDeposit}'],
      description: 'Make Angle-Uniswap PCVDeposit a minter'
    },
    {
      target: 'agEurAngleUniswapPCVDeposit',
      values: '0',
      method: 'mintAgToken(uint256)',
      arguments: ['10000000000000000000000000'],
      description: 'Use 10M FEI to mint agEUR'
    },
    {
      target: 'agEurAngleUniswapPCVDeposit',
      values: '0',
      method: 'deposit()',
      arguments: [],
      description: 'Deposit agEUR with minted FEI on Uniswap'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: ['{agEUR}', '{chainlinkEurUsdOracleWrapper}'],
      description: 'Add agEUR token oracle to CR Oracle'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: ['{agEurAngleUniswapPCVDeposit}'],
      description: 'Add agEUR deposit to CR Oracle'
    }
  ],
  description: `

Summary:
Spend 10M FEI to mint agEUR on Angle Protocol, and use these agEUR paired with ~10M FEI to provide liquidity on Uniswap-v2.
The Protocol-owned LP tokens will be staked to earn ANGLE token rewards.

Proposal:
Angle Protocol is another decentralized stablecoin protocol. They recently launched a Euro stablecoin backed by USD stablecoins at first, including FEI.
This proposal will mint 10M FEI to mint agEUR, and keep agEUR in the PCV.
The agEUR will be deposited on Uniswap-v2, where it will be matched with FEI to provide liquidity.
The LP tokens will be staked to earn ANGLE rewards at an expected APR of >5%.
Angle Protocol has strategies built on top of its reserves, and the FEI controlled by their protocol will be deployed to Aave.

Forum discussion: https://tribe.fei.money/t/potential-proposal-putting-some-fei-in-the-angle-protocol/3612/1
Code: https://github.com/fei-protocol/fei-protocol-core/pull/320
`
};

export default fip_45;
