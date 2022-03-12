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

const TOKEMAK_MANAGER_ROLLOVER_ADDRESS = '0x90b6C61B102eA260131aB48377E143D6EB3A9d4B'; // has the rollover role
const TOKEMAK_MANAGER_ADDRESS = '0xa86e412109f77c45a3bc1c5870b880492fb86a14'; // tokemak manager
const IPFS_JSON_FILE_HASH = 'QmP4Vzg45jExr3mcNsx9xxV1fNft95uVzgZGeLtkBXgpkx';

describe.only('e2e-fip-38-tokemak', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
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

    // impersonate the rollover signer, and make the Tokemak pool go to next cycle
    await forceEth(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakRolloverSigner = await getImpersonatedSigner(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
    const tokemakManagerAbi = [
      'function nextCycleStartTime() view returns (uint256)',
      'function completeRollover(string calldata rewardsIpfsHash)'
    ];
    const tokemakManager = new ethers.Contract(TOKEMAK_MANAGER_ADDRESS, tokemakManagerAbi, tokemakRolloverSigner);
    const cycleEnd = await tokemakManager.nextCycleStartTime();
    await time.increaseTo(cycleEnd + 1);
    await tokemakManager.completeRollover(IPFS_JSON_FILE_HASH);

    // Perform withdraw
    await ethTokemakPCVDeposit.withdraw(ethTokemakPCVDeposit.address, tenPow18.mul(toBN(10_000)));

    // Should end with 0 tWETH, 10k ETH
    expect((await tWETH.balanceOf(ethTokemakPCVDeposit.address)).toString()).to.be.equal(ethers.utils.parseEther('0'));
    expect((await ethers.provider.getBalance(ethTokemakPCVDeposit.address)).toString()).to.be.equal(
      ethers.utils.parseEther('10000')
    );
  });
});
