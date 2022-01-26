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
import { FixedPricePSM } from '@custom-types/contracts';

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
  let userAddress;
  let minterAddress;
  let dai: Contract;
  let daiPSM: Contract;
  let fei: Contract;
  let core: Contract;
  let feiDAOTimelock: Contract;

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
      addresses.minterAddress
    ];

    ({ userAddress, minterAddress } = addresses);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    let daiFixedPricePSM;
    ({ dai, daiFixedPricePSM, fei, core, daiPCVDripController, feiDAOTimelock } = contracts);
    doLogging && console.log(`Environment loaded.`);
    daiPSM = daiFixedPricePSM as FixedPricePSM;
    await core.grantMinter(minterAddress);

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  describe('dai-psm pcv drip controller', async () => {
    before(async function () {
      // make sure there is enough DAI available to the dripper and on the PSM
      const DAI_HOLDER = '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7'; // curve 3pool
      const signer = await getImpersonatedSigner(DAI_HOLDER);
      await forceEth(DAI_HOLDER);
      await contracts.dai.connect(signer).transfer(
        contracts.compoundDaiPCVDeposit.address,
        '100000000000000000000000000' // 100M
      );
      await contracts.compoundDaiPCVDeposit.deposit();
      await contracts.dai.connect(signer).transfer(
        contracts.daiPSM.address,
        '5500000000000000000000000' // 5.5M
      );
    });

    beforeEach(async () => {
      await time.increase('2000');
    });

    it('does not drip when the dai PSM is above the threshold', async () => {
      expect(await daiPCVDripController.isTimeEnded()).to.be.true;
      const dripThreshold = await daiPCVDripController.dripAmount();
      const psmBalance = await daiPSM.balance();

      if (psmBalance.lt(dripThreshold)) {
        expect(await daiPCVDripController.dripEligible()).to.be.true;
        await daiPCVDripController.drip();
      } else {
        expect(await daiPCVDripController.dripEligible()).to.be.false;
        await expectRevert(daiPCVDripController.drip(), 'PCVDripController: not eligible');
      }
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
