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
import {
  Core,
  MockERC20,
  Fei,
  MockOracle,
  MockPCVDepositV2,
  ConstantOracle,
  SafeCeilingPSM
} from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;

describe('SafePSM', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  let psmAdminAddress;

  const mintFeeBasisPoints = 0;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(10_000_000);
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const assetCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const mintAmount = ethers.constants.WeiPerEther.mul(1_000);
  const decimalsNormalizer = 0; // because the oracle price is scaled 1e18, need to divide out by that before testing
  const bpGranularity = 10_000;
  const impersonatedSigners: { [key: string]: Signer } = {};
  const PSM_ADMIN_ROLE = keccak256(utils.toUtf8Bytes('PSM_ADMIN_ROLE'));

  const floorPrice = 9_800;
  const ceilingPrice = 10_200;

  let core: Core;
  let asset: MockERC20;
  let fei: Fei;
  let oracle: MockOracle;
  let psm: SafeCeilingPSM;
  let pcvDeposit: MockPCVDepositV2;
  let fixedPriceOracle: ConstantOracle;

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
    oracle = await (await ethers.getContractFactory('MockOracle')).deploy(1);
    asset = await (await ethers.getContractFactory('MockERC20')).deploy();
    pcvDeposit = await (await ethers.getContractFactory('MockPCVDepositV2')).deploy(core.address, asset.address, 0, 0);
    fixedPriceOracle = await (await ethers.getContractFactory('ConstantOracle')).deploy(core.address, 10_000);

    psm = await (
      await ethers.getContractFactory('SafeCeilingPSM')
    ).deploy(
      floorPrice,
      ceilingPrice,
      {
        coreAddress: core.address,
        oracleAddress: fixedPriceOracle.address,
        backupOracle: ZERO_ADDRESS,
        decimalsNormalizer,
        doInvert: false
      },
      mintFeeBasisPoints,
      redeemFeeBasisPoints,
      reservesThreshold,
      feiLimitPerSecond,
      bufferCap,
      asset.address,
      pcvDeposit.address,
      oracle.address,
      assetCap
    );

    await core.grantMinter(psm.address);
    await core.grantMinter(minterAddress);

    /// Create PSM admin role
    await core.createRole(PSM_ADMIN_ROLE, await core.GOVERN_ROLE());
    // grant PSM admin role
    await core.grantRole(PSM_ADMIN_ROLE, psmAdminAddress);

    await fei.connect(impersonatedSigners[minterAddress]).mint(psm.address, bufferCap);
    await psm.updateCurrentExposure();
  });

  describe('after contract initialization, parameters are correct:', function () {
    it('oracle address', async () => {
      expect(await psm.oracle()).to.be.equal(fixedPriceOracle.address);
    });

    it('asset cap is correct', async () => {
      expect(await psm.assetCap()).to.be.equal(assetCap);
    });

    it('currentExposure starts at 0', async () => {
      expect(await psm.currentExposure()).to.be.equal(0);
    });

    it('backup oracle address is correct', async () => {
      expect(await psm.backupOracle()).to.be.equal(ZERO_ADDRESS);
    });

    it('actual price oracle address is correct', async () => {
      expect(await psm.actualPriceOracle()).to.be.equal(oracle.address);
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
      expect(await psm.underlyingToken()).to.be.equal(asset.address);
    });

    it('price floor', async () => {
      expect(await psm.floor()).to.be.equal(floorPrice);
    });

    it('price ceiling', async () => {
      expect(await psm.ceiling()).to.be.equal(ceilingPrice);
    });

    it('balance', async () => {
      expect(await psm.balance()).to.be.equal(0);
    });

    it('reservesSurplus', async () => {
      expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold.mul(-1));
    });

    it('balanceReportedIn', async () => {
      expect(await psm.balanceReportedIn()).to.be.equal(asset.address);
    });

    it('hasSurplus', async () => {
      expect(await psm.hasSurplus()).to.be.false;
    });

    it('CONTRACT_ADMIN_ROLE', async () => {
      expect(await psm.CONTRACT_ADMIN_ROLE()).to.be.equal(PSM_ADMIN_ROLE);
    });
  });

  describe('Mint', function () {
    describe('Sells Token for FEI', function () {
      it('mint fails when current exposure exceeds asset cap', async () => {
        const mintAmount = assetCap.add(1);

        /// set mint fee to 0
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(0);

        await asset.mint(userAddress, mintAmount);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const mintAmountOut = await psm.getMintAmountOut(mintAmount);

        expect(mintAmountOut).to.be.equal(mintAmount);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, mintAmountOut),
          'SafeCeilingPSM: Asset cap reached'
        );
      });

      it('exchanges 10 DAI for 10 FEI', async () => {
        const ten = toBN(10);
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = ten.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, ten);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, ten);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const mintAmountOut = await psm.getMintAmountOut(ten);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, ten, expectedMintAmountOut);

        const endingUserAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(ten);
        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
        expect(startingUserAssetBalance.sub(endingUserAssetBalance)).to.be.equal(ten);
      });

      it('exchanges 1000 DAI for 975 FEI as fee is 250 bips and exchange rate is 1:1', async () => {
        const oneK = toBN(1000);
        const newMintFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = 975;

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const mintAmountOut = await psm.getMintAmountOut(oneK);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, expectedMintAmountOut);

        const endingUserAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(startingUserAssetBalance.sub(endingUserAssetBalance)).to.be.equal(oneK);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneK);
        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('exchanges 1000 DAI for 975 FEI as fee is 250 bips and exchange rate is 1:1 when to address is not msg.sender', async () => {
        const oneK = toBN(1000);
        const newMintFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        const userStartingFeiBalance = await fei.balanceOf(governorAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = 975;

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const mintAmountOut = await psm.getMintAmountOut(oneK);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(governorAddress, oneK, expectedMintAmountOut);

        const endingUserAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(governorAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(startingUserAssetBalance.sub(endingUserAssetBalance)).to.be.equal(oneK);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneK);
        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('exchanges 1000 DAI for 975 FEI as fee is 300 bips and exchange rate is 1:1', async () => {
        const oneK = toBN(1000);
        const newMintFee = 300;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = 970;

        await asset.mint(userAddress, oneK);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const mintAmountOut = await psm.getMintAmountOut(oneK);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, expectedMintAmountOut);

        const endingUserAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(startingUserAssetBalance.sub(endingUserAssetBalance)).to.be.equal(oneK);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneK);

        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('exchanges 1000 DAI for 975 FEI as mint fee is 250 bips and exchange rate is 1:1', async () => {
        const oneK = toBN(1000);
        const newMintFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = 975;

        await asset.mint(userAddress, oneK);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const mintAmountOut = await psm.getMintAmountOut(oneK);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, expectedMintAmountOut);

        const endingUserAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(startingUserAssetBalance.sub(endingUserAssetBalance)).to.be.equal(oneK);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneK);

        // buffer has not been eaten into as the PSM holds FEI
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('exchanges 1000 DAI for 950 FEI as mint fee is 50 bips and exchange rate is 1DAI:1.2FEI', async () => {
        const oneK = toBN(1000);
        const newMintFee = 50;
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        // set exchange rate to 1 dai to 1.2 fei
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(12).div(10));

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, 0),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('exchange and getMintAmountOut fails when new oracle ceiling is equal to the new exchange rate', async () => {
        const oneK = toBN(1000);
        const newMintFee = 300;

        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);

        // set exchange rate to 1 dai to 1.1 fei
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(11).div(10));

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const mintAmountOut = await psm.getMintAmountOut(oneK);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, mintAmountOut),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('exchanges for appropriate amount of tokens when price is 1:1', async () => {
        const mintAmt = toBN(10_000_000);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = mintAmt.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, mintAmt);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmt);
        const userStartingAssetBalance = await asset.balanceOf(userAddress);

        const mintAmountOut = await psm.getMintAmountOut(mintAmt);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmt, expectedMintAmountOut);
        const userEndingAssetBalance = await asset.balanceOf(userAddress);

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(mintAmt);
        expect(await psm.buffer()).to.be.equal(bufferCap);
        expect(userStartingAssetBalance.sub(userEndingAssetBalance)).to.be.equal(mintAmt);
      });

      it('should not exchange when expected amount out is greater than actual amount out', async () => {
        const mintAmt = toBN(10_000_000);
        const expectedMintAmountOut = mintAmt.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, mintAmt);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmt);

        const mintAmountOut = await psm.getMintAmountOut(mintAmt);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmt, expectedMintAmountOut.add(1)),
          'PegStabilityModule: Mint not enough out'
        );
      });

      it('should not mint when expected amount out is 3x greater than minting buffer cap and all psm fei is used', async () => {
        const mintAmt = bufferCap.mul(3);
        const expectedMintAmountOut = mintAmt.mul(bpGranularity - mintFeeBasisPoints).div(bpGranularity);

        await asset.mint(userAddress, mintAmt);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmt);

        const mintAmountOut = await psm.getMintAmountOut(mintAmt);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmt, expectedMintAmountOut),
          'RateLimited: rate limit hit'
        );
      });

      it('should not mint when expected amount out is 1 more than minting buffer cap and all psm fei is used', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(0);

        const mintAmt = bufferCap.mul(2).add(1);
        /// no calcs to do for expected mint amount as there is no mint fee and exchange rate is 1:1
        const expectedMintAmountOut = mintAmt;

        await asset.mint(userAddress, mintAmt);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmt);

        const mintAmountOut = await psm.getMintAmountOut(mintAmt);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmt, expectedMintAmountOut),
          'RateLimited: rate limit hit'
        );
      });

      it('fails when token is not approved to be spent by the PSM', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, 0),
          'ERC20: transfer amount exceeds balance'
        );
      });

      it('mint fails when contract is paused', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, 0),
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

      it('redeem fails when contract is paused', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, 0),
          'Pausable: paused'
        );
      });

      it('exchanges 1000 FEI for 975 DAI as fee is 250 bips and exchange rate is 1:1', async () => {
        const oneK = toBN(1000);
        const newRedeemFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(newRedeemFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const userStartingAssetBalance = await asset.balanceOf(userAddress);
        const expectedAssetAmount = 975;

        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, oneK);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const redeemAmountOut = await psm.getRedeemAmountOut(oneK);
        expect(redeemAmountOut).to.be.equal(expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, oneK, expectedAssetAmount);

        const userEndingAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(0);
        expect(psmStartingAssetBalance.sub(psmEndingAssetBalance)).to.be.equal(expectedAssetAmount);
        expect(userEndingAssetBalance.sub(userStartingAssetBalance)).to.be.equal(expectedAssetAmount);
      });

      it('exchanges 1000 FEI for 975 DAI as fee is 250 bips and exchange rate is 1:1', async () => {
        const oneK = toBN(1000);
        const newRedeemFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(newRedeemFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedAssetAmount = 975;

        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, oneK);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const redeemAmountOut = await psm.getRedeemAmountOut(oneK);
        expect(redeemAmountOut).to.be.equal(expectedAssetAmount);
        const userStartingAssetBalance = await asset.balanceOf(userAddress);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, oneK, expectedAssetAmount);
        const userEndingAssetBalance = await asset.balanceOf(userAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingAssetBalance.sub(userStartingAssetBalance)).to.be.equal(expectedAssetAmount);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(0);
        expect(psmStartingAssetBalance.sub(psmEndingAssetBalance)).to.be.equal(expectedAssetAmount);
      });

      it('exchanges 1000 FEI for 975 DAI as fee is 250 bips and exchange rate is 1:1 and specifies a to address not msg.sender', async () => {
        const oneK = toBN(1000);
        const newRedeemFee = 250;
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(newRedeemFee);

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedAssetAmount = 975;

        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, oneK);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        const redeemAmountOut = await psm.getRedeemAmountOut(oneK);
        expect(redeemAmountOut).to.be.equal(expectedAssetAmount);
        const userStartingAssetBalance = await asset.balanceOf(governorAddress);

        await psm.connect(impersonatedSigners[userAddress]).redeem(governorAddress, oneK, expectedAssetAmount);

        const userEndingAssetBalance = await asset.balanceOf(governorAddress);
        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await asset.balanceOf(psm.address);

        expect(userEndingAssetBalance.sub(userStartingAssetBalance)).to.be.equal(expectedAssetAmount);
        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(0);
        expect(psmStartingAssetBalance.sub(psmEndingAssetBalance)).to.be.equal(expectedAssetAmount);
      });

      it('redeem succeeds when user has enough funds', async () => {
        await oracle.setExchangeRate(1);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const userStartingAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);
        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const userEndingAssetBalance = await asset.balanceOf(userAddress);
        const endingUserFeiBalance = await fei.balanceOf(userAddress);

        expect(userEndingAssetBalance.sub(userStartingAssetBalance)).to.be.equal(expectedAssetAmount);
        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019', async () => {
        /// swap should still succeed when exchange rate is under $1.02
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019 with .1 FEI', async () => {
        const pointOneFei = ethers.constants.WeiPerEther.div(10);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, pointOneFei);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, pointOneFei);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = pointOneFei.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(pointOneFei);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, pointOneFei, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(pointOneFei));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(pointOneFei.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $1.019 with .01 FEI', async () => {
        const pointOneFei = ethers.constants.WeiPerEther.div(100);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, pointOneFei);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, pointOneFei);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = pointOneFei.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(pointOneFei);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, pointOneFei, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(pointOneFei));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(pointOneFei.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds and DAI is $0.9801', async () => {
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(9801).div(10000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - redeemFeeBasisPoints).div(bpGranularity);

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds, DAI is $0.9801 and mint fee has been changed to 100 bips', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(100);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(9801).div(10000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - 100).div(bpGranularity);

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem succeeds when user has enough funds, DAI is $0.5 on chainlink oracle and mint fee has been changed to 100 bips and min floor price is $0.49', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(4_900);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.div(2));

        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(100);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - 100).div(bpGranularity);

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem fails when user has enough funds, DAI is $0.5 on chainlink oracle and min floor price is $0.98', async () => {
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.div(2));

        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(100);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - 100).div(bpGranularity);

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('redeem succeeds when user has enough funds, DAI is $0.5 and mint fee has been changed to 500 bips', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(4_900);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.div(2));

        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(300);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount.mul(bpGranularity - 300).div(bpGranularity);

        const actualAssetAmount = await psm.getRedeemAmountOut(mintAmount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);
        await asset.connect(impersonatedSigners[minterAddress]).mint(psm.address, expectedAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, expectedAssetAmount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingUserAssetBalance = await asset.balanceOf(userAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(mintAmount));
        expect(endingUserAssetBalance).to.be.equal(startingUserAssetBalance.add(actualAssetAmount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(mintAmount.add(startingPSMFeiBalance));
        expect(await psm.buffer()).to.be.equal(bufferCap);
      });

      it('redeem fails when oracle price is $2', async () => {
        await oracle.setExchangeRate(2);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, 0),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('redeem fails when expected amount out is greater than actual amount out', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount, mintAmount),
          'PegStabilityModule: Redeem not enough out'
        );
      });

      it('fails when token is not approved to be spent by the PSM', async () => {
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, 100);
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, 100, 0),
          'ERC20: transfer amount exceeds allowance'
        );
      });
    });
  });
});
