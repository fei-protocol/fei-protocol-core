import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { expectRevert, resetFork, ZERO_ADDRESS } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { Fei } from '@custom-types/contracts';
import { Signer } from '@ethersproject/abstract-signer';
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-fei', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let deploySigner: Signer;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let fei: Fei;

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

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    fei = contracts.fei as Fei;
    deploySigner = await ethers.getSigner(deployAddress);
  });

  describe('Fei Functionality', async function () {
    it('setIncentiveContract', async function () {
      expect(await contracts.core.isGovernor(deployAddress)).to.be.true;
      expect(fei.connect(deploySigner).setIncentiveContract(ZERO_ADDRESS, ZERO_ADDRESS)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
    });

    /* Tests disabled until restrictedPermissions is deployed. */

    it('burnFrom', async function () {
      expect(await contracts.core.isBurner(deployAddress)).to.be.true;
      expect(fei.connect(deploySigner).burnFrom(ZERO_ADDRESS, 10)).to.be.revertedWith(
        'RestrictedPermissions: Burner deprecated for contract'
      );
    });

    it('burnFrom', async function () {
      const balanceBefore = await fei.balanceOf(deployAddress);
      await fei.connect(deploySigner).burn(10);
      const balanceAfter = await fei.balanceOf(deployAddress);

      expect(balanceBefore.sub(balanceAfter)).to.be.bignumber.equal(toBN(10));
    });

    it('mint', async function () {
      expect(await contracts.core.isMinter(deployAddress)).to.be.true;
      await fei.connect(deploySigner).mint(contracts.core.address, 10);

      expect(await fei.balanceOf(contracts.core.address)).to.be.bignumber.equal(toBN(10));
    });
  });

  /* Test disabled until restrictedPermissions is deployed. */
  describe('CoreRef Functionality', async function () {
    it('setCore', async function () {
      expect(await contracts.core.isGovernor(deployAddress)).to.be.true;
      await expectRevert(fei.connect(deploySigner).setCore(ZERO_ADDRESS), 'CoreRef: Caller is not a governor');
    });

    it('pause/unpause', async function () {
      await contracts.core.grantGuardian(deployAddress);
      expect(await contracts.core.isGuardian(deployAddress)).to.be.true;

      await fei.connect(deploySigner).pause();
      expect(await fei.paused()).to.be.true;
      await fei.connect(deploySigner).unpause();
      expect(await fei.paused()).to.be.false;
    });
  });
});
