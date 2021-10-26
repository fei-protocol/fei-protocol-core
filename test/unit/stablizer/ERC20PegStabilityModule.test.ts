import hre, { ethers } from 'hardhat';
import { expectRevert, getAddresses, getCore, deployDevelopmentWeth } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { Core, MockERC20, Fei, MockOracle, ERC20PegStabilityModule, MockPCVDepositV2 } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe('ERC20PegStabilityModule', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  const mintFeeBasisPoints = 30;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(10_000_000);
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const mintAmount = ethers.constants.WeiPerEther.mul(1_000);
  const decimalsNormalizer = 0; // because the oracle price is scaled 1e18, need to divide out by that before testing
  const bpGranularity = 10_000;
  const impersonatedSigners: { [key: string]: Signer } = {};

  let core: Core;
  let asset: MockERC20;
  let fei: Fei;
  let oracle: MockOracle;
  let psm: ERC20PegStabilityModule;
  let pcvDeposit: MockPCVDepositV2;

  before(async () => {
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

    await hre.network.provider.request({
      method: 'hardhat_reset'
    });

    await deployDevelopmentWeth();

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    governorAddress = addresses.governorAddress;
    minterAddress = addresses.minterAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;

    core = await getCore();
    fei = await ethers.getContractAt('Fei', await core.fei());
    oracle = await (await ethers.getContractFactory('MockOracle')).deploy(1);
    asset = await (await ethers.getContractFactory('MockERC20')).deploy();
    pcvDeposit = await (await ethers.getContractFactory('MockPCVDepositV2')).deploy(core.address, asset.address, 0, 0);

    psm = await (
      await ethers.getContractFactory('ERC20PegStabilityModule')
    ).deploy(
      core.address,
      oracle.address,
      oracle.address,
      mintFeeBasisPoints,
      redeemFeeBasisPoints,
      reservesThreshold,
      feiLimitPerSecond,
      bufferCap,
      decimalsNormalizer,
      false,
      asset.address,
      pcvDeposit.address
    );

    await core.grantMinter(psm.address);
  });

  describe('Init', function () {
    it('oracle address', async function () {
      expect(await psm.oracle()).to.be.equal(oracle.address);
    });

    it('mintFeeBasisPoints', async function () {
      expect(await psm.mintFeeBasisPoints()).to.be.equal(mintFeeBasisPoints);
    });

    it('redeemFeeBasisPoints', async function () {
      expect(await psm.mintFeeBasisPoints()).to.be.equal(mintFeeBasisPoints);
    });

    it('reservesThreshold', async function () {
      expect(await psm.reservesThreshold()).to.be.equal(reservesThreshold);
    });

    it('rateLimitPerSecond', async function () {
      expect(await psm.rateLimitPerSecond()).to.be.equal(feiLimitPerSecond);
    });

    it('mintingBufferCap', async function () {
      expect(await psm.bufferCap()).to.be.equal(bufferCap);
    });

    it('decimalsNormalizer', async function () {
      expect(await psm.reservesThreshold()).to.be.equal(reservesThreshold);
    });

    it('doInvert', async function () {
      expect(await psm.doInvert()).to.be.equal(false);
    });

    it('token address', async function () {
      expect(await psm.token()).to.be.equal(asset.address);
    });
  });

  describe('Mint', function () {
    describe('Sells Token for FEI', function () {
      it('exchanges 10 DAI for 10 FEI', async function () {
        const ten = toBN(10);
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = ten.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, ten);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, ten);

        const mintAmountOut = await psm.getMintAmountOut(ten);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, ten);

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(ten);
        expect(await psm.buffer()).to.be.equal(bufferCap.sub(mintAmountOut));
      });

      it('exchanges for appropriate amount of tokens when price is 1:1', async function () {
        const mintAmt = toBN(10_000_000);
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = mintAmt.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, mintAmt);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmt);

        const mintAmountOut = await psm.getMintAmountOut(mintAmt);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmt);

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(mintAmt);
        expect(await psm.buffer()).to.be.equal(bufferCap.sub(mintAmountOut));
      });

      it('fails when eth is sent to ERC20 PSM', async function () {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, {
            value: mintAmount
          }),
          'PegStabilityModule: cannot send eth to mint'
        );
      });

      it('fails when token is not approved to be spent by the PSM', async function () {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount),
          'ERC20: transfer amount exceeds balance'
        );
      });

      it('mint fails when contract is paused', async function () {
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount),
          'Pausable: paused'
        );
      });
    });
  });

  describe('Redeem', function () {
    describe('Sells FEI for Token', function () {
      beforeEach(async () => {
        await asset.mint(psm.address, mintAmount);
      });

      it('redeem fails when contract is paused', async function () {
        await oracle.setExchangeRate(ethers.constants.WeiPerEther);
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount),
          'Pausable: paused'
        );
      });

      it('redeem succeeds when user has enough funds', async function () {
        await oracle.setExchangeRate(1);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);
        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019', async function () {
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019 with .1 FEI', async function () {
        const pointOneFei = ethers.constants.WeiPerEther.div(10);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, pointOneFei);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, pointOneFei);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = pointOneFei
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
        const actualAssetAmount = await psm.getRedeemAmountOut(pointOneFei);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, pointOneFei);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(pointOneFei));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019 with .01 FEI', async function () {
        const pointOneFei = ethers.constants.WeiPerEther.div(100);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, pointOneFei);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, pointOneFei);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = pointOneFei
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
        const actualAssetAmount = await psm.getRedeemAmountOut(pointOneFei);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, pointOneFei);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(pointOneFei));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $0.9801', async function () {
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(9801).div(10000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(9801).div(10000));

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem fails when oracle price is $2', async function () {
        await oracle.setExchangeRate(2);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('fails when token is not approved to be spent by the PSM', async function () {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount),
          'ERC20: transfer amount exceeds balance'
        );
      });
    });
  });

  describe('ACL', function () {
    describe('setMintFee', function () {
      it('fails when caller is not governor or admin', async function () {
        await expectRevert(psm.setMintFee(bpGranularity), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('succeeds when caller is governor', async function () {
        const newMintFee = 100;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);
        expect(await psm.mintFeeBasisPoints()).to.be.equal(newMintFee);
      });
    });

    describe('setRedeemFee', function () {
      it('fails when caller is not governor or admin', async function () {
        await expectRevert(psm.setRedeemFee(bpGranularity), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('succeeds when caller is governor', async function () {
        const newRedeemFee = 100;
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(newRedeemFee);
        expect(await psm.redeemFeeBasisPoints()).to.be.equal(newRedeemFee);
      });
    });

    describe('setReservesThreshold', function () {
      it('fails when caller is not governor or admin', async function () {
        await expectRevert(
          psm.setReservesThreshold(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('succeeds when caller is governor', async function () {
        const newReserves = reservesThreshold.mul(100);
        await psm.connect(impersonatedSigners[governorAddress]).setReservesThreshold(newReserves);
        expect(await psm.reservesThreshold()).to.be.equal(newReserves);
      });
    });

    describe('setOracleFloor', function () {
      it('fails when caller is not governor or admin', async function () {
        await expectRevert(
          psm.setOracleFloor(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('succeeds when caller is governor', async function () {
        const newOracleFloor = 9_900;
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloor(newOracleFloor);
        const expectedNewFloor = ethers.constants.WeiPerEther.mul(99).div(100);
        expect(await psm.floor()).to.be.equal(expectedNewFloor);
      });
    });

    describe('setOracleCeiling', function () {
      it('fails when caller is not governor or admin', async function () {
        await expectRevert(
          psm.setOracleCeiling(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('succeeds when caller is governor', async function () {
        const newOraclePriceCeiling = 10_100;
        await psm.connect(impersonatedSigners[governorAddress]).setOracleCeiling(newOraclePriceCeiling);
        const expectedNewCeiling = ethers.constants.WeiPerEther.mul(101).div(100);
        expect(await psm.ceiling()).to.be.equal(expectedNewCeiling);
      });
    });

    describe('withdraw', function () {
      it('fails when caller is not PCVController', async function () {
        await expectRevert(
          psm.withdrawERC20(asset.address, userAddress, 100),
          'CoreRef: Caller is not a PCV controller'
        );
      });

      it('succeeds when caller is PCVController', async function () {
        const amount = 10_000_000;
        await asset.mint(psm.address, amount);
        await psm
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawERC20(asset.address, userAddress, await psm.balance());

        const endingBalance = await psm.balance();
        expect(endingBalance).to.be.equal(0);
        expect(await asset.balanceOf(userAddress)).to.be.equal(amount);
      });
    });
  });

  describe('allocateSurplus', function () {
    it('sends surplus to PCVDeposit target when called', async function () {
      const startingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
      await asset.mint(psm.address, reservesThreshold.mul(2));
      expect(await psm.hasSurplus()).to.be.true;
      await psm.allocateSurplus();
      const endingSurplusBalance = await asset.balanceOf(pcvDeposit.address);

      expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
    });
  });

  describe('deposit', function () {
    it('sends surplus to PCVDeposit target when called', async function () {
      const startingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
      await asset.mint(psm.address, reservesThreshold.mul(2));
      expect(await psm.hasSurplus()).to.be.true;
      await psm.deposit();
      const endingSurplusBalance = await asset.balanceOf(pcvDeposit.address);

      expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
    });

    it('succeeds when called', async function () {
      await psm.deposit();
    });
  });
});
