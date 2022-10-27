import { Core } from '@custom-types/contracts';
import { ContractAccessRights, NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-dao', function () {
  let contracts: NamedContracts;
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
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('Access control', async () => {
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
        expect(numRoles.toNumber()).to.be.equal(
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
      expect(tribeMinter).to.equal(ethers.constants.AddressZero);
    });
  });
});
