import { MintRedeemPausePSM, Fei, IERC20, PCVDripController, BAMMDeposit, FeiSkimmer } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import {
  expectRevert,
  getImpersonatedSigner,
  increaseTime,
  overwriteChainlinkAggregator,
  resetFork
} from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '../setup/utils';

const oneEth = ethers.constants.WeiPerEther;
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('lusd PSM', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let guardian: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let lusdPSM: MintRedeemPausePSM;
  let lusd: IERC20;
  let fei: Fei;
  let dripper: PCVDripController;
  let skimmer: FeiSkimmer;
  let bammDeposit: BAMMDeposit;
  const amount = toBN(5_000_000).mul(oneEth);

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0];
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress.address,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
    lusdPSM = contracts.lusdPSM as MintRedeemPausePSM;
    bammDeposit = contracts.bammDeposit as BAMMDeposit;
    skimmer = contracts.lusdPSMFeiSkimmer as FeiSkimmer;

    lusd = contracts.lusd as IERC20;
    fei = await ethers.getContractAt('Fei', contractAddresses.fei);
    dripper = contracts.lusdPCVDripController as PCVDripController;
    await hre.network.provider.send('hardhat_setBalance', [deployAddress.address, '0x21E19E0C9BAB2400000']);
    await fei.mint(deployAddress.address, amount);
    guardian = await getImpersonatedSigner(contractAddresses.guardian);
    await hre.network.provider.send('hardhat_setBalance', [guardian.address, '0x21E19E0C9BAB2400000']);
    console.log('contractAddresses.chainlinkEthUsdOracle: ', contracts.chainlinkEthUsdOracle);
    await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');
  });

  describe('lusdPSM', async () => {
    /// create a before each hook that approves the PSM to spend user's LUSD
    it('cannot sell lusd to the PSM as redemptions are disabled', async () => {
      await expectRevert(lusdPSM.redeem(lusdPSM.address, 0, 0), 'EthPSM: Redeem paused');
    });

    it('cannot buy lusd to the PSM as minting is disabled', async () => {
      await expectRevert(lusdPSM.mint(lusdPSM.address, 0, 0), 'Pausable: paused');
    });
  });

  describe('LUSD BammPCVDripController', async () => {
    it('dripper cannot drip because it is paused', async () => {
      await expectRevert(dripper.drip(), 'Pausable: paused');
    });
  });

  describe('capital flows', async () => {
    before(async () => {
      await lusdPSM.connect(guardian).unpauseRedeem();
      await lusdPSM.connect(guardian).unpause();
      await dripper.unpause();
      await skimmer.unpause();
    });

    beforeEach(async () => {
      /// increase time by 30 minutes so that regardless of mainnet state,
      /// this test will always pass
      await increaseTime(1800);
    });

    describe('dripper drips ', async () => {
      it('successfully drips 10m LUSD to the lusd PSM', async () => {
        const psmStartingLusdBalance = await lusd.balanceOf(lusdPSM.address);
        await dripper.drip();
        const psmEndingLusdBalance = await lusd.balanceOf(lusdPSM.address);

        expect(psmEndingLusdBalance.sub(psmStartingLusdBalance)).to.be.equal(await dripper.dripAmount());
      });
    });

    describe('redeem flow', async () => {
      let timelock: SignerWithAddress;

      before(async () => {
        timelock = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await forceEth(timelock.address);
        const lusdBalance = await lusd.balanceOf(lusdPSM.address);
        await lusdPSM.connect(timelock).withdraw(bammDeposit.address, lusdBalance);
        await fei.connect(deployAddress).approve(lusdPSM.address, amount);
      });

      it('drip and get correct amount of lusd sent into the psm', async () => {
        const lusdPSMStartingBalance = await lusd.balanceOf(lusdPSM.address);

        expect(await dripper.dripEligible()).to.be.true;

        await dripper.drip();

        const lusdPSMEndingBalance = await lusd.balanceOf(lusdPSM.address);

        expect(lusdPSMEndingBalance.sub(lusdPSMStartingBalance)).to.be.equal(await dripper.dripAmount());
      });

      it('redeems fei for LUSD', async () => {
        const userStartingFeiBalance = await fei.balanceOf(deployAddress.address);
        const userStartingLusdBalance = await lusd.balanceOf(deployAddress.address);
        const psmStartingLusdBalance = await lusd.balanceOf(lusdPSM.address);
        const minAmountOut = await lusdPSM.getRedeemAmountOut(amount);

        await lusdPSM.connect(deployAddress).redeem(deployAddress.address, amount, minAmountOut);

        const userEndingFeiBalance = await fei.balanceOf(deployAddress.address);
        const userEndingLusdBalance = await lusd.balanceOf(deployAddress.address);
        const psmEndingLusdBalance = await lusd.balanceOf(lusdPSM.address);

        expect(userEndingLusdBalance.sub(userStartingLusdBalance)).to.be.equal(minAmountOut);
        expect(userStartingFeiBalance.sub(userEndingFeiBalance)).to.be.equal(amount);
        expect(psmStartingLusdBalance.sub(psmEndingLusdBalance)).to.be.equal(minAmountOut);
      });
    });

    describe('mint flow', async () => {
      it('user can mint FEI by providing LUSD', async () => {
        const mintAmount: BigNumber = oneEth.mul(500);
        const minAmountOut = await lusdPSM.getMintAmountOut(mintAmount);
        const startingFeiBalance = await fei.balanceOf(deployAddress.address);
        const startingLUSDBalance = await lusd.balanceOf(deployAddress.address);

        await lusd.connect(deployAddress).approve(lusdPSM.address, mintAmount);
        await lusdPSM.connect(deployAddress).mint(deployAddress.address, mintAmount, minAmountOut);

        const endingLUSDBalance = await lusd.balanceOf(deployAddress.address);
        const endingFeiBalance = await fei.balanceOf(deployAddress.address);

        expect(endingFeiBalance.sub(startingFeiBalance)).to.be.equal(minAmountOut);
        expect(startingLUSDBalance.sub(endingLUSDBalance)).to.be.equal(mintAmount);
      });
    });

    describe('skimmer skims', async () => {
      before(async function () {
        await fei.mint(lusdPSM.address, oneEth.mul(100_000_000));
      });

      it('successfully skims everything over 10m FEI in the lusd PSM', async () => {
        const startingFeiBalance = await fei.balanceOf(lusdPSM.address);
        await skimmer.skim();
        const endingFeiBalance = await fei.balanceOf(lusdPSM.address);

        expect(endingFeiBalance).to.be.equal(await skimmer.threshold());
        expect(startingFeiBalance).to.be.gt(await skimmer.threshold());
      });
    });
  });
});
