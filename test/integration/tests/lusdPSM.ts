import {
  AavePCVDeposit,
  GranularPegStabilityModule,
  Fei,
  IERC20,
  PCVDripController,
  PSMRouter,
  WETH9
} from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectRevert, getImpersonatedSigner, increaseTime, resetFork } from '@test/helpers';
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
  let lusdPSM: GranularPegStabilityModule;
  let lusd: IERC20;
  let fei: Fei;
  let dripper: PCVDripController;
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
    lusdPSM = contracts.lusdPSM as GranularPegStabilityModule;

    lusd = contracts.lusd as IERC20;
    fei = await ethers.getContractAt('Fei', contractAddresses.fei);
    dripper = contracts.lusdPCVDripController as PCVDripController;
    await hre.network.provider.send('hardhat_setBalance', [deployAddress.address, '0x21E19E0C9BAB2400000']);
    await fei.mint(deployAddress.address, amount);
    guardian = await getImpersonatedSigner(contractAddresses.guardian);
    await hre.network.provider.send('hardhat_setBalance', [guardian.address, '0x21E19E0C9BAB2400000']);
  });

  describe('lusdPSM', async () => {
    /// create a before each hook that approves the PSM to spend user's LUSD
    it('cannot sell lusd to the PSM as redemptions are disabled', async () => {
      await expectRevert(lusdPSM.redeem(lusdPSM.address, 0, 0), 'lusdPSM: Redeem paused');
    });

    it('can sell lusd directly to the PSM as minting is active', async () => {
      const mintAmount = oneEth;
      const startingFeiBalance = await fei.balanceOf(deployAddress.address);

      const minAmountOut = await lusdPSM.getMintAmountOut(mintAmount);

      await lusdPSM.connect(deployAddress).mint(deployAddress.address, mintAmount, minAmountOut);
      expect((await fei.balanceOf(deployAddress.address)).sub(startingFeiBalance)).to.be.equal(minAmountOut);
    });
  });

  describe('LUSD BammPCVDripController', async () => {
    beforeEach(async () => {
      /// increase time by 30 minutes so that regardless of mainnet state,
      /// this test will always pass
      await increaseTime(1800);
    });

    it('dripper cannot drip because it is paused', async () => {
      await expectRevert(dripper.drip(), 'Pausable: paused');
    });
  });

  describe('capital flows', async () => {
    before(async () => {
      await lusdPSM.connect(guardian).unpauseRedeem();
    });

    describe('mint flow', async () => {
      it('after mint, eth flows to aave eth pcv deposit', async () => {
        const mintAmount: BigNumber = oneEth.mul(500);
        const minAmountOut = await lusdPSM.getMintAmountOut(mintAmount);
        const startingFeiBalance = await fei.balanceOf(deployAddress.address);

        await lusdPSM.connect(deployAddress).mint(deployAddress.address, minAmountOut, mintAmount);

        expect((await fei.balanceOf(deployAddress.address)).sub(startingFeiBalance)).to.be.equal(minAmountOut);

        // expect(await weth.balanceOf(lusdPSM.address)).to.be.equal(oneEth.mul(250));
      });
    });

    describe('redeem flow', async () => {
      let timelock: SignerWithAddress;
      const mintAmount = oneEth.mul(5_000_000);

      before(async () => {
        await dripper.connect(guardian).unpause();
        timelock = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
        await forceEth(timelock.address);
        await fei.connect(timelock).mint(deployAddress.address, mintAmount);
      });

      it('sets lusdPSM reserve threshold to 5250 eth', async () => {
        await lusdPSM.connect(timelock).setReservesThreshold(oneEth.mul(5_250));
        expect(await lusdPSM.reservesThreshold()).to.be.equal(oneEth.mul(5_250));
      });

      it('drip and get correct amount of weth sent into the psm', async () => {
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
        const minAmountOut = await lusdPSM.getRedeemAmountOut(mintAmount);

        await fei.connect(deployAddress).approve(lusdPSM.address, mintAmount);
        await lusdPSM.connect(deployAddress).redeem(deployAddress.address, mintAmount, minAmountOut);

        const userEndingFeiBalance = await fei.balanceOf(deployAddress.address);
        const userEndingLusdBalance = await lusd.balanceOf(deployAddress.address);
        const psmEndingLusdBalance = await lusd.balanceOf(lusdPSM.address);

        expect(userEndingLusdBalance.sub(userStartingLusdBalance)).to.be.equal(minAmountOut);
        expect(userStartingFeiBalance.sub(userEndingFeiBalance)).to.be.equal(mintAmount);
        expect(psmStartingLusdBalance.sub(psmEndingLusdBalance)).to.be.equal(minAmountOut);
      });
    });
  });
});
