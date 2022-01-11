import {
  AavePCVDeposit,
  MintRedeemPausePSM,
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
import { expectApprox, expectRevert, getImpersonatedSigner, increaseTime, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '../setup/utils';
import { contract } from '@openzeppelin/test-environment';

const oneEth = ethers.constants.WeiPerEther;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('eth PSM', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let guardian: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let ethPSM: MintRedeemPausePSM;
  let ethPSMRouter: PSMRouter;
  let weth: WETH9;
  let aWeth: IERC20;
  let fei: Fei;
  let dripper: PCVDripController;
  let aaveEthPCVDeposit: AavePCVDeposit;

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
    ethPSM = contracts.ethPSM as MintRedeemPausePSM;
    ethPSMRouter = contracts.ethPSMRouter as PSMRouter;
    aaveEthPCVDeposit = contracts.aaveEthPCVDeposit as AavePCVDeposit;
    aWeth = contracts.aWETH as IERC20;

    weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    fei = await ethers.getContractAt('Fei', contractAddresses.fei);
    dripper = contracts.aaveEthPCVDripController as PCVDripController;
    await hre.network.provider.send('hardhat_setBalance', [deployAddress.address, '0x21E19E0C9BAB2400000']);
    guardian = await getImpersonatedSigner(contractAddresses.guardian);
    await forceEth(guardian.address);
  });

  describe('ethPSMFeiSkimmer', async () => {
    it('can skim', async () => {
      await contracts.fei.mint(ethPSM.address, ethers.constants.WeiPerEther.mul(100_000_000));
      await contracts.ethPSMFeiSkimmer.skim();
      expect(await contracts.fei.balanceOf(ethPSM.address)).to.be.equal(ethers.constants.WeiPerEther.mul(10_000_000));
    });
  });

  describe('ethPSM', async () => {
    it('cannot sell eth to the PSM as redemptions are disabled', async () => {
      await expectRevert(ethPSM.redeem(ethPSM.address, 0, 0), 'EthPSM: Redeem paused');
    });

    it('can sell weth directly to the PSM as minting is active', async () => {
      const mintAmount = oneEth;
      const startingFeiBalance = await fei.balanceOf(deployAddress.address);

      await weth.connect(deployAddress).deposit({ value: mintAmount });
      await weth.connect(deployAddress).approve(ethPSM.address, mintAmount);

      const minAmountOut = await ethPSM.getMintAmountOut(mintAmount);

      await ethPSM.connect(deployAddress).mint(deployAddress.address, mintAmount, minAmountOut);
      expect((await fei.balanceOf(deployAddress.address)).sub(startingFeiBalance)).to.be.equal(minAmountOut);
    });
  });

  describe('PSMRouter', async () => {
    it('cannot sell fei to the PSM as redemptions are disabled', async () => {
      await expectRevert(
        ethPSMRouter.connect(deployAddress)['redeem(address,uint256,uint256)'](ethPSM.address, 0, 0),
        'EthPSM: Redeem paused'
      );
    });

    it('can sell eth to the PSM as minting is active', async () => {
      const mintAmount: BigNumber = oneEth;
      const minAmountOut = await ethPSM.getMintAmountOut(mintAmount);
      const startingFeiBalance = await fei.balanceOf(deployAddress.address);

      await ethPSMRouter
        .connect(deployAddress)
        ['mint(address,uint256,uint256)'](deployAddress.address, minAmountOut, mintAmount, {
          value: mintAmount
        });

      expect((await fei.balanceOf(deployAddress.address)).sub(startingFeiBalance)).to.be.equal(minAmountOut);
    });
  });

  describe('WETH AavePCVDripController', async () => {
    beforeEach(async () => {
      /// increase time by 2 hours so that regardless of mainnet state,
      /// this test will always pass
      await increaseTime(7200);
    });

    it('dripper cannot drip because it is paused', async () => {
      await expectRevert(dripper.drip(), 'Pausable: paused');
    });
  });

  describe('capital flows', async () => {
    before(async () => {
      await ethPSM.connect(guardian).unpauseRedeem();
    });

    describe('mint flow', async () => {
      it('after mint, eth flows to aave eth pcv deposit', async () => {
        const mintAmount: BigNumber = oneEth.mul(500);
        const minAmountOut = await ethPSM.getMintAmountOut(mintAmount);
        const startingFeiBalance = await fei.balanceOf(deployAddress.address);
        const startingAavePCVDepositaWethBalance = await aWeth.balanceOf(aaveEthPCVDeposit.address);

        await ethPSMRouter
          .connect(deployAddress)
          ['mint(address,uint256,uint256)'](deployAddress.address, minAmountOut, mintAmount, {
            value: mintAmount
          });

        expect((await fei.balanceOf(deployAddress.address)).sub(startingFeiBalance)).to.be.equal(minAmountOut);

        /// this should be 500 eth
        const endingAavePCVDepositaWethBalance = await aWeth.balanceOf(aaveEthPCVDeposit.address);

        await ethPSM.allocateSurplus();

        await expectApprox(endingAavePCVDepositaWethBalance.sub(startingAavePCVDepositaWethBalance), mintAmount);
        expect(await weth.balanceOf(ethPSM.address)).to.be.equal(oneEth.mul(250));
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

      it('sets ethpsm reserve threshold to 5250 eth', async () => {
        await ethPSM.connect(timelock).setReservesThreshold(oneEth.mul(5_250));
        expect(await ethPSM.reservesThreshold()).to.be.equal(oneEth.mul(5_250));
      });

      it('drip and get correct amount of weth sent into the psm', async () => {
        const ethPSMStartingBalance = await weth.balanceOf(ethPSM.address);

        expect(await dripper.dripEligible()).to.be.true;

        await dripper.drip();

        const ethPSMEndingBalance = await weth.balanceOf(ethPSM.address);

        expect(ethPSMEndingBalance.sub(ethPSMStartingBalance)).to.be.equal(await dripper.dripAmount());
      });

      it('redeems fei for weth', async () => {
        const userStartingFeiBalance = await fei.balanceOf(deployAddress.address);
        const userStartingWethBalance = await weth.balanceOf(deployAddress.address);
        const psmStartingWethBalance = await weth.balanceOf(ethPSM.address);
        const minAmountOut = await ethPSM.getRedeemAmountOut(mintAmount);

        await fei.connect(deployAddress).approve(ethPSM.address, mintAmount);
        await ethPSM.connect(deployAddress).redeem(deployAddress.address, mintAmount, minAmountOut);

        const userEndingFeiBalance = await fei.balanceOf(deployAddress.address);
        const userEndingWethBalance = await weth.balanceOf(deployAddress.address);
        const psmEndingWethBalance = await weth.balanceOf(ethPSM.address);

        expect(userEndingWethBalance.sub(userStartingWethBalance)).to.be.equal(minAmountOut);
        expect(userStartingFeiBalance.sub(userEndingFeiBalance)).to.be.equal(mintAmount);
        expect(psmStartingWethBalance.sub(psmEndingWethBalance)).to.be.equal(minAmountOut);
      });
    });
  });
});
