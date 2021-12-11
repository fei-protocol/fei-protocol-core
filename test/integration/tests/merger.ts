import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { TRIBERagequit, PegExchanger } from '@custom-types/contracts';
import { expectApprox } from '@test/helpers';
import { createTree } from '@scripts/utils/merkle';
import { solidityKeccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-merger', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

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
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('TribeRagequit', async function () {
    const guardianBalance = '18884018000000000000000000';

    it('ngmi', async function () {
      const tribeRagequit: TRIBERagequit = contracts.tribeRagequit as TRIBERagequit;
      const { fei, tribe } = contracts;

      // Construct merkle tree and leaf for guardian
      const tree = createTree();
      const guardian = contractAddresses.multisig;
      const leaf = solidityKeccak256(['address', 'uint256'], [guardian, guardianBalance]);

      // Construct proof for guardian
      const proof = tree.getProof(leaf);
      const proofArray = [];
      proof.map(function (key, index) {
        proofArray.push(key.data);
      });

      const signer = await getImpersonatedSigner(guardian);

      await time.increaseTo(await tribeRagequit.rageQuitStart());

      // Ragequit 1 TRIBE
      const feiBalanceBefore = await fei.balanceOf(guardian);
      const tribeBalanceBefore = await tribe.balanceOf(guardian);
      await tribe.connect(signer).approve(tribeRagequit.address, ethers.constants.MaxUint256);

      await tribeRagequit.connect(signer).ngmi(ethers.constants.WeiPerEther, guardianBalance, proofArray);
      const feiBalanceAfter = await fei.balanceOf(guardian);
      const tribeBalanceAfter = await tribe.balanceOf(guardian);

      expect(tribeBalanceBefore.sub(tribeBalanceAfter)).to.be.equal(ethers.constants.WeiPerEther);
      expect(feiBalanceAfter.sub(feiBalanceBefore)).to.be.bignumber.equal(toBN('1237113801000000000'));

      // Ragequit original TRIBE fails
      expect(tribeRagequit.connect(signer).ngmi(guardianBalance, guardianBalance, proofArray)).to.be.revertedWith(
        'exceeds ragequit limit'
      );

      // Ragequit all held TRIBE succeeds
      await tribeRagequit.connect(signer).ngmi(await tribe.balanceOf(guardian), guardianBalance, proofArray);
      expect(await tribe.balanceOf(guardian)).to.be.bignumber.equal(toBN(0));
    });
  });

  describe('PegExchanger', async () => {
    const RGT_WHALE = '0x20017a30D3156D4005bDA08C40Acda0A6aE209B1';

    it('exchanges RGT for TRIBE', async function () {
      const pegExchanger: PegExchanger = contracts.pegExchanger as PegExchanger;
      const { rgt, tribe } = contracts;

      const signer = await getImpersonatedSigner(RGT_WHALE);

      const rgtBalanceBefore = await rgt.balanceOf(RGT_WHALE);
      const tribeBalanceBefore = await tribe.balanceOf(RGT_WHALE);
      await rgt.connect(signer).approve(pegExchanger.address, ethers.constants.MaxUint256);

      await pegExchanger.connect(signer).exchange(ethers.constants.WeiPerEther);
      const rgtBalanceAfter = await rgt.balanceOf(RGT_WHALE);
      const tribeBalanceAfter = await tribe.balanceOf(RGT_WHALE);

      expect(rgtBalanceBefore.sub(rgtBalanceAfter)).to.be.bignumber.equal(ethers.constants.WeiPerEther);
      expectApprox(tribeBalanceAfter.sub(tribeBalanceBefore), ethers.constants.WeiPerEther.mul(27));
    });
  });
});
