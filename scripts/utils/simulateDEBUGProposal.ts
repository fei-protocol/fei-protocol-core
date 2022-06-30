import { MainnetContracts, NamedAddresses, ProposalConfig, TemplatedProposalConfig } from '@custom-types/types';
import { Contract, Signer } from 'ethers';

export async function simulateDEBUGProposal(
  signer: Signer,
  contractAddresses: NamedAddresses,
  contracts: MainnetContracts,
  config: TemplatedProposalConfig
) {
  let totalGasUsed = 0;
  for (let i = 0; i < config.proposal!.commands.length; i++) {
    const cmd = config.proposal!.commands[i];
    // build tx & print details
    console.log('  Step' + (config.proposal!.commands.length >= 10 && i < 10 ? ' ' : ''), i, ':', cmd.description);
    const to = contractAddresses[cmd.target] || cmd.target;
    const value = cmd.values;

    const args = cmd.arguments(contractAddresses);
    const ethersContract: Contract = contracts[cmd.target as keyof MainnetContracts] as Contract;
    const calldata = ethersContract.interface.encodeFunctionData(cmd.method, args);
    console.log('    Target:', cmd.target, '[' + to + ']');
    console.log('    Method:', cmd.method, '- Calling...');

    // send tx
    const tx = await signer.sendTransaction({ data: calldata, to, value: Number(value) });
    const d = await tx.wait();
    console.log('    Done. Used ' + d.cumulativeGasUsed.toString() + ' gas.');
    totalGasUsed += Number(d.cumulativeGasUsed.toString());
  }
  console.log('  Done. Used', totalGasUsed, 'gas in total.');
}
