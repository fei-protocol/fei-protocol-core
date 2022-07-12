import { Timelock__factory } from '@custom-types/contracts';
import { MainnetContracts, NamedAddresses, TemplatedProposalDescription } from '@custom-types/types';
import { JsonRpcProvider } from '@ethersproject/providers';
import { errors, PACKAGE_NAME } from '@idle-finance/hardhat-proposals-plugin/dist/src/constants';
import {
  AlphaProposal,
  AlphaProposalBuilder
} from '@idle-finance/hardhat-proposals-plugin/dist/src/proposals/compound-alpha';
import { InternalProposalState } from '@idle-finance/hardhat-proposals-plugin/dist/src/proposals/proposal';
import { getImpersonatedSigner, time } from '@test/helpers';
import { BigNumber, ContractReceipt, ContractTransaction, utils } from 'ethers';
import hre from 'hardhat';
import { HardhatPluginError } from 'hardhat/plugins';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export class SigmaProposal extends AlphaProposal {
  protected async mineBlocks(blocks: any) {
    const blocksToMine = BigNumber.from(blocks);
    await hre.network.provider.send('hardhat_mine', [utils.hexStripZeros(blocksToMine.toHexString())]);
    console.log(
      `Mined ${blocksToMine.toString()} blocks via SigmaProposalBuilder. (kryptoklob just saved you ${
        blocksToMine.toNumber() / 10
      } seconds of your life.)`
    );
  }

  protected async mineBlock(timestamp?: number) {
    if (timestamp) {
      await time.increaseTo(timestamp);
    } else {
      await hre.network.provider.send('evm_mine');
    }
  }

  async simulate(fullSimulation = false, force?: boolean) {
    if (this.internalState != InternalProposalState.UNSUBMITTED && !force) {
      throw new HardhatPluginError(PACKAGE_NAME, errors.ALREADY_SIMULATED);
    }

    if (fullSimulation) await this._fullSimulate();
    else await this._simulate();

    this.internalState = InternalProposalState.SIMULATED;
  }

  // A better _simulate()
  public override async _simulate() {
    console.log('Simulating SigmaProposal with fixed simulator...');

    if (!this.governor) throw new HardhatPluginError(PACKAGE_NAME, errors.NO_GOVERNOR);

    const provider = hre.ethers.provider;

    await provider.send('hardhat_setBalance', [this.governor.address, '0xffffffffffffffff']);

    const governorSigner = await getImpersonatedSigner(this.governor.address);
    const timelock = Timelock__factory.connect(await this.governor.timelock(), governorSigner);

    await provider.send('hardhat_setBalance', [timelock.address, '0xffffffffffffffff']);

    const timelockSigner = await getImpersonatedSigner(timelock.address);

    const blockTimestamp = (await provider.getBlock('latest')).timestamp;

    const delay = await timelock.delay();

    const eta = delay.add(blockTimestamp).add('50');

    await provider.send('evm_setAutomine', [false]);

    console.time('queuetxs');
    for (let i = 0; i < this.targets.length; i++) {
      //console.time(`queuetx-${i}`);
      await timelock.queueTransaction(this.targets[i], this.values[i], this.signatures[i], this.calldatas[i], eta);
      //console.timeEnd(`queuetx-${i}`);
    }
    console.timeEnd('queuetxs');
    await this.mineBlocks(1);
    await this.mineBlock(eta.toNumber());

    const receipts = new Array<ContractTransaction>();

    await provider.send('evm_setAutomine', [true]);

    console.time('executetxs');
    for (let i = 0; i < this.targets.length; i++) {
      //console.time(`executetx-${i}`);
      await timelock
        .executeTransaction(this.targets[i], this.values[i], this.signatures[i], this.calldatas[i], eta)
        .then(
          (receipt) => {
            receipts.push(receipt);
          },
          async (timelockError) => {
            // analyse error
            const timelockErrorMessage = timelockError.error.message.match(/^[\w\s:]+'(.*)'$/m)[1];
            let contractErrorMesage;

            // call the method on the contract as if it was the timelock
            // this will produce a more relavent message as to the failure of the action
            const contract = await this.contracts[i]?.connect(timelockSigner);
            if (contract) {
              await contract.callStatic[this.signatures[i]](...this.args[i]).catch((contractError) => {
                contractErrorMesage = contractError.message.match(/^[\w\s:]+'(.*)'$/m)[1];
              });
            }

            throw new HardhatPluginError(
              PACKAGE_NAME,
              `Proposal action ${i} failed.
          Target: ${this.targets[i]}
          Signature: ${this.signatures[i]}
          Args: ${this.args[i]}\n
          Timelock revert message: ${timelockErrorMessage}
          Contract revert message: ${contractErrorMesage}`
            );
          }
        );
      //console.timeEnd(`executetx-${i}`);
    }
    await this.mineBlock();
    console.timeEnd('executetxs');

    console.time('getreceipts');
    await this.mineBlock();
    await this.mineBlock();
    for (let i = 0; i < this.targets.length; i++) {
      const r = await receipts[i].wait().catch((r) => {
        return r.receipt as ContractReceipt;
      });
      if (r.status != 1) {
        throw new HardhatPluginError(PACKAGE_NAME, `Action ${i} failed`);
      }
    }
    console.timeEnd('getreceipts');
    await provider.send('hardhat_stopImpersonatingAccount', [this.governor.address]);
    await provider.send('hardhat_stopImpersonatingAccount', [timelock.address]);
  }
}

export class SigmaProposalBuilder extends AlphaProposalBuilder {
  proposal: SigmaProposal;

  constructor(hre: HardhatRuntimeEnvironment, governor?: any, votingToken?: any, maxActions = 50) {
    super(hre);

    this.maxActions = maxActions;
    this.proposal = new SigmaProposal(hre, governor, votingToken);
  }

  build() {
    return this.proposal;
  }
}

/**
 * Constucts a hardhat proposal object
 * https://github.com/Idle-Finance/hardhat-proposals-plugin/blob/main/src/proposals/proposal.ts
 *
 */
export default async function constructProposal(
  proposalInfo: TemplatedProposalDescription,
  contracts: MainnetContracts,
  contractAddresses: NamedAddresses,
  logging = false
): Promise<SigmaProposal> {
  logging && console.log(`Constructing proposal...`);

  const proposalDescription = proposalInfo.description;

  const proposalBuilder = new SigmaProposalBuilder(
    hre,
    hre.config.proposals.governor,
    hre.config.proposals.votingToken
  );
  proposalBuilder.maxActions = 50;

  for (let i = 0; i < proposalInfo.commands.length; i += 1) {
    const command = proposalInfo.commands[i];
    const ethersContract = contracts[command.target as keyof MainnetContracts];

    const generateArgsFunc = command.arguments;
    if (typeof generateArgsFunc !== 'function') {
      throw new Error(`Command ${command.target} has no arguments function (cannot use direct assignments)`);
    }
    const args = generateArgsFunc(contractAddresses);

    proposalBuilder.addContractAction(ethersContract, command.method, args, command.values);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  proposalBuilder.setDescription(`${proposalInfo.title}\n${proposalDescription.toString()}`); // Set proposal description
  const proposal = proposalBuilder.build();
  logging && console.log(await proposal.printProposalInfo());
  return proposal;
}
