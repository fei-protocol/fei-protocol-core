import { FixedPricePSM } from '@custom-types/contracts';
import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-peg-stability-module', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let userAddress: string;
  let dai: Contract;
  let daiPSM: Contract;
  let fei: Contract;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);
    const addresses = await getAddresses();
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    ({ userAddress } = addresses);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    let simpleFeiDaiPSM;
    ({ dai, simpleFeiDaiPSM, fei } = contracts);
    doLogging && console.log(`Environment loaded.`);
    daiPSM = simpleFeiDaiPSM as FixedPricePSM;

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }

    const daoTimelockSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    await contracts.core.connect(daoTimelockSigner).grantPCVController(contracts.feiDAOTimelock.address);
  });

  describe('simpleFeiDaiPSM', async () => {
    describe('redeem', function () {
      const redeemAmount = 10_000_000;
      beforeEach(async () => {
        const largeFeiHolder = '0x9928e4046d7c6513326ccea028cd3e7a91c7590a';
        await forceEth(largeFeiHolder);
        const largeFeiHolderSigner = await getImpersonatedSigner(largeFeiHolder);
        await fei.connect(largeFeiHolderSigner).transfer(userAddress, redeemAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(daiPSM.address, redeemAmount);

        const isPaused = await daiPSM.paused();
        if (isPaused) {
          await daiPSM.unpause();
        }

        const isRedeemPaused = await daiPSM.redeemPaused();
        if (isRedeemPaused) {
          await daiPSM.unpauseRedeem();
        }
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
        expect(actualDAIAmountOut).to.be.equal(redeemAmount);
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
        expect(actualDAIAmountOut).to.be.equal(mintAmount);
      });
    });
  });
});
