import { Core } from '@custom-types/contracts';
import { ContractAccessRights, NamedAddresses, NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getImpersonatedSigner, increaseTime, latestTime, time } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';

describe('e2e-dao', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('FeiDAOTimelock', async function () {
    it('veto succeeds', async function () {
      const { feiDAO, feiDAOTimelock } = contracts;

      const eta = (await latestTime()) + 100000;
      const timelockSigner = await getImpersonatedSigner(feiDAO.address);
      await forceEth(feiDAO.address);
      const q = await feiDAOTimelock.connect(timelockSigner).queueTransaction(deployAddress, 100, '', '0x', eta);

      const txHash = (await q.wait()).events[0].args[0];
      expect(await feiDAOTimelock.queuedTransactions(txHash)).to.be.equal(true);

      await feiDAOTimelock
        .connect(await getImpersonatedSigner(deployAddress))
        .vetoTransactions([deployAddress], [100], [''], ['0x'], [eta]);
      expect(await feiDAOTimelock.queuedTransactions(txHash)).to.be.equal(false);
    });
  });

  describe('Fei DAO', function () {
    it('proposal succeeds', async function () {
      const feiDAO = contracts.feiDAO;

      const targets = [feiDAO.address];
      const values = [0];
      const calldatas = [
        '0x70b0f660000000000000000000000000000000000000000000000000000000000000000a' // set voting delay 10
      ];
      const description: any[] = [];

      const treasurySigner = await getImpersonatedSigner(contractAddresses.core);
      await forceEth(contractAddresses.core);
      await contracts.tribe.connect(treasurySigner).delegate(contractAddresses.guardianMultisig);
      const signer = await getImpersonatedSigner(contractAddresses.guardianMultisig);

      // Propose
      // note ethers.js requires using this notation when two overloaded methods exist)
      // https://docs.ethers.io/v5/migration/web3/#migration-from-web3-js--contracts--overloaded-functions
      await feiDAO
        .connect(signer)
        ['propose(address[],uint256[],bytes[],string)'](targets, values, calldatas, description);

      const pid = await feiDAO.hashProposal(targets, values, calldatas, ethers.utils.keccak256(description));

      await time.advanceBlock();

      // vote
      await feiDAO.connect(signer).castVote(pid, 1);

      // advance to end of voting period
      const endBlock = (await feiDAO.proposals(pid)).endBlock;
      await time.advanceBlockTo(endBlock.toNumber());

      // queue
      await feiDAO['queue(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      await time.increase('1000000');

      // execute
      await feiDAO['execute(address[],uint256[],bytes[],bytes32)'](
        targets,
        values,
        calldatas,
        ethers.utils.keccak256(description)
      );

      expect((await feiDAO.votingDelay()).toString()).to.be.equal('10');
    });
  });

  describe('Access control', async () => {
    before(async () => {
      // Revoke deploy address permissions, so that does not erroneously
      // contribute to num governor roles etc
      await e2eCoord.revokeDeployAddressPermission();
    });

    it('should have granted correct role cardinality', async function () {
      const core = contracts.core;
      const accessRights = e2eCoord.getAccessControlMapping();

      const roles = Object.keys(accessRights);

      for (let i = 0; i < roles.length; i++) {
        const element = roles[i];
        const id = ethers.utils.id(element);
        const numRoles = await core.getRoleMemberCount(id);
        doLogging && console.log(`Role count for ${element}: ${numRoles}`);
        // in e2e setup, deployer address has minter role
        expect(numRoles.toNumber() - (element == 'MINTER_ROLE' ? 1 : 0)).to.be.equal(
          accessRights[element as keyof ContractAccessRights].length,
          'role ' + element
        );
      }
    });

    it('should have granted contracts correct roles', async function () {
      const core: Core = contracts.core as Core;
      const accessControl = e2eCoord.getAccessControlMapping();
      const roles = Object.keys(accessControl);

      for (let i = 0; i < roles.length; i++) {
        const element = roles[i];
        const id = ethers.utils.id(element);
        for (let i = 0; i < accessControl[element as keyof ContractAccessRights].length; i++) {
          const contractAddress = accessControl[element as keyof ContractAccessRights][i];
          doLogging && console.log(`${element} contract address: ${contractAddress}`);
          const hasRole = await core.hasRole(id, contractAddress);
          expect(hasRole).to.be.equal(
            true,
            'expect contract ' +
              accessControl[element as keyof ContractAccessRights][i] +
              ' expected to have role ' +
              element
          );
        }
      }

      doLogging && console.log(`Testing tribe minter address...`);
      const tribe = contracts.tribe;
      const tribeMinter = await tribe.minter();
      expect(tribeMinter).to.equal(contractAddresses.tribeMinter);
    });
  });
});
