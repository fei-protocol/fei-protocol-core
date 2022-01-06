import { EthPegStabilityModule, Fei, PCVDripController, PSMRouter, WETH9 } from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectRevert, increaseTime, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';

const oneEth = ethers.constants.WeiPerEther;
const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe.only('eth PSM', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let ethPSM: EthPegStabilityModule;
  let ethPSMRouter: PSMRouter;
  let weth: WETH9;
  let fei: Fei;
  let dripper: PCVDripController;

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
    ethPSM = contracts.ethPSM as EthPegStabilityModule;
    ethPSMRouter = contracts.ethPSMRouter as PSMRouter;
    weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    fei = await ethers.getContractAt('Fei', contractAddresses.fei);
    dripper = contracts.aaveEthPCVDripController as PCVDripController;
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
});
