import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, time, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
const toBN = ethers.BigNumber.from;
const tenPow18 = toBN('1000000000000000000');

const TOKEMAK_MANAGER_ROLLOVER_ADDRESS = '0x878510cde784681e4d10ca3eae6a8495d06902d2'; // has the rollover role
const TOKEMAK_MANAGER_ADDRESS = '0xa86e412109f77c45a3bc1c5870b880492fb86a14'; // tokemak manager
const TOKE_HOLDER_ADDRESS = '0x96f98ed74639689c3a11daf38ef86e59f43417d3'; // TOKE staking contract
const IPFS_JSON_FILE_HASH = 'QmP4Vzg45jExr3mcNsx9xxV1fNft95uVzgZGeLtkBXgpkx';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe.skip('e2e-fip-38-tokemak', function () {
  let contracts: NamedContracts;
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
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('should have deposited ETH, and be able to withdraw', async function () {
    const {
      ethTokemakPCVDeposit,
      tWETH // Tokemak ETH reactor
    } = contracts;

    // we should start with 10k tWETH, 0 ETH
    expect((await tWETH.balanceOf(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('10000')
    );
    expect((await ethers.provider.getBalance(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('0')
    );

    // request to withdraw 10k ETH
    await ethTokemakPCVDeposit.requestWithdrawal(tenPow18.mul(toBN(10_000)));

    // Advance block by 1 tokemak cycle
    const currentBlock = await time.latestBlock();
    await time.advanceBlockTo(currentBlock + 6400);

    // impersonate the rollover signer, and make the Tokemak pool go to next cycle
    await forceEth(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakRolloverSigner = await getImpersonatedSigner(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakManagerAbi = ['function completeRollover(string calldata rewardsIpfsHash)'];
    const tokemakManager = new ethers.Contract(TOKEMAK_MANAGER_ADDRESS, tokemakManagerAbi, tokemakRolloverSigner);
    await tokemakManager.completeRollover(IPFS_JSON_FILE_HASH);

    // Perform withdraw
    await ethTokemakPCVDeposit.withdraw(ethTokemakPCVDeposit.address, tenPow18.mul(toBN(10_000)));

    // Should end with 0 tWETH, 10k ETH
    expect((await tWETH.balanceOf(ethTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));
    expect((await ethers.provider.getBalance(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('10000')
    );
  });

  it('should be able to deposit TOKE, and withdraw', async function () {
    const {
      tokeTokemakPCVDeposit,
      toke, // TOKE ERC20
      tToke // Tokemak TOKE reactor
    } = contracts;

    // should start with 0 TOKE, 0 tTOKE
    expect((await tToke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));
    expect((await toke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));

    // Acquire TOKE (this is mocked, real execution will be an OTC for 6M TRIBE)
    await forceEth(TOKE_HOLDER_ADDRESS);
    const tokeSigner = await getImpersonatedSigner(TOKE_HOLDER_ADDRESS);
    await toke.connect(tokeSigner).transfer(tokeTokemakPCVDeposit.address, tenPow18.mul(toBN(100_000)));

    // deposit should now hold 100k TOKE
    expect((await toke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('100000')
    );

    // call deposit()
    await tokeTokemakPCVDeposit.deposit();

    // deposit should now hold 0 TOKE, 100k tTOKE
    expect((await toke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));
    expect((await tToke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('100000')
    );

    // request to withdraw 100k TOKE
    await tokeTokemakPCVDeposit.requestWithdrawal(tenPow18.mul(toBN(100_000)));

    // Advance block by 1 tokemak cycle
    const currentBlock = await time.latestBlock();
    await time.advanceBlockTo(currentBlock + 6400);

    // impersonate the rollover signer, and make the Tokemak pool go to next cycle
    await forceEth(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakRolloverSigner = await getImpersonatedSigner(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakManagerAbi = ['function completeRollover(string calldata rewardsIpfsHash)'];
    const tokemakManager = new ethers.Contract(TOKEMAK_MANAGER_ADDRESS, tokemakManagerAbi, tokemakRolloverSigner);
    await tokemakManager.completeRollover(IPFS_JSON_FILE_HASH);

    // Perform withdraw
    await tokeTokemakPCVDeposit.withdraw(tokeTokemakPCVDeposit.address, tenPow18.mul(toBN(100_000)));

    // Should end with 0 tTOKE, 100k TOKE
    expect((await toke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('100000')
    );
    expect((await tToke.balanceOf(tokeTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));
  });
});
