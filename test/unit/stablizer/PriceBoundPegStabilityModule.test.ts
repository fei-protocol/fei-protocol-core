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
import { Core, MockERC20, Fei, MockOracle, PriceBoundPSM, MockPCVDepositV2 } from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;

describe('PriceBoundPegStabilityModule', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  let psmAdminAddress;

  const mintFeeBasisPoints = 30;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(10_000_000);
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
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
  let psm: PriceBoundPSM;
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

    psm = await (
      await ethers.getContractFactory('PriceBoundPSM')
    ).deploy(
      floorPrice,
      ceilingPrice,
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
      asset.address,
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
        await psm.connect(impersonatedSigners[governorAddress]).setOracleCeilingBasisPoints(12_001);

        // set exchange rate to 1 dai to 1.2 fei
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(12).div(10));

        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await asset.balanceOf(psm.address);
        const expectedMintAmountOut = 1194;

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

      it('exchange and getMintAmountOut fails when new oracle ceiling is equal to the new exchange rate', async () => {
        const oneK = toBN(1000);
        const newMintFee = 300;
        const expectedMintAmountOut = 1196;

        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);
        await psm.connect(impersonatedSigners[governorAddress]).setOracleCeilingBasisPoints(12_000);

        // set exchange rate to 1 dai to 1.2 fei
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(12).div(10));

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        await expectRevert(psm.getMintAmountOut(oneK), 'PegStabilityModule: price out of bounds');

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, expectedMintAmountOut),
          'PegStabilityModule: price out of bounds'
        );
      });

      it('exchange and getMintAmountOut fails when new oracle floor is equal to the new exchange rate', async () => {
        const oneK = toBN(1000);
        const newMintFee = 300;
        const expectedMintAmountOut = 1164;

        await psm.connect(impersonatedSigners[governorAddress]).setMintFee(newMintFee);
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(8_000);

        // set exchange rate to 1 dai to .8 fei
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(8).div(10));

        await asset.mint(userAddress, oneK);
        await asset.connect(impersonatedSigners[userAddress]).approve(psm.address, oneK);

        await expectRevert(psm.getMintAmountOut(oneK), 'PegStabilityModule: price out of bounds');

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneK, expectedMintAmountOut),
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
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.mul(1019).div(1000));
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
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

        const expectedAssetAmount = pointOneFei
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
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

        const expectedAssetAmount = pointOneFei
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(1019).div(1000));
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

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(9801).div(10000));

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

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - 100)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.mul(9801).div(10000));

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

      it('redeem succeeds when user has enough funds, DAI is $0.5 and mint fee has been changed to 100 bips', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(4_900);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.div(2));

        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(100);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - 100)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.div(2));

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

      it('redeem succeeds when user has enough funds, DAI is $0.5 and mint fee has been changed to 500 bips', async () => {
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(4_900);
        await oracle.setExchangeRateScaledBase(ethers.constants.WeiPerEther.div(2));

        await psm.connect(impersonatedSigners[governorAddress]).setRedeemFee(300);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, mintAmount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, mintAmount);

        const startingPSMFeiBalance = await fei.balanceOf(psm.address);
        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingUserAssetBalance = await asset.balanceOf(userAddress);

        const expectedAssetAmount = mintAmount
          .mul(bpGranularity - 300)
          .div(bpGranularity)
          .mul(ethers.constants.WeiPerEther)
          .div(ethers.constants.WeiPerEther.div(2));

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
        await expectRevert(psm.setSurplusTarget(asset.address), 'CoreRef: Caller is not a governor or contract admin');
      });

      it('fails when target is address 0', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setSurplusTarget(ZERO_ADDRESS),
          'PegStabilityModule: Invalid new surplus target'
        );
      });

      it('succeeds when caller is governor', async () => {
        const oldTarget = await psm.surplusTarget();
        const newTarget = asset.address;
        await expect(await psm.connect(impersonatedSigners[governorAddress]).setSurplusTarget(newTarget))
          .to.emit(psm, 'SurplusTargetUpdate')
          .withArgs(oldTarget, newTarget);
        const updatedTarget = await psm.surplusTarget();
        expect(updatedTarget).to.be.equal(newTarget);
      });

      it('succeeds when caller is governor', async () => {
        const oldTarget = await psm.surplusTarget();
        const newTarget = asset.address;
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

    describe('setOracleFloor', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(
          psm.setOracleFloorBasisPoints(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('fails when floor is 0', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(0),
          'PegStabilityModule: invalid floor'
        );
      });

      it('fails when floor is greater than ceiling', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(10_300),
          'PegStabilityModule: floor must be less than ceiling'
        );
      });

      it('succeeds when caller is psm admin', async () => {
        const newOracleFloor = 9_900;
        await psm.connect(impersonatedSigners[psmAdminAddress]).setOracleFloorBasisPoints(newOracleFloor);
        expect(await psm.floor()).to.be.equal(newOracleFloor);
      });

      it('succeeds when caller is governor', async () => {
        const newOracleFloor = 9_900;
        await psm.connect(impersonatedSigners[governorAddress]).setOracleFloorBasisPoints(newOracleFloor);
        expect(await psm.floor()).to.be.equal(newOracleFloor);
      });
    });

    describe('setOracleCeiling', function () {
      it('fails when caller is not governor or admin', async () => {
        await expectRevert(
          psm.setOracleCeilingBasisPoints(reservesThreshold.mul(1000)),
          'CoreRef: Caller is not a governor or contract admin'
        );
      });

      it('fails when ceiling is less than floor', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setOracleCeilingBasisPoints(9_000),
          'PegStabilityModule: ceiling must be greater than floor'
        );
      });

      it('fails when ceiling is zero', async () => {
        await expectRevert(
          psm.connect(impersonatedSigners[governorAddress]).setOracleCeilingBasisPoints(0),
          'PegStabilityModule: invalid ceiling'
        );
      });

      it('succeeds when caller is psm admin', async () => {
        const newOraclePriceCeiling = 10_100;
        await psm.connect(impersonatedSigners[psmAdminAddress]).setOracleCeilingBasisPoints(newOraclePriceCeiling);
        expect(await psm.ceiling()).to.be.equal(newOraclePriceCeiling);
      });

      it('succeeds when caller is governor', async () => {
        const newOraclePriceCeiling = 10_100;
        await psm.connect(impersonatedSigners[governorAddress]).setOracleCeilingBasisPoints(newOraclePriceCeiling);
        expect(await psm.ceiling()).to.be.equal(newOraclePriceCeiling);
      });
    });

    describe('withdraw', function () {
      it('fails when caller is not PCVController', async () => {
        await expectRevert(psm.withdraw(userAddress, 100), 'CoreRef: Caller is not a PCV controller');
      });

      it('succeeds when caller is PCVController', async () => {
        const amount = 10_000_000;
        await asset.mint(psm.address, amount);
        await psm.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, await psm.balance());

        const endingBalance = await psm.balance();
        expect(endingBalance).to.be.equal(0);
        expect(await asset.balanceOf(userAddress)).to.be.equal(amount);
      });
    });
  });

  describe('PCV', function () {
    describe('allocateSurplus', function () {
      it('sends surplus to PCVDeposit target when called', async () => {
        const startingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
        await asset.mint(psm.address, reservesThreshold.mul(2));

        expect(await psm.hasSurplus()).to.be.true;
        expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold);

        await psm.allocateSurplus();

        expect(await psm.reservesSurplus()).to.be.equal(0);
        expect(await psm.hasSurplus()).to.be.false;

        const endingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
        const endingPSMBalance = await asset.balanceOf(psm.address);

        expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
        expect(endingPSMBalance).to.be.equal(reservesThreshold);
      });

      it('reverts when there is no surplus to allocate', async () => {
        await asset.mint(psm.address, reservesThreshold);

        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);

        await expectRevert(psm.allocateSurplus(), 'PegStabilityModule: No surplus to allocate');
      });
    });

    describe('deposit', function () {
      it('sends surplus to PCVDeposit target when called', async () => {
        const startingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
        await asset.mint(psm.address, reservesThreshold.mul(2));

        expect(await psm.hasSurplus()).to.be.true;
        expect(await psm.reservesSurplus()).to.be.equal(reservesThreshold);

        await psm.deposit();

        expect(await psm.reservesSurplus()).to.be.equal(0);
        expect(await psm.hasSurplus()).to.be.false;

        const endingSurplusBalance = await asset.balanceOf(pcvDeposit.address);
        const endingPSMBalance = await asset.balanceOf(psm.address);

        expect(endingSurplusBalance.sub(startingSurplusBalance)).to.be.equal(reservesThreshold);
        expect(endingPSMBalance).to.be.equal(reservesThreshold);
      });

      it('succeeds when called and sends no value when reserves are met', async () => {
        await asset.mint(psm.address, reservesThreshold);
        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);

        await psm.deposit();

        expect(await psm.hasSurplus()).to.be.false;
        expect(await psm.reservesSurplus()).to.be.equal(0);
      });
    });
  });
});
