import { MainnetContracts, NamedAddresses, ProposalConfig } from '@custom-types/types';
import { Contract, Signer } from 'ethers';
import format from 'string-template';

export async function simulateDEBUGProposal(
  signer: Signer,
  contractAddresses: NamedAddresses,
  contracts: MainnetContracts,
  config: ProposalConfig
) {
  let totalGasUsed = 0;
  for (let i = 0; i < config.proposal.commands.length; i++) {
    const cmd = config.proposal.commands[i];
    // build tx & print details
    console.log('  Step' + (config.proposal.commands.length >= 10 && i < 10 ? ' ' : ''), i, ':', cmd.description);
    const to = contractAddresses[cmd.target] || cmd.target;
    const value = cmd.values;
    const args = replaceArgs(cmd.arguments, contractAddresses);
    const ethersContract: Contract = contracts[cmd.target] as Contract;
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

// Recursively interpolate strings in the argument array
export function replaceArgs(args: any[], contractNames: NamedAddresses): any[] {
  const result = [];
  for (let i = 0; i < args.length; i++) {
    const element = args[i];
    if (typeof element === typeof '') {
      const formatted = format(element, contractNames);
      result.push(formatted);
    } else if (typeof element === typeof []) {
      result.push(replaceArgs(element, contractNames));
    } else {
      result.push(element);
    }
  }
  return result;
}
