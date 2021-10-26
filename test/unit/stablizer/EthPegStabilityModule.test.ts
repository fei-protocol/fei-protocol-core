import hre, { ethers } from 'hardhat';
import { expectRevert, getAddresses, getCore, deployDevelopmentWeth, ZERO_ADDRESS } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { Core, Fei, MockOracle, EthPegStabilityModule, MockPCVDepositV2 } from '@custom-types/contracts';

describe('EthPegStabilityModule', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  const mintFeeBasisPoints = 30;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(5); // hold onto 5 ether in the contract
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const mintAmount = ethers.constants.WeiPerEther.mul(1_000);
  const decimalsNormalizer = 0; // because the oracle price is scaled 1e18, need to divide out by that before testing
  const bpGranularity = 10_000;
  const impersonatedSigners: { [key: string]: Signer } = {};
  const ethPrice = 4_100;

  let core: Core;
  let fei: Fei;
  let oracle: MockOracle;
  let psm: EthPegStabilityModule;
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
    oracle = await (await ethers.getContractFactory('MockOracle')).deploy(ethPrice);
    pcvDeposit = await (await ethers.getContractFactory('MockPCVDepositV2')).deploy(core.address, ZERO_ADDRESS, 0, 0);

    psm = await (
      await ethers.getContractFactory('EthPegStabilityModule')
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
      expect(await psm.token()).to.be.equal(ZERO_ADDRESS);
    });
  });

  describe('Mint', function () {
    describe('Sells Eth for FEI', function () {
      it('exchanges 1 ETH for 4100 FEI', async function () {
        const oneEth = ethers.constants.WeiPerEther;
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await ethers.provider.getBalance(psm.address);

        const expectedMintAmountOut = oneEth
          .mul(ethPrice)
          .mul(bpGranularity - mintFeeBasisPoints)
          .div(bpGranularity);

        const mintAmountOut = await psm.getMintAmountOut(oneEth);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneEth, { value: oneEth });

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await ethers.provider.getBalance(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneEth);
        expect(await psm.buffer()).to.be.equal(bufferCap.sub(mintAmountOut));
      });

      it('exchanges for appropriate amount of tokens when eth price is $10,000', async function () {
        await oracle.setExchangeRate(10_000);

        const oneEth = ethers.constants.WeiPerEther;
        const userStartingFeiBalance = await fei.balanceOf(userAddress);
        const psmStartingAssetBalance = await ethers.provider.getBalance(psm.address);

        const expectedMintAmountOut = oneEth
          .mul(10_000)
          .mul(bpGranularity - mintFeeBasisPoints)
          .div(bpGranularity);

        const mintAmountOut = await psm.getMintAmountOut(oneEth);

        expect(mintAmountOut).to.be.equal(expectedMintAmountOut);

        await psm.connect(impersonatedSigners[userAddress]).mint(userAddress, oneEth, { value: oneEth });

        const userEndingFeiBalance = await fei.balanceOf(userAddress);
        const psmEndingAssetBalance = await ethers.provider.getBalance(psm.address);

        expect(userEndingFeiBalance.sub(userStartingFeiBalance)).to.be.equal(expectedMintAmountOut);
        expect(psmEndingAssetBalance.sub(psmStartingAssetBalance)).to.be.equal(oneEth);
        expect(await psm.buffer()).to.be.equal(bufferCap.sub(mintAmountOut));
      });

      it('fails when eth sent and amount do not match', async function () {
        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount.sub(10), {
            value: mintAmount
          }),
          'EthPegStabilityModule: Sent value does not equal input'
        );
      });

      it('mint fails when contract is paused', async function () {
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).mint(userAddress, mintAmount, { value: mintAmount }),
          'Pausable: paused'
        );
      });
    });
  });

  describe('Redeem', function () {
    describe('Sells FEI for Eth', function () {
      beforeEach(async () => {
        await psm
          .connect(impersonatedSigners[pcvControllerAddress])
          .mint(pcvControllerAddress, mintAmount, { value: mintAmount });
      });

      it('redeem succeeds when user has enough FEI', async function () {
        const amount = ethers.constants.WeiPerEther;
        await oracle.setExchangeRate(5_000);

        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, amount);
        await fei.connect(impersonatedSigners[userAddress]).approve(psm.address, amount);

        const startingUserFeiBalance = await fei.balanceOf(userAddress);
        const startingEthBalance = await ethers.provider.getBalance(governorAddress);

        const expectedAssetAmount = amount
          .div(5_000)
          .mul(bpGranularity - redeemFeeBasisPoints)
          .div(bpGranularity);
        const actualAssetAmount = await psm.getRedeemAmountOut(amount);

        expect(expectedAssetAmount).to.be.equal(actualAssetAmount);

        await psm.connect(impersonatedSigners[userAddress]).redeem(governorAddress, amount);

        const endingUserFeiBalance = await fei.balanceOf(userAddress);
        const endingEthBalance = await ethers.provider.getBalance(governorAddress);

        expect(endingUserFeiBalance).to.be.equal(startingUserFeiBalance.sub(amount));
        expect(await fei.balanceOf(psm.address)).to.be.equal(0);

        expect(endingEthBalance.sub(startingEthBalance)).to.be.equal(expectedAssetAmount);
      });

      it('redeem fails when contract is paused', async function () {
        await psm.connect(impersonatedSigners[governorAddress]).pause();
        expect(await psm.paused()).to.be.true;

        await expectRevert(
          psm.connect(impersonatedSigners[userAddress]).redeem(userAddress, mintAmount),
          'Pausable: paused'
        );
      });

      it('fails when there is no eth in the contract', async function () {
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

    describe('withdrawETH', function () {
      it('fails when caller is not PCVController', async function () {
        await expectRevert(psm.withdrawETH(userAddress, 100), 'CoreRef: Caller is not a PCV controller');
      });

      it('succeeds when caller is PCVController', async function () {
        const amount = 10_000_000;
        const startingEthBalance = await ethers.provider.getBalance(userAddress);

        await psm
          .connect(impersonatedSigners[pcvControllerAddress])
          .mint(pcvControllerAddress, amount, { value: amount });

        await psm.connect(impersonatedSigners[pcvControllerAddress]).withdrawETH(userAddress, await psm.balance());

        const endingBalance = await psm.balance();
        expect(endingBalance).to.be.equal(0);
        const endingEthBalance = await ethers.provider.getBalance(userAddress);

        expect(endingEthBalance.sub(startingEthBalance)).to.be.equal(amount);
      });
    });
  });

  describe('allocateSurplus', function () {
    it('sends surplus to PCVDeposit target when called', async function () {
      await impersonatedSigners[userAddress].sendTransaction({
        to: psm.address,
        value: ethers.constants.WeiPerEther.mul(10)
      });

      const startingEthBalance = await ethers.provider.getBalance(pcvDeposit.address);
      expect(await psm.hasSurplus()).to.be.true;
      await psm.allocateSurplus();
      const endingEthBalance = await ethers.provider.getBalance(pcvDeposit.address);

      expect(endingEthBalance.sub(startingEthBalance)).to.be.equal(reservesThreshold);
    });
  });

  describe('deposit', function () {
    it('sends surplus to PCVDeposit target when called', async function () {
      await impersonatedSigners[userAddress].sendTransaction({
        to: psm.address,
        value: ethers.constants.WeiPerEther.mul(10)
      });

      const startingEthBalance = await ethers.provider.getBalance(pcvDeposit.address);
      expect(await psm.hasSurplus()).to.be.true;
      await psm.deposit();
      const endingEthBalance = await ethers.provider.getBalance(pcvDeposit.address);

      expect(endingEthBalance.sub(startingEthBalance)).to.be.equal(reservesThreshold);
    });

    it('succeeds when called', async function () {
      await psm.deposit();
    });
  });
});
