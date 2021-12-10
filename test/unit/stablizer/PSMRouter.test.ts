import hre, { ethers } from 'hardhat';
import {
  getAddresses,
  getCore,
  deployDevelopmentWeth,
  getImpersonatedSigner,
  MAX_UINT256,
  expectRevert
} from '@test/helpers';
import { expect } from 'chai';
import { Signer, utils } from 'ethers';
import { Core, Fei, MockOracle, MockPCVDepositV2, PegStabilityModule, PSMRouter, WETH9 } from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;

describe('PSM Router', function () {
  let userAddress;
  let minterAddress;
  let psmAdminAddress;
  let receiver;

  const mintFeeBasisPoints = 30;
  const redeemFeeBasisPoints = 30;
  const reservesThreshold = ethers.constants.WeiPerEther.mul(10_000_000);
  const feiLimitPerSecond = ethers.constants.WeiPerEther.mul(10_000);
  const bufferCap = ethers.constants.WeiPerEther.mul(10_000_000);
  const decimalsNormalizer = 0; // because the oracle price is scaled 1e18, need to divide out by that before testing
  const impersonatedSigners: { [key: string]: Signer } = {};
  const PSM_ADMIN_ROLE = keccak256(utils.toUtf8Bytes('PSM_ADMIN_ROLE'));

  let core: Core;
  let fei: Fei;
  let oracle: MockOracle;
  let psm: PegStabilityModule;
  let pcvDeposit: MockPCVDepositV2;
  let psmRouter: PSMRouter;
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
    minterAddress = addresses.minterAddress;
    psmAdminAddress = addresses.beneficiaryAddress1;
    receiver = addresses.beneficiaryAddress2;

    core = await getCore();
    fei = await ethers.getContractAt('Fei', await core.fei());
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

    psmRouter = await (await ethers.getContractFactory('PSMRouter')).deploy(psm.address, fei.address);

    await core.grantMinter(psm.address);
    await core.grantMinter(minterAddress);

    /// Create PSM admin role
    await core.createRole(PSM_ADMIN_ROLE, await core.GOVERN_ROLE());
    // grant PSM admin role
    await core.grantRole(PSM_ADMIN_ROLE, psmAdminAddress);

    await fei.connect(impersonatedSigners[minterAddress]).mint(psm.address, bufferCap);
  });

  describe('after contract initialization, parameters are correct:', function () {
    it('fei address', async () => {
      expect(await psmRouter.fei()).to.be.equal(fei.address);
    });

    it('psm address', async () => {
      expect(await psmRouter.psm()).to.be.equal(psm.address);
    });

    it('FEI allowance', async () => {
      expect(await fei.allowance(psmRouter.address, psm.address)).to.be.equal(MAX_UINT256);
    });

    it('getMaxMintAmountOut', async () => {
      expect(await psmRouter.getMaxMintAmountOut()).to.be.equal(bufferCap.add(await fei.balanceOf(psm.address)));
    });

    it('getMaxRedeemAmountOut', async () => {
      expect(await psmRouter.getMaxRedeemAmountOut()).to.be.equal(0);
    });
  });

  describe('fallback', function () {
    it('sending eth to the fallback function fails', async () => {
      await expectRevert(
        impersonatedSigners[userAddress].sendTransaction({
          to: psmRouter.address,
          value: ethers.utils.parseEther('1.0')
        }),
        'PSMRouter: fallback sender must be WETH contract'
      );
    });
  });

  describe('Redeem', function () {
    beforeEach(async () => {
      await weth.connect(impersonatedSigners[userAddress]).deposit({ value: ethers.constants.WeiPerEther.mul(10) });
      await weth.connect(impersonatedSigners[userAddress]).transfer(psm.address, ethers.constants.WeiPerEther.mul(10));
      await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, bufferCap);
      await fei.approve(psmRouter.address, MAX_UINT256);
    });

    describe('Sells FEI for ETH without deadline', function () {
      it('getRedeemAmountOut gives exchange rate of 10,000,000 FEI to 1.994 ETH', async () => {
        const expectedEthAmount = 1994;
        const actualEthAmount = await psmRouter.getRedeemAmountOut(10_000_000);
        expect(expectedEthAmount).to.be.equal(actualEthAmount);
      });

      it('getRedeemAmountOut gives same exchange rate as PSM', async () => {
        const actualEthAmountRouter = await psmRouter.getRedeemAmountOut(10_000_000);
        const actualEthAmountPSM = await psm.getRedeemAmountOut(10_000_000);

        expect(actualEthAmountRouter).to.be.equal(actualEthAmountPSM);
      });

      it('exchanges 10,000,000 FEI for 1.994 ETH', async () => {
        const expectedEthAmount = 1994;
        const startingUserEthBalance = await ethers.provider.getBalance(receiver);
        const startingUserFEIBalance = await fei.balanceOf(userAddress);

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['redeem(address,uint256,uint256)'](receiver, 10_000_000, expectedEthAmount);

        const endingUserFEIBalance = await fei.balanceOf(userAddress);
        const endingUserEthBalance = await ethers.provider.getBalance(receiver);
        const endingEthBalance = await ethers.provider.getBalance(psmRouter.address);

        expect(endingUserEthBalance.sub(startingUserEthBalance)).to.be.equal(expectedEthAmount);
        expect(startingUserFEIBalance.sub(endingUserFEIBalance)).to.be.equal(10_000_000);
        expect(endingEthBalance).to.be.equal(0);
      });

      it('redeem fails when eth receiver reverts', async () => {
        const ethReceiver = await (await ethers.getContractFactory('RevertReceiver')).deploy();
        const expectedEthAmount = 1994;
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, bufferCap);
        await fei.approve(psmRouter.address, MAX_UINT256);

        await expectRevert(
          psmRouter
            .connect(impersonatedSigners[userAddress])
            ['redeem(address,uint256,uint256)'](ethReceiver.address, 10_000_000, expectedEthAmount),
          'PSMRouter: eth transfer failed'
        );
      });
    });

    describe('Sells FEI for ETH with deadline', function () {
      it('exchanges 10,000,000 FEI for 1.994 ETH when deadline is in the future', async () => {
        const expectedEthAmount = 1994;
        const startingUserEthBalance = await ethers.provider.getBalance(receiver);
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, bufferCap);
        await fei.approve(psmRouter.address, MAX_UINT256);
        const startingUserFEIBalance = await fei.balanceOf(userAddress);
        const { timestamp } = await hre.ethers.provider.getBlock('latest');

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['redeem(address,uint256,uint256,uint256)'](receiver, 10_000_000, expectedEthAmount, timestamp + 10);

        const endingUserFEIBalance = await fei.balanceOf(userAddress);
        const endingUserEthBalance = await ethers.provider.getBalance(receiver);
        const endingEthBalance = await ethers.provider.getBalance(psmRouter.address);

        expect(endingUserEthBalance.sub(startingUserEthBalance)).to.be.equal(expectedEthAmount);
        expect(startingUserFEIBalance.sub(endingUserFEIBalance)).to.be.equal(10_000_000);
        expect(endingEthBalance).to.be.equal(0);
      });

      it('exchanges fails when deadline is in the past', async () => {
        const { timestamp } = await hre.ethers.provider.getBlock('latest');

        await expectRevert(
          psmRouter
            .connect(impersonatedSigners[userAddress])
            ['redeem(address,uint256,uint256,uint256)'](receiver, 10_000_000, 1000, timestamp - 10),
          'PSMRouter: order expired'
        );
      });

      it('redeem fails when eth receiver reverts and deadline is in the future', async () => {
        const ethReceiver = await (await ethers.getContractFactory('RevertReceiver')).deploy();
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: ethers.constants.WeiPerEther.mul(10) });
        await weth
          .connect(impersonatedSigners[userAddress])
          .transfer(psm.address, ethers.constants.WeiPerEther.mul(10));
        const expectedEthAmount = 1994;
        await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, bufferCap);
        await fei.approve(psmRouter.address, MAX_UINT256);
        const { timestamp } = await hre.ethers.provider.getBlock('latest');

        await expectRevert(
          psmRouter
            .connect(impersonatedSigners[userAddress])
            ['redeem(address,uint256,uint256,uint256)'](
              ethReceiver.address,
              10_000_000,
              expectedEthAmount,
              timestamp + 10
            ),
          'PSMRouter: eth transfer failed'
        );
      });
    });
  });

  describe('Mint', function () {
    describe('With Deadline', function () {
      it('mint fails when deadline has passed', async () => {
        const minAmountOut = 4985;

        await expectRevert(
          psmRouter
            .connect(impersonatedSigners[userAddress])
            ['mint(address,uint256,uint256,uint256)'](userAddress, minAmountOut, 0, 1, { value: 1 }),
          'PSMRouter: order expired'
        );
      });

      it('mint succeeds when deadline is in the future', async () => {
        const minAmountOut = 4985;
        const userStartingFEIBalance = await fei.balanceOf(userAddress);
        const { timestamp } = await hre.ethers.provider.getBlock('latest');

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256,uint256)'](userAddress, minAmountOut, timestamp + 10, 1, { value: 1 });

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
      });
    });

    describe('Without Deadline', function () {
      it('getMintAmountOut gives correct exchange rate with 1 wei', async () => {
        const minAmountOut = 4985;
        const expectedAmountOut = await psmRouter.getMintAmountOut(1);
        expect(expectedAmountOut).to.be.equal(minAmountOut);
      });

      it('getMintAmountOut on router and PSM return the same value', async () => {
        const expectedAmountOutRouter = await psmRouter.getMintAmountOut(1);
        const expectedAmountOutPSM = await psm.getMintAmountOut(1);
        expect(expectedAmountOutRouter).to.be.equal(expectedAmountOutPSM);
      });

      it('mint succeeds with 1 wei', async () => {
        const minAmountOut = 4985;
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256)'](userAddress, minAmountOut, 1, { value: 1 });

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
      });

      it('mint fails when msg.value and ethAmountIn mismatch', async () => {
        await expectRevert(
          psmRouter
            .connect(impersonatedSigners[userAddress])
            ['mint(address,uint256,uint256)'](userAddress, 0, 2, { value: 1 }),
          'PSMRouter: ethAmountIn and msg.value mismatch'
        );
      });

      it('mint succeeds with 1 ether', async () => {
        const minAmountOut = toBN(4985).mul(ethers.constants.WeiPerEther);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256)'](userAddress, minAmountOut, ethers.constants.WeiPerEther, {
            value: ethers.constants.WeiPerEther
          });

        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
      });

      it('mint succeeds with 2 ether', async () => {
        const minAmountOut = toBN(9970).mul(ethers.constants.WeiPerEther);
        const userStartingFEIBalance = await fei.balanceOf(userAddress);

        await psmRouter
          .connect(impersonatedSigners[userAddress])
          ['mint(address,uint256,uint256)'](userAddress, minAmountOut, toBN(2).mul(ethers.constants.WeiPerEther), {
            value: toBN(2).mul(ethers.constants.WeiPerEther)
          });
        const userEndingFEIBalance = await fei.balanceOf(userAddress);
        expect(userEndingFEIBalance.sub(userStartingFEIBalance)).to.be.equal(minAmountOut);
      });
    });
  });
});
