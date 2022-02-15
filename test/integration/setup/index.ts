import { ethers } from 'hardhat';
import { permissions } from '@protocol/permissions';
import { getAllContractAddresses, getAllContracts } from './loadContracts';
import {
  Config,
  ContractAccessRights,
  TestCoordinator,
  Env,
  ProposalConfig,
  namedContractsToNamedAddresses,
  NamedAddresses,
  NamedContracts,
  DeployUpgradeFunc,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  MainnetContracts,
  ProposalCategory
} from '@custom-types/types';
import { sudo } from '@scripts/utils/sudo';
import constructProposal from '@scripts/utils/constructProposal';
import '@nomiclabs/hardhat-ethers';
import { resetFork } from '@test/helpers';
import simulateOAProposal from '@scripts/utils/simulateOAProposal';
import { forceEth } from '@test/integration/setup/utils';
import { getImpersonatedSigner } from '@test/helpers';

/**
 * Coordinate initialising an end-to-end testing environment
 * Able to run against the protocol deployed on Mainnet or
 * with additional contracts deployed in an upgrade locally
 */
export class TestEndtoEndCoordinator implements TestCoordinator {
  private mainnetContracts: NamedContracts;
  private afterUpgradeContracts: NamedContracts;
  private afterUpgradeAddresses: NamedAddresses;

  constructor(private config: Config, private proposals: any) {
    this.proposals = proposals;
  }

  public async initMainnetContracts(): Promise<void> {
    this.mainnetContracts = (await getAllContracts()) as unknown as NamedContracts;
  }

  /**
   * Setup end to end tests for a local environment. This involves e2e testing
   * contracts not yet deployed.
   *
   * Specifically:
   * 1) Get all contracts not being upgraded that are already deployed to Mainnet
   * 2) Deploy new contracts being upgraded
   * 3) Apply appropriate permissions to the contracts e.g. minter, burner priviledges
   *
   */
  public async loadEnvironment(): Promise<Env> {
    await resetFork();
    await this.initMainnetContracts();
    let existingContracts = this.mainnetContracts;

    this.setLocalTestContracts(existingContracts);

    // Grant privileges to deploy address
    await sudo(existingContracts, this.config.logging);

    const proposalNames = Object.keys(this.proposals);
    for (let i = 0; i < proposalNames.length; i++) {
      existingContracts = await this.applyUpgrade(
        existingContracts,
        proposalNames[i],
        this.proposals[proposalNames[i]]
      );
    }

    this.afterUpgradeAddresses = {
      ...getAllContractAddresses(),
      ...namedContractsToNamedAddresses(existingContracts)
    };

    return { contracts: this.afterUpgradeContracts, contractAddresses: this.afterUpgradeAddresses };
  }

  /**
   * Apply an upgrade to the locally instantiated protocol
   */
  async applyUpgrade(
    existingContracts: NamedContracts,
    proposalName: string,
    config: ProposalConfig
  ): Promise<NamedContracts> {
    let deployedUpgradedContracts = {};

    if (config.proposalId) {
      this.config.logging && console.log(`Checking proposal completed`);
      const feiDAO = existingContracts.feiDAO;

      const state = await feiDAO.state(config.proposalId);
      if (state === 7) {
        this.config.logging && console.log(`Proposal completed on-chain, skipping`);
        return existingContracts;
      }
    }

    // Get the upgrade setup and teardown scripts
    const { deploy, setup, teardown, validate } = await import('@proposals/dao/' + proposalName);

    const contractAddressesBefore: { [key: string]: string } = {
      ...namedContractsToNamedAddresses(this.mainnetContracts),
      ...namedContractsToNamedAddresses(existingContracts),
      ...getAllContractAddresses()
    };

    if (config.deploy) {
      this.config.logging && console.log(`Applying upgrade for proposal: ${proposalName}`);
      const deployTyped = deploy as DeployUpgradeFunc;
      deployedUpgradedContracts = await deployTyped(
        this.config.deployAddress,
        contractAddressesBefore,
        this.config.logging
      );
    }

    const contracts: NamedContracts = {
      ...existingContracts,
      ...deployedUpgradedContracts
    };

    this.setLocalTestContracts(contracts);
    this.setLocalTestContractAddresses(contracts);

    const contractAddresses: { [key: string]: string } = {
      ...namedContractsToNamedAddresses(this.mainnetContracts),
      ...namedContractsToNamedAddresses(contracts),
      ...getAllContractAddresses()
    };

    // setup the DAO proposal
    const setupTyped = setup as SetupUpgradeFunc;
    await setupTyped(contractAddresses, existingContracts, contracts, this.config.logging);

    if (config.category === ProposalCategory.DAO) {
      // Simulate the DAO proposal
      const proposal = await constructProposal(
        config.proposal,
        contracts as unknown as MainnetContracts,
        contractAddresses,
        this.config.logging
      );
      this.config.logging && console.log(`Simulating DAO proposal...`);
      await proposal.simulate();
    }

    if (config.category === ProposalCategory.DEBUG) {
      console.log('Simulating DAO proposal in DEBUG mode (step by step)...');
      console.log('  Title: ', config.proposal.title);

      const signer = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
      await forceEth(contracts.feiDAOTimelock.address);

      let totalGasUsed = 0;
      for (let i = 0; i < config.proposal.commands.length; i++) {
        const cmd = config.proposal.commands[i];
        // build tx & print details
        console.log('  Step' + (config.proposal.commands.length >= 10 && i < 10 ? ' ' : ''), i, ':', cmd.description);
        let types = [];
        if (cmd.method.indexOf('(') !== -1 && cmd.method.indexOf('()') === -1) {
          // e.g. ['address', 'bytes32', 'uint256'], or empty array []
          types = cmd.method.split('(')[1].split(')')[0].split(',');
        }
        const cmdArguments = cmd.arguments.map((arg) => {
          if (arg.indexOf('{') == 0) {
            arg = contractAddresses[arg.replace('{', '').replace('}', '')] || arg;
          }
          return arg;
        });
        const functionSig = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(cmd.method));
        const calldata = ethers.utils.defaultAbiCoder
          .encode(types, cmdArguments)
          .replace('0x', functionSig.substring(0, 10)); // prepend function signature
        const to = contractAddresses[cmd.target] || cmd.target;
        const value = cmd.values;
        console.log('    Target:', cmd.target, '[' + to + ']');
        console.log('    Method:', cmd.method);
        types.forEach((type, i) => {
          console.log('      Argument', i, '[' + type + ']', cmdArguments[i]);
        });
        //console.log('    Value:', value);
        //console.log('    Calldata:', calldata);
        process.stdout.write('    Calling... ');
        // send tx
        const tx = await signer.sendTransaction({ data: calldata, to, value: Number(value) });
        const d = await tx.wait();
        process.stdout.write('Done. Used ' + d.cumulativeGasUsed.toString() + ' gas.\n');
        totalGasUsed += Number(d.cumulativeGasUsed.toString());
      }
      console.log('  Done. Used', totalGasUsed, 'gas in total.');
    }

    if (config.category === ProposalCategory.OA) {
      this.config.logging && console.log(`Simulating OA proposal...`);
      await simulateOAProposal(
        config.proposal,
        contracts as unknown as MainnetContracts,
        contractAddresses,
        this.config.logging
      );
    }

    // teardown the DAO proposal
    this.config.logging && console.log(`Running proposal teardown...`);
    const teardownTyped = teardown as TeardownUpgradeFunc;
    await teardownTyped(contractAddresses, existingContracts, contracts, this.config.logging);

    if (validate) {
      this.config.logging && console.log(`Running proposal validation...`);
      const validateTyped = validate as ValidateUpgradeFunc;
      await validateTyped(contractAddresses, existingContracts, contracts, this.config.logging);
    }

    return contracts;
  }

  /**
   * Set the web3 contracts used in the test environment
   */
  setLocalTestContracts(contracts: NamedContracts): void {
    this.afterUpgradeContracts = contracts;
  }

  /**
   * Set the addresses of the contracts used in the test environment
   */
  async setLocalTestContractAddresses(contracts: NamedContracts): Promise<void> {
    this.afterUpgradeAddresses = { ...(contracts as unknown as NamedAddresses) };
  }

  /**
   * Revoke permissions granted to deploy address
   */
  async revokeDeployAddressPermission(): Promise<void> {
    await this.afterUpgradeContracts.core.revokeMinter(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokeBurner(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokePCVController(this.config.deployAddress);
    await this.afterUpgradeContracts.core.revokeGovernor(this.config.deployAddress);
  }

  /**
   * Get the access control mapping for the contracts. The access control is managed by the
   * permissions contract
   */
  getAccessControlMapping(): ContractAccessRights {
    const accessControlRoles = {};

    // Array of all deployed contracts
    Object.keys(permissions).map((role) => {
      const contracts = permissions[role];
      const addresses = contracts.map((contractName) => {
        return this.afterUpgradeAddresses[contractName];
      });

      accessControlRoles[role] = addresses;
    });

    return accessControlRoles as ContractAccessRights;
  }
}
