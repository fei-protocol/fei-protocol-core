import { ethers } from 'hardhat';
import { MainnetContracts, NamedAddresses, TemplatedProposalDescription } from '@custom-types/types';
import { OptimisticTimelock } from '@custom-types/contracts';
import { getImpersonatedSigner, time } from '@test/helpers';
import { Contract } from '@ethersproject/contracts';
import { forceEth } from '@test/integration/setup/utils';
import { TRIBAL_COUNCIL_POD_ID } from '@protocol/optimisticGovernance';
import { PodConfig } from './constructProposalCalldata';

export async function simulateTCProposal(
  proposalInfo: TemplatedProposalDescription,
  contracts: MainnetContracts,
  contractAddresses: NamedAddresses,
  logging = false
) {
  const timelockTC = contracts.tribalCouncilTimelock as OptimisticTimelock;
  const multisigAddressTC = contractAddresses.tribalCouncilSafe as string;
  const podConfig: PodConfig = {
    id: TRIBAL_COUNCIL_POD_ID,
    timelockAddress: contractAddresses.tribalCouncilTimelock
  };
  await simulatePodProposal(
    timelockTC,
    multisigAddressTC,
    proposalInfo,
    contracts,
    contractAddresses,
    logging,
    podConfig
  );
}

export async function simulatePodProposal(
  timelock: OptimisticTimelock,
  multisigAddress: string,
  proposalInfo: TemplatedProposalDescription,
  contracts: MainnetContracts,
  contractAddresses: NamedAddresses,
  logging = false,
  podConfig: PodConfig
) {
  await forceEth(multisigAddress);
  const signer = await getImpersonatedSigner(multisigAddress);
  logging && console.log(`Constructing proposal ${proposalInfo.title}`);

  const salt = ethers.utils.id(proposalInfo.title);
  const predecessor = ethers.constants.HashZero;
  const targets = [];
  const values = [];
  const datas = [];
  const delay = await timelock.getMinDelay();

  for (let i = 0; i < proposalInfo.commands.length; i += 1) {
    const command = proposalInfo.commands[i];

    if (contracts[command.target as keyof MainnetContracts] === undefined) {
      throw new Error(`Unknown contract ${command.target}, cannot parse (from MainnetContracts)`);
    }

    if (contractAddresses[command.target] === undefined) {
      throw new Error(`Unknown contract ${command.target}, cannot parse (from NamedAddresses)`);
    }

    const ethersContract: Contract = contracts[command.target as keyof MainnetContracts] as Contract;
    const target = contractAddresses[command.target];

    targets.push(target);
    values.push(command.values);

    const generateArgsFunc = command.arguments;
    if (typeof generateArgsFunc !== 'function') {
      throw new Error(`Command ${command.target} has no arguments function (cannot use direct assignments)`);
    }
    const args = generateArgsFunc(contractAddresses);

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

    // Register the pod's metadata
    console.log(`Registering proposal ${proposalId} of pod ${podConfig.id}`);
    const registerTx = await contracts.governanceMetadataRegistry
      .connect(signer)
      .registerProposal(podConfig.id, proposalId, proposalInfo.description);
    console.log('Metadata tx: ', registerTx.data);
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
