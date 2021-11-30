import hre, { ethers } from 'hardhat';
import {
  expectRevert,
  getAddresses,
  getCore,
  deployDevelopmentWeth,
  ZERO_ADDRESS,
  getImpersonatedSigner
} from '@test/helpers';
import { expect } from 'chai';
import { Signer, utils } from 'ethers';
import { Core, MockERC20, Fei, MockOracle, PegStabilityModule, MockPCVDepositV2, WETH9 } from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';
import { constants } from 'buffer';

const toBN = ethers.BigNumber.from;

describe('PegStabilityModule', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  let psmAdminAddress;

  const mintFeeBasisPoints = 30;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(10);
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const mintAmount = ethers.constants.WeiPerEther.mul(1_000);
  const decimalsNormalizer = 0; // because the oracle price is scaled 1e18, need to divide out by that before testing
  const bpGranularity = 10_000;
  const impersonatedSigners: { [key: string]: Signer } = {};
  const PSM_ADMIN_ROLE = keccak256(utils.toUtf8Bytes('PSM_ADMIN_ROLE'));

  let core: Core;
  let fei: Fei;
  let oracle: MockOracle;
  let psm: PegStabilityModule;
  let pcvDeposit: MockPCVDepositV2;
  let weth: WETH9;

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
    weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async () => {
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    governorAddress = addresses.governorAddress;
    minterAddress = addresses.minterAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    psmAdminAddress = addresses.beneficiaryAddress1;

    core = await getCore();
    fei = await ethers.getContractAt('Fei', await core.fei());
    // eth costs 5k USD
    oracle = await (await ethers.getContractFactory('MockOracle')).deploy(5000);
    pcvDeposit = await (await ethers.getContractFactory('MockPCVDepositV2')).deploy(core.address, weth.address, 0, 0);

    psm = await (
      await ethers.getContractFactory('PegStabilityModule')
    ).deploy(
      {
        coreAddress: core.address,
        oracleAddress: oracle.address,
        backupOracle: oracle.address,
        decimalsNormalizer,
        doInvert: false
      },
      mintFeeBasisPoints,
      redeemFeeBasisPoints,
      reservesThreshold,
      feiLimitPerSecond,
      bufferCap,
      weth.address,
      pcvDeposit.address
    );

    await core.grantMinter(psm.address);
    await core.grantMinter(minterAddress);

    /// Create PSM admin role
    await core.createRole(PSM_ADMIN_ROLE, await core.GOVERN_ROLE());
    // grant PSM admin role
    await core.grantRole(PSM_ADMIN_ROLE, psmAdminAddress);

    await fei.connect(impersonatedSigners[minterAddress]).mint(psm.address, bufferCap);
  });

  describe('after contract initialization, parameters are correct:', function () {
    it('oracle address', async () => {
      expect(await psm.oracle()).to.be.equal(oracle.address);
    });

    it('mintFeeBasisPoints', async () => {
      expect(await psm.mintFeeBasisPoints()).to.be.equal(mintFeeBasisPoints);
    });

    it('redeemFeeBasisPoints', async () => {
      expect(await psm.redeemFeeBasisPoints()).to.be.equal(redeemFeeBasisPoints);
    });

    it('reservesThreshold', async () => {
      expect(await psm.reservesThreshold()).to.be.equal(reservesThreshold);
    });

    it('rateLimitPerSecond', async () => {
      expect(await psm.rateLimitPerSecond()).to.be.equal(feiLimitPerSecond);
    });

    it('mintingBufferCap', async () => {
      expect(await psm.bufferCap()).to.be.equal(bufferCap);
    });

    it('decimalsNormalizer', async () => {
      expect(await psm.decimalsNormalizer()).to.be.equal(decimalsNormalizer);
    });

    it('doInvert', async () => {
      expect(await psm.doInvert()).to.be.equal(false);
    });

    it('token address', async () => {
      expect(await psm.underlyingToken()).to.be.equal(weth.address);
    });

    it('balance', async () => {
      expect(await psm.balance()).to.be.equal(0);
    });

    it('reservesSurplus', async () => {
      expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold.mul(-1));
    });

    it('balanceReportedIn', async () => {
      expect(await psm.balanceReportedIn()).to.be.equal(weth.address);
    });

    it('hasSurplus', async () => {
      expect(await psm.hasSurplus()).to.be.false;
    });

    it('CONTRACT_ADMIN_ROLE', async () => {
      expect(await psm.CONTRACT_ADMIN_ROLE()).to.be.equal(PSM_ADMIN_ROLE);
    });

    it('resistantBalanceAndFei', async () => {
      const [wethBalance, feiBalance] = await psm.resistantBalanceAndFei();
      expect(feiBalance).to.be.equal(bufferCap);
      expect(wethBalance).to.be.equal(0);
    });
  });

  describe('Mint', function () {
    describe('Sells Eth for FEI', function () {
      it('exchanges 10 WEth for 50000 FEI', async () => {
        const ten = toBN(10).mul(ethers.constants.WeiPerEther);
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await weth.balanceOf(psm.address);
        const expectedMintAmountOut = ten
          .mul(bpGranularity - mintFeeBasisPoints)
          .div(bpGranularity)
          .mul(5000);

        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: ethers.constants.WeiPerEther.mul(10) });
        await weth.connect(impersonatedSigners[userAddress]).approve(psm.address, ten);
        const startingUserAssetBalance = await weth.balanceOf(userAddress);

        const mintAmountOut = await psm.getMintAmountOut(ten);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, ten, expectedMintAmountOut);

        const endingUserWETHBalance = await weth.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingWETHBalance = await weth.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingWETHBalance.sub(psmStartingAssetBalance)).to.be.equal(ten);

        const [wethBalance, x] = await psm.resistantBalanceAndFei();
        expect(wethBalance).to.be.equal(ten);

        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
        expect(startingUserAssetBalance.sub(endingUserWETHBalance)).to.be.equal(ten);
      });

      it('exchanges 10 Eth for 48,750 FEI as fee is 250 bips and exchange rate is 1:5000', async () => {
        const tenEth = toBN(10).mul(ethers.constants.WeiPerEther);
        const newMintFee = 250;
        const expectedMintAmountOut = toBN(48_750).mul(ethers.constants.WeiPerEther);
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const startingPSMWETHBalance = await weth.balanceOf(psm.address);

        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);
        const mintAmountOut = await psm.getMintAmountOut(tenEth);

        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: tenEth });
        await weth.connect(impersonatedSigners[userAddress]).approve(psm.address, tenEth);
        const startingUserWETHBalance = await weth.balanceOf(userAddress);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, tenEth, expectedMintAmountOut);

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingWETHBalance = await weth.balanceOf(psm.address);
        const endingUserWETHBalance = await weth.balanceOf(userAddress);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingWETHBalance.sub(startingPSMWETHBalance)).to.be.equal(tenEth);
        expect(startingUserWETHBalance.sub(endingUserWETHBalance)).to.be.equal(tenEth);
        // buffer has not been eaten into as the PSM holds FEI to pay out
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('exchanges 1000 Eth for 975 FEI as fee is 300 bips and exchange rate is 1:5000');

      it('exchanges 1000 Eth for 975 FEI as mint fee is 250 bips and exchange rate is 1:5000');

      it('exchanges 1000 Eth for 950 FEI as mint fee is 50 bips and exchange rate is 1Eth:5000FEI');

      it('exchange and getMintAmountOut fails when new oracle ceiling is equal to the new exchange rate');

      it('exchange and getMintAmountOut fails when new oracle floor is equal to the new exchange rate');

      it('exchanges for appropriate amount of tokens when price is 1:5000');

      it('should not exchange when expected amount out is greater than actual amount out');

      it('should not mint when expected amount out is 3x greater than minting buffer cap and all psm fei is used');

      it('should not mint when expected amount out is 1 more than minting buffer cap and all psm fei is used');

      it('fails when token is not approved to be spent by the PSM');

      it('mint fails when contract is paused');
    });
  });

  describe('Redeem', function () {
    describe('Sells FEI for Eth', function () {
      beforeEach(async () => {
        // await weth.mint(psm.address, mintAmount);
      });

      it('redeem fails when contract is paused');

      it('exchanges 1000000 FEI for 97.5 Eth as fee is 250 bips and exchange rate is 1:10000');

      it('exchanges 1000 FEI for 975 Eth as fee is 250 bips and exchange rate is 1:1');

      it('redeem succeeds when user has enough funds');

      it('redeem succeeds when user has enough funds and Eth is $1.019');

      it('redeem succeeds when user has enough funds and Eth is $1.019 with .1 FEI');

      it('redeem succeeds when user has enough funds and Eth is $1.019 with .01 FEI');

      it('redeem succeeds when user has enough funds and Eth is $0.9801');

      it('redeem succeeds when user has enough funds, Eth is $0.9801 and mint fee has been changed to 100 bips');

      it('redeem succeeds when user has enough funds, Eth is $0.5 and mint fee has been changed to 100 bips');

      it('redeem succeeds when user has enough funds, Eth is $0.5 and mint fee has been changed to 500 bips');

      it('redeem fails when oracle price is $2');

      it('redeem fails when expected amount out is greater than actual amount out');

      it('fails when token is not approved to be spent by the PSM');
    });
  });

  describe('ACL', function () {
    describe('setMintFee', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(psm.setMintFee(bpGranularity), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('fails when mint fee is above max fee', async () => {
        const invalidNewMintFee = 501;
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setMintFee(invalidNewMintFee),
          'PegStabilityModule: Mint fee exceeds max fee'
        );
      });

      it('succeeds when caller is governor', async () => {
        const newMintFee = 100;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);
        expect(await psm.mintFeeBasisPoints()).to.be.equal(newMintFee);
      });

      it('succeeds when caller is PSM admin', async () => {
        const newMintFee = 100;
        await psm.connect(impersonatedSigners[psmAdminAddress]).setMintFee(newMintFee);
        expect(await psm.mintFeeBasisPoints()).to.be.equal(newMintFee);
      });
    });

    describe('setRedeemFee', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(psm.setRedeemFee(bpGranularity), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('fails when redeem fee is above max fee', async () => {
        const invalidNewRedeemFee = 501;
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(invalidNewRedeemFee),
          'PegStabilityModule: Redeem fee exceeds max fee'
        );
      });

      it('succeeds when caller is governor', async () => {
        const newRedeemFee = 100;
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(newRedeemFee);
        expect(await psm.redeemFeeBasisPoints()).to.be.equal(newRedeemFee);
      });

      it('succeeds when caller is psm admin', async () => {
        const newRedeemFee = 100;
        await psm.connect(impersonatedSigners[psmAdminAddress]).setRedeemFee(newRedeemFee);
        expect(await psm.redeemFeeBasisPoints()).to.be.equal(newRedeemFee);
      });
    });

    describe('setTarget', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(psm.setSurplusTarget(weth.address), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('fails when target is address 0', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setSurplusTarget(ZERO_ADDRESS),
          'PegStabilityModule: Invalid new surplus target'
        );
      });

      it('succeeds when caller is governor', async () => {
        const oldTarget = await psm.surplusTarget();
        const newTarget = weth.address;
        await expect(await psm.connect(impersonatedSigners[governorAddress]).setSurplusTarget(newTarget))
          .to.emit(psm, 'SurplusTargetUpdate')
          .withArgs(oldTarget, newTarget);
        const updatedTarget = await psm.surplusTarget();
        expect(updatedTarget).to.be.equal(newTarget);
      });

      it('succeeds when caller is governor', async () => {
        const oldTarget = await psm.surplusTarget();
        const newTarget = weth.address;
        await expect(await psm.connect(impersonatedSigners[psmAdminAddress]).setSurplusTarget(newTarget))
          .to.emit(psm, 'SurplusTargetUpdate')
          .withArgs(oldTarget, newTarget);
        const updatedTarget = await psm.surplusTarget();
        expect(updatedTarget).to.be.equal(newTarget);
      });
    });

    describe('setReservesThreshold', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(
          psm.setReservesThreshold(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('fails when caller is governor and new reserves threshold is 0', async () => {
        const newReserves = 0;
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setReservesThreshold(newReserves),
          'PegStabilityModule: Invalid new reserves threshold'
        );
      });

      it('succeeds when caller is governor', async () => {
        const newReserves = reservesThreshold.mul(100);
        await psm.connect(impersonatedSigners[governorAddress]).setReservesThreshold(newReserves);
        expect(await psm.reservesThreshold()).to.be.equal(newReserves);
      });

      it('succeeds when caller is psm admin', async () => {
        const newReserves = reservesThreshold.mul(100);
        await psm.connect(impersonatedSigners[psmAdminAddress]).setReservesThreshold(newReserves);
        expect(await psm.reservesThreshold()).to.be.equal(newReserves);
      });
    });

    describe('withdraw', function () {
      it('fails when caller is not PCVController', async () => {
        await expectRevert(psm.withdraw(userAddress, 100), 'CoreRef: Caller is not a PCV controller');
      });

      it('succeeds when caller is PCVController', async () => {
        const amount = 10_000_000;
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: amount });
        await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, amount);
        await psm.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, await psm.balance());

        const endingBalance = await psm.balance();
        expect(endingBalance).to.be.equal(0);
        expect(await weth.balanceOf(userAddress)).to.be.equal(amount);
      });
    });
  });

  describe('PCV', function () {
    describe('allocateSurplus', function () {
      it('sends surplus to PCVDeposit target when called', async () => {
        const startingSurplusBalance = await weth.balanceOf(pcvDeposit.address);
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: reservesThreshold.mul(2) });
        await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, reservesThreshold.mul(2));

        expect(await psm.hasSurplus()).to.be.true;
        expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold);

        await psm.allocateSurplus();

        expect(await psm.reservesSurplus()).to.be.equal(0);
        expect(await psm.hasSurplus()).to.be.false;

        const endingSurplusBalance = await weth.balanceOf(pcvDeposit.address);
        const endingPSMBalance = await weth.balanceOf(psm.address);

        expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
        expect(endingPSMBalance).to.be.equal(reservesThreshold);
      });

      it('reverts when there is no surplus to allocate', async () => {
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: reservesThreshold });
        await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, reservesThreshold);

        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);

        await expectRevert(psm.allocateSurplus(), 'PegStabilityModule: No surplus to allocate');
      });
    });

    describe('deposit', function () {
      it('sends surplus to PCVDeposit target when called', async () => {
        const startingSurplusBalance = await weth.balanceOf(pcvDeposit.address);

        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: reservesThreshold.mul(2) });
        await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, reservesThreshold.mul(2));

        expect(await psm.hasSurplus()).to.be.true;
        expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold);

        await psm.deposit();

        expect(await psm.reservesSurplus()).to.be.equal(0);
        expect(await psm.hasSurplus()).to.be.false;

        const endingSurplusBalance = await weth.balanceOf(pcvDeposit.address);
        const endingPSMBalance = await weth.balanceOf(psm.address);

        expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
        expect(endingPSMBalance).to.be.equal(reservesThreshold);
      });

      it('succeeds when called and sends no value when reserves are met', async () => {
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: reservesThreshold });
        await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, reservesThreshold);

        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);

        await psm.deposit();

        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);
      });
    });
  });
});
