import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, increaseTime, latestTime, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config.json';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import {
  Core,
  Fei,
  FeiDAO,
  FeiDAOTimelock,
  GovernorAlpha,
  OptimisticTimelock,
  Timelock,
  OwnableTimedMinter,
  Tribe
} from '@custom-types/contracts';
import { getAllContracts } from '../setup/loadContracts';
import { BigNumber } from '@ethersproject/bignumber';
const toBN = ethers.BigNumber.from;

const gnosisSafeABI = `[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"AddedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"approvedHash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"owner","type":"address"}],"name":"ApproveHash","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"masterCopy","type":"address"}],"name":"ChangedMasterCopy","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"threshold","type":"uint256"}],"name":"ChangedThreshold","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract Module","name":"module","type":"address"}],"name":"DisabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"contract Module","name":"module","type":"address"}],"name":"EnabledModule","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"module","type":"address"}],"name":"ExecutionFromModuleSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bytes32","name":"txHash","type":"bytes32"},{"indexed":false,"internalType":"uint256","name":"payment","type":"uint256"}],"name":"ExecutionSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"RemovedOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"msgHash","type":"bytes32"}],"name":"SignMsg","type":"event"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"constant":true,"inputs":[],"name":"NAME","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"addOwnerWithThreshold","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes32","name":"hashToApprove","type":"bytes32"}],"name":"approveHash","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"approvedHashes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_masterCopy","type":"address"}],"name":"changeMasterCopy","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"changeThreshold","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"contract Module","name":"prevModule","type":"address"},{"internalType":"contract Module","name":"module","type":"address"}],"name":"disableModule","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"domainSeparator","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"contract Module","name":"module","type":"address"}],"name":"enableModule","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"encodeTransactionData","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address payable","name":"refundReceiver","type":"address"},{"internalType":"bytes","name":"signatures","type":"bytes"}],"name":"execTransaction","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModule","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"}],"name":"execTransactionFromModuleReturnData","outputs":[{"internalType":"bool","name":"success","type":"bool"},{"internalType":"bytes","name":"returnData","type":"bytes"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes","name":"message","type":"bytes"}],"name":"getMessageHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getModules","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"start","type":"address"},{"internalType":"uint256","name":"pageSize","type":"uint256"}],"name":"getModulesPaginated","outputs":[{"internalType":"address[]","name":"array","type":"address[]"},{"internalType":"address","name":"next","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getOwners","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getThreshold","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"},{"internalType":"uint256","name":"safeTxGas","type":"uint256"},{"internalType":"uint256","name":"baseGas","type":"uint256"},{"internalType":"uint256","name":"gasPrice","type":"uint256"},{"internalType":"address","name":"gasToken","type":"address"},{"internalType":"address","name":"refundReceiver","type":"address"},{"internalType":"uint256","name":"_nonce","type":"uint256"}],"name":"getTransactionHash","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"isOwner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes","name":"_data","type":"bytes"},{"internalType":"bytes","name":"_signature","type":"bytes"}],"name":"isValidSignature","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"nonce","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"_threshold","type":"uint256"}],"name":"removeOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"enum Enum.Operation","name":"operation","type":"uint8"}],"name":"requiredTxGas","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"handler","type":"address"}],"name":"setFallbackHandler","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address[]","name":"_owners","type":"address[]"},{"internalType":"uint256","name":"_threshold","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"address","name":"fallbackHandler","type":"address"},{"internalType":"address","name":"paymentToken","type":"address"},{"internalType":"uint256","name":"payment","type":"uint256"},{"internalType":"address payable","name":"paymentReceiver","type":"address"}],"name":"setup","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"bytes","name":"_data","type":"bytes"}],"name":"signMessage","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"signedMessages","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"prevOwner","type":"address"},{"internalType":"address","name":"oldOwner","type":"address"},{"internalType":"address","name":"newOwner","type":"address"}],"name":"swapOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]"`;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe.only('e2e-fip-34', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
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

    contracts = await getAllContracts();

    /*
      e2eCoord = new TestEndtoEndCoordinator(config, proposals);
      doLogging && console.log(`Loading environment...`);
      ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
      doLogging && console.log(`Environment loaded.`); 
      */

    doLogging && console.log(`Environment loading skipped; this is a pure forked-mainnet test.`);
    doLogging && console.log(`(no impersonating of contract addresses here except the guardian)`);
  });

  describe('fip-34', async function () {
    it('works when we roll back the timelock just before scheduling the vote result', async function () {
      const feiDAO = contracts.feiDAO as FeiDAO;
      const feiDAOTimelock = contracts.feiDAOTimelock as FeiDAOTimelock;
      const governorAlphaTimelock = contracts.timelock as Timelock;
      const fei = contracts.fei as Fei;
      const optimisticTimelock = contracts.optimisticTimelock as OptimisticTimelock;
      const optimisticMinter = contracts.optimisticMinter as OwnableTimedMinter;
      const tribe = contracts.tribe as Tribe;

      const joeyAddress = '0xe0ac4559739bD36f0913FB0A3f5bFC19BCBaCD52';
      const calebAddress = '0xb81cf4981Ef648aaA73F07a18B03970f04d5D8bF';
      const stormAddress = '0xC64Ed730e030BdCB66E9B5703798bb4275A5a484';
      const briAddress = '0x90300D66AF91d5EAB695A07c274E61e1563967C9';
      const nascentAddress = '0x70b6ab736be7672c917a1ab11e67b5bc9fddeca9';
      const buckleyAddress = '0x66b9d411e14fbc86424367b67933945fd7e40b11';
      const frameworkAddress = '0x961bcb93666e0ea73b6d88a03817cb36f93a6dd9';
      const guardianAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';

      const joeySigner = await getImpersonatedSigner(joeyAddress);
      const calebSigner = await getImpersonatedSigner(calebAddress);
      const stormSigner = await getImpersonatedSigner(stormAddress);
      const briSigner = await getImpersonatedSigner(briAddress);
      const nascentSigner = await getImpersonatedSigner(nascentAddress);
      const buckleySigner = await getImpersonatedSigner(buckleyAddress);
      const frameworkSigner = await getImpersonatedSigner(frameworkAddress);
      const guardianSigner = await getImpersonatedSigner(guardianAddress);

      // Guardian rolls back the timelock to the old timelock

      // Queue FIP-34 (calldata generated by running the calldata npm script)
      const calldata =
        '0x7d5e81e2000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000240000000000000000000000000000000000000000000000000000000000000058000000000000000000000000000000000000000000000000000000000000000060000000000000000000000008d5ed43dca8c2f7dfb20cf7b53cc7e593635d7b90000000000000000000000008d5ed43dca8c2f7dfb20cf7b53cc7e593635d7b9000000000000000000000000956f47f50a910163d8bf957cf5846d573e7f87ca0000000000000000000000008d5ed43dca8c2f7dfb20cf7b53cc7e593635d7b9000000000000000000000000c7283b66eb1eb5fb86327f08e1b5816b0720212b0000000000000000000000000bef27feb58e857046d630b2c03dfb7bae5674940000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000026000000000000000000000000000000000000000000000000000000000000002c00000000000000000000000000000000000000000000000000000000000000024261707fa000000000000000000000000e66c4de480bd317054b5a3cf8e8689649d0728c9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024261707fa000000000000000000000000639572471f2f318464dc01066a56867130e45e2500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004440c10f19000000000000000000000000bc9c084a12678ef5b516561df902fdc426d9548300000000000000000000000000000000000000000052b7d2dcc80cd2e4000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024cfbd4885000000000000000000000000639572471f2f318464dc01066a56867130e45e25000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024fca3b5aa000000000000000000000000d51dba7a94e1adea403553a8235c302cebf41a3c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024a890c910000000000000000000000000d51dba7a94e1adea403553a8235c302cebf41a3c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002fa4649502d33343a204f7074696d6973746963204d696e7465720a53756d6d6172793a0a4772616e74206f7074696d697374696320617070726f76616c207468652072617465206c696d69746564206162696c69747920746f206d696e74204645492c20746f20636f6e74696e756520746f2066756e642044414f206f7065726174696f6e73206c696b65204649502d3133206c656e64696e67206465706c6f796d656e747320616e6420706f74656e7469616c6c79204c69717569646974792d61732d612d536572766963652e0a4164646974696f6e616c6c79206d696e7420616e20696e697469616c203130304d2046454920746f207468652074696d656c6f636b2e0a0a4d6f7469766174696f6e3a0a496e7374656164206f6620636f6e74696e75616c6c7920676f696e67206261636b20746f207468652044414f20746f2061736b20666f72206d6f72652066756e64696e672c204665692050726f746f636f6c2063616e206465706c6f79206120636f6e747261637420776869636820616c6c6f777320746865204f412074696d656c6f636b20746f206d696e742046454920706572696f646963616c6c792e0a54686973206d696e7465722077696c6c2068617665206120686172642072617465206c696d6974206f6e2074686520616d6f756e74206d696e7465642e205468657365206d696e74696e67732077696c6c207374696c6c206265207375626a65637420746f207468652034206461792074696d656c6f636b2c2062757420776f756c64206e6f74207265717569726520676f7665726e616e636520696e74657276656e74696f6e2e0a0a466f72756d2064697363757373696f6e3a2068747470733a2f2f74726962652e6665692e6d6f6e65792f742f6669702d33342d6665692d6d696e74696e672d666f722d6f7074696d69737469632d617070726f76616c2f33353635200a436f64653a2068747470733a2f2f6769746875622e636f6d2f6665692d70726f746f636f6c2f6665692d70726f746f636f6c2d636f72652f70756c6c2f3235390a000000000000';

      const proposeTxReceipt = await (await joeySigner.sendTransaction({ to: feiDAO.address, data: calldata })).wait();
      const proposeTxLog = proposeTxReceipt.logs[0];
      const parsedLog = feiDAO.interface.parseLog(proposeTxLog);
      const proposalId = parsedLog.args[0];

      doLogging && console.log(`ProposalID: ${parsedLog}`);

      // Send eth to voters
      const vitalikAddress = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
      const vitalikSigner = await getImpersonatedSigner(vitalikAddress);

      await vitalikSigner.sendTransaction({ to: nascentAddress, value: ethers.utils.parseEther('5') });
      await vitalikSigner.sendTransaction({ to: buckleyAddress, value: ethers.utils.parseEther('5') });
      await vitalikSigner.sendTransaction({ to: frameworkAddress, value: ethers.utils.parseEther('5') });

      // Wait 1 hour
      await time.increase(3600);

      // Vote
      doLogging && console.log(`Voting for proposal (joey)`);
      await (await feiDAO.connect(joeySigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (caleb)`);
      await (await feiDAO.connect(calebSigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (storm)`);
      await (await feiDAO.connect(stormSigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (bri)`);
      await (await feiDAO.connect(briSigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (buckley)`);
      await (await feiDAO.connect(buckleySigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (framework)`);
      await (await feiDAO.connect(frameworkSigner).castVote(proposalId, 1)).wait();

      doLogging && console.log(`Voting for proposal (nascent)`);
      await (await feiDAO.connect(nascentSigner).castVote(proposalId, 1)).wait();

      const proposalData = await feiDAO.proposals(proposalId);

      const endBlock = proposalData[4];
      const votesFor = ethers.utils.parseUnits(proposalData[5].toString(), 'wei');

      doLogging && console.log(`# of votes so far: ${votesFor}`);

      // Advance to end of voting period and roll back the timelock via the guardian
      await time.advanceBlockTo(endBlock.toNumber() + 1);
      await (await feiDAOTimelock.connect(guardianSigner).rollback()).wait();

      // Queue FIP-34
      await (await feiDAO.connect(joeySigner)['queue(uint256)'](proposalId)).wait();

      // Wait 3 days
      await time.increase(259200);

      // Execute FIP-34
      await (await feiDAO.connect(joeySigner)['execute(uint256)'](proposalId)).wait();

      // Check everything
      expect(await fei.balanceOf(optimisticTimelock.address)).to.be.bignumber.greaterThan(
        ethers.constants.WeiPerEther.mul(100_000_000)
      );

      expect(await optimisticMinter.owner()).to.be.equal(optimisticTimelock.address);
      expect(await optimisticMinter.isTimeStarted()).to.be.true;
      expect(await governorAlphaTimelock.admin()).to.be.equal(feiDAO.address);
      expect(await feiDAOTimelock.admin()).to.be.equal(feiDAO.address);
      expect(await feiDAO.timelock()).to.be.equal(feiDAOTimelock.address);
      expect(await tribe.minter()).to.be.equal(feiDAOTimelock.address);
    });
  });
});
