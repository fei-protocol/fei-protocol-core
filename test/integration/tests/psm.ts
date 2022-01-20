import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import hre, { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { expectRevert, getAddresses, getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import { Contract, Signer } from 'ethers';
import { expectApprox } from '@test/helpers';
import { WETH9 } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-peg-stability-module', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let daiPCVDripController: Contract;
  let doLogging: boolean;
  let ethPSMRouter: Contract;
  let userAddress;
  let minterAddress;
  let weth: Contract;
  let dai: Contract;
  let daiPSM: Contract;
  let ethPSM: Contract;
  let fei: Contract;
  let core: Contract;
  let feiDAOTimelock: Contract;
  let beneficiaryAddress1;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);
    const addresses = await getAddresses();
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ];

    ({ userAddress, minterAddress, beneficiaryAddress1 } = addresses);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    ({ dai, weth, daiPSM, ethPSM, ethPSMRouter, fei, core, daiPCVDripController, feiDAOTimelock } = contracts);
    doLogging && console.log(`Environment loaded.`);
    weth = contracts.weth as WETH9;
    await core.grantMinter(minterAddress);

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  describe('weth-router', async () => {
    describe('redeem', async () => {
      const redeemAmount = 10_000_000;
      before(async () => {
        await ethPSM.unpauseRedeem();
      });

      beforeEach(async () => {
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, redeemAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(ethPSMRouter.address, redeemAmount);
      });

      it('exchanges 10,000,000 FEI for 1994 ETH', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingETHBalance = await ethers.provider.getBalance(beneficiaryAddress1);
        const expectedEthAmount = await ethPSMRouter.getRedeemAmountOut(redeemAmount);

        await ethPSMRouter
          .connect(impersonatedSigners[userAddress])
          ['redeem(address,uint256,uint256)'](beneficiaryAddress1, redeemAmount, expectedEthAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingETHBalance = await ethers.provider.getBalance(beneficiaryAddress1);

        expect(endingETHBalance.sub(startingETHBalance)).to.be.equal(expectedEthAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount);
      });

      it('exchanges 5,000,000 FEI for 997 ETH', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingETHBalance = await ethers.provider.getBalance(beneficiaryAddress1);
        const expectedEthAmount = await ethPSMRouter.getRedeemAmountOut(redeemAmount / 2);

        await ethPSMRouter
          .connect(impersonatedSigners[userAddress])
          ['redeem(address,uint256,uint256)'](beneficiaryAddress1, redeemAmount / 2, expectedEthAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingETHBalance = await ethers.provider.getBalance(beneficiaryAddress1);
        expect(endingETHBalance.sub(startingETHBalance)).to.be.equal(expectedEthAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount / 2);
      });

      it('passthrough getRedeemAmountOut returns same value as PSM', async () => {
        const actualEthAmountRouter = await ethPSMRouter.getRedeemAmountOut(redeemAmount);
        const actualEthAmountPSM = await ethPSM.getRedeemAmountOut(redeemAmount);
        expect(actualEthAmountPSM).to.be.equal(actualEthAmountRouter);
      });
    });

    describe('mint', function () {
      const mintAmount = 2_000;
      beforeEach(async () => {
        await forceEth(userAddress);
      });

      it('mint succeeds with 1 ether', async () => {
        const minAmountOut = await ethPSMRouter.getMintAmountOut(ethers.constants.WeiPerEther);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await ethPSMRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256)'](userAddress, minAmountOut, ethers.constants.WeiPerEther, {
            value: ethers.constants.WeiPerEther
          });

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.gte(minAmountOut);
      });

      it('mint succeeds with 2 ether', async () => {
        const ethAmountIn = toBN(2).mul(ethers.constants.WeiPerEther);
        const minAmountOut = await ethPSMRouter.getMintAmountOut(ethAmountIn);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await ethPSMRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256)'](userAddress, minAmountOut, ethAmountIn, { value: ethAmountIn });

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
      });

      it('passthrough getMintAmountOut returns same value as PSM', async () => {
        const actualEthAmountRouter = await ethPSMRouter.getMintAmountOut(mintAmount);
        const actualEthAmountPSM = await ethPSM.getMintAmountOut(mintAmount);
        expect(actualEthAmountPSM).to.be.equal(actualEthAmountRouter);
      });
    });
  });

  describe('weth-psm', async () => {
    describe('redeem', function () {
      const redeemAmount = 10_000_000;
      beforeEach(async () => {
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, redeemAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(ethPSM.address, redeemAmount);
      });

      it('exchanges 10,000,000 FEI for WETH', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingWETHBalance = await weth.balanceOf(userAddress);
        const expectedEthAmount = await ethPSM.getRedeemAmountOut(redeemAmount);

        await ethPSM.connect(impersonatedSigners[userAddress]).redeem(userAddress, redeemAmount, expectedEthAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingWETHBalance = await weth.balanceOf(userAddress);

        expect(endingWETHBalance.sub(startingWETHBalance)).to.be.equal(expectedEthAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount);
        expect(expectedEthAmount).to.be.gt(0);
      });

      it('exchanges 5,000,000 FEI for WETH', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingWETHBalance = await weth.balanceOf(userAddress);
        const expectedEthAmount = await ethPSM.getRedeemAmountOut(redeemAmount / 2);

        await ethPSM.connect(impersonatedSigners[userAddress]).redeem(userAddress, redeemAmount / 2, expectedEthAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingWETHBalance = await weth.balanceOf(userAddress);

        expect(endingWETHBalance.sub(startingWETHBalance)).to.be.equal(expectedEthAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount / 2);
        expect(expectedEthAmount).to.be.gt(0); //if you receive 0 weth, there is an oracle failure or improperly setup oracle
      });
    });

    describe('mint', function () {
      const mintAmount = toBN(2).mul(ethers.constants.WeiPerEther);

      beforeEach(async () => {
        await forceEth(userAddress);
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: mintAmount });
        await weth.connect(impersonatedSigners[userAddress]).approve(ethPSM.address, mintAmount);
      });

      it('mint succeeds with 1 WETH', async () => {
        const minAmountOut = await ethPSM.getMintAmountOut(ethers.constants.WeiPerEther);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await ethPSM.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount.div(2), minAmountOut);

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.gte(minAmountOut);
        expect(minAmountOut).to.be.gt(0);
      });

      it('mint succeeds with 2 WETH', async () => {
        const ethAmountIn = toBN(2).mul(ethers.constants.WeiPerEther);
        const minAmountOut = await ethPSMRouter.getMintAmountOut(ethAmountIn);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await ethPSM.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, minAmountOut);

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
        expect(minAmountOut).to.be.gt(0);
      });
    });
  });

  describe('dai-psm pcv drip controller', async () => {
    beforeEach(async () => {
      await time.increase('2000');
    });

    it('does not drip when the dai PSM is above the threshold', async () => {
      expect(await daiPCVDripController.isTimeEnded()).to.be.true;
      expect(await daiPCVDripController.dripEligible()).to.be.false;
      await expectRevert(daiPCVDripController.drip(), 'PCVDripController: not eligible');
    });

    it('does drip when the dai PSM is under the threshold', async () => {
      const timelock = await getImpersonatedSigner(feiDAOTimelock.address);
      await daiPSM.connect(timelock).withdrawERC20(dai.address, userAddress, await dai.balanceOf(daiPSM.address));
      expect(await dai.balanceOf(daiPSM.address)).to.be.equal(0);

      await daiPCVDripController.drip();

      expect(await dai.balanceOf(daiPSM.address)).to.be.equal(await daiPCVDripController.dripAmount());
    });
  });

  describe('dai_psm', async () => {
    describe('redeem', function () {
      const redeemAmount = 10_000_000;
      beforeEach(async () => {
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, redeemAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(daiPSM.address, redeemAmount);
      });

      it('exchanges 10,000,000 FEI for DAI', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingDAIBalance = await dai.balanceOf(userAddress);
        const expectedDAIAmount = await daiPSM.getRedeemAmountOut(redeemAmount);

        await daiPSM.connect(impersonatedSigners[userAddress]).redeem(userAddress, redeemAmount, expectedDAIAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingDAIBalance = await dai.balanceOf(userAddress);

        expect(endingDAIBalance.sub(startingDAIBalance)).to.be.equal(expectedDAIAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount);
        expect(expectedDAIAmount).to.be.gt(0);
      });

      it('exchanges 5,000,000 FEI for DAI', async () => {
        const startingFEIBalance = await fei.balanceOf(userAddress);
        const startingDAIBalance = await dai.balanceOf(userAddress);
        const expectedDAIAmount = await daiPSM.getRedeemAmountOut(redeemAmount / 2);

        await daiPSM.connect(impersonatedSigners[userAddress]).redeem(userAddress, redeemAmount / 2, expectedDAIAmount);

        const endingFEIBalance = await fei.balanceOf(userAddress);
        const endingDAIBalance = await dai.balanceOf(userAddress);

        expect(endingDAIBalance.sub(startingDAIBalance)).to.be.equal(expectedDAIAmount);
        expect(startingFEIBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount / 2);
        expect(expectedDAIAmount).to.be.gt(0); //if you receive 0 weth, there is an oracle failure or improperly setup oracle
      });

      it('DAI price sanity check', async () => {
        const actualDAIAmountOut = await daiPSM.getRedeemAmountOut(redeemAmount);
        await expectApprox(actualDAIAmountOut, redeemAmount);
      });
    });

    describe('mint', function () {
      const mintAmount = 10_000_000;

      beforeEach(async () => {
        const daiAccount = '0xbb2e5c2ff298fd96e166f90c8abacaf714df14f8';
        const daiSigner = await getImpersonatedSigner(daiAccount);
        await forceEth(daiAccount);
        await dai.connect(daiSigner).transfer(userAddress, mintAmount);
        await dai.connect(impersonatedSigners[userAddress]).approve(daiPSM.address, mintAmount);
      });

      it('mint succeeds with 5_000_000 DAI', async () => {
        const minAmountOut = await daiPSM.getMintAmountOut(mintAmount / 2);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);
        const psmStartingDAIBalance = await dai.balanceOf(daiPSM.address);

        await daiPSM.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount / 2, minAmountOut);

        const psmEndingDAIBalance = await dai.balanceOf(daiPSM.address);
        const userEndingFEIBalance = await fei.balanceOf(userAddress);

        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.gte(minAmountOut);
        expect(psmEndingDAIBalance.sub(psmStartingDAIBalance)).to.be.equal(mintAmount / 2);
      });

      it('mint succeeds with 10_000_000 DAI', async () => {
        const minAmountOut = await daiPSM.getMintAmountOut(mintAmount);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);
        const psmStartingDAIBalance = await dai.balanceOf(daiPSM.address);

        await daiPSM.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, minAmountOut);

        const psmEndingDAIBalance = await dai.balanceOf(daiPSM.address);
        const userEndingFEIBalance = await fei.balanceOf(userAddress);

        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
        expect(psmEndingDAIBalance.sub(psmStartingDAIBalance)).to.be.equal(mintAmount);
      });

      it('DAI price sanity check', async () => {
        const actualDAIAmountOut = await daiPSM.getMintAmountOut(mintAmount);
        await expectApprox(actualDAIAmountOut, mintAmount);
      });
    });
  });
});
