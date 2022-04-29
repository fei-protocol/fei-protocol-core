import { ProposalDescription } from '@custom-types/types';

const fip_98: ProposalDescription = {
  title: 'FIP-98: Purchase 10m VOLT',
  commands: [
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiDAOTimelock}', '10170000000000000000000000'],
      description: 'Mint $10.17M FEI'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{voltFeiSwapContract}', '10170000000000000000000000'],
      description: 'Approve 10.17m Fei to be spent by the otc contract on the timelocks behalf'
    },
    {
      target: 'voltFeiSwapContract',
      values: '0',
      method: 'swap()',
      arguments: [],
      description: 'Swap fei for Volt'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'setOracle(address,address)',
      arguments: ['{volt}', '{voltOracle}'],
      description: 'Set oracle for Volt'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposits(address[])',
      arguments: [['{voltDepositWrapper}']],
      description: 'Add Volt to the collaterlization oracle'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: ['{turboFusePCVDeposit}'],
      description: 'Add turboFusePCVDeposit to the pcv guardian'
    }
  ],
  description: `Swap 10.17m Fei for 10m VOLT as described in fip 88 https://tribe.fei.money/t/fip-88-volt-joins-the-tribe/4007, set Oracle Pass Through as the oracle for the Volt price, add voltPCVDepositWrapper to the CR Oracle, and add turboFusePCVDeposit to the PCVGuardian`
};

export default fip_98;
