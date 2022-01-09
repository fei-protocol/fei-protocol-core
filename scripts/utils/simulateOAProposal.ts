import { ethers } from 'hardhat';
import { MainnetContracts, NamedAddresses, ProposalDescription } from '@custom-types/types';
import format from 'string-template';
import { OptimisticTimelock } from '@custom-types/contracts';
import { getImpersonatedSigner, time } from '@test/helpers';
import { Contract } from '@ethersproject/contracts';

export default async function simulateOAProposal(
  proposalInfo: ProposalDescription,
  contracts: MainnetContracts,
  contractAddresses: NamedAddresses,
  logging = false
) {
  const timelock: OptimisticTimelock = contracts.optimisticTimelock as OptimisticTimelock;
  const signer = await getImpersonatedSigner(contractAddresses.optimisticMultisig);

  logging && console.log(`Constructing proposal ${proposalInfo.title}`);

  const salt = ethers.utils.id(proposalInfo.title);
  const predecessor = ethers.constants.HashZero;
  const targets = [];
  const values = [];
  const datas = [];
  const delay = await timelock.getMinDelay();

  for (let i = 0; i < proposalInfo.commands.length; i += 1) {
    const command = proposalInfo.commands[i];

    const ethersContract: Contract = contracts[command.target] as Contract;

    const target = contractAddresses[command.target];
    targets.push(target);
    values.push(command.values);

    const args = replaceArgs(command.arguments, contractAddresses);
    const data = ethersContract.interface.encodeFunctionData(command.method, args);
    datas.push(data);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  logging && console.log(`Scheduling proposal ${proposalInfo.title}`);

  const proposalId = await timelock.hashOperationBatch(targets, values, datas, predecessor, salt);

  console.log('proposalId: ', proposalId);
  if (!proposalId || !(await timelock.isOperation(proposalId))) {
    const schedule = await timelock.connect(signer).scheduleBatch(targets, values, datas, predecessor, salt, delay);
    console.log('Calldata:', schedule.data);
  } else {
    console.log('Already scheduled proposal');
  }

  await time.increase(delay);

  if ((await timelock.isOperationReady(proposalId)) && !(await timelock.isOperationDone(proposalId))) {
    logging && console.log(`Executing proposal ${proposalInfo.title}`);
    const execute = await timelock.connect(signer).executeBatch(targets, values, datas, predecessor, salt);
    console.log('Execute Calldata:', execute.data);
  } else {
    console.log('Operation not ready for execution');
  }
}

// Recursively interpolate strings in the argument array
const replaceArgs = (args: any[], contractNames: NamedAddresses) => {
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
};
