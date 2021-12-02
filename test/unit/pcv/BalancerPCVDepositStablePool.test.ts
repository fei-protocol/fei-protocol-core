import { getImpersonatedSigner, balance, getAddresses, getCore } from '@test/helpers';
import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import {
  Fei,
  IWETH,
  IERC20,
  MockERC20,
  MockERC20__factory,
  MockOracle,
  MockOracle__factory,
  MockWeth,
  MockWeth__factory,
  MockVault,
  MockVault__factory,
  MockMerkleOrchard,
  MockMerkleOrchard__factory,
  BalancerPCVDepositStablePool,
  BalancerPCVDepositStablePool__factory,
  Core
} from '@custom-types/contracts';
import { expectApproxAbs } from '@test/helpers';

chai.config.includeStack = true;
const toBN = ethers.BigNumber.from;

describe('BalancerPCVDepositStablePool', function () {
  let core: Core;
  let vault: MockVault;
  let rewards: MockMerkleOrchard;
  let deposit: BalancerPCVDepositStablePool;

  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  before(async () => {
    const addresses = await getAddresses();
    userAddress = addresses.userAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
  });

  describe('With 2 ERC20s', function () {
    let weth: MockWeth;
    let wsteth: MockERC20;

    beforeEach(async function () {
      core = await getCore();
      weth = await new MockWeth__factory(await getImpersonatedSigner(userAddress)).deploy();
      wsteth = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
        [wsteth.address, weth.address],
        userAddress
      );
      await vault.setMockDoTransfers(true);
      rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(weth.address);
      deposit = await new BalancerPCVDepositStablePool__factory(await getImpersonatedSigner(userAddress)).deploy(
        core.address,
        vault.address,
        rewards.address,
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
        '300', // max 3% slippage
        weth.address
      );
    });

    describe('Deposit', function () {
      it('reverts if paused', async function () {
        await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expect(deposit.deposit()).to.be.revertedWith('Pausable: paused');
      });

      it('succeeds if not paused - updates balance() and resistantBalanceAndFei()', async function () {
        // seed the deposit
        await weth.mint(deposit.address, '250');
        await wsteth.mint(deposit.address, '250');

        expect(await deposit.balance()).to.be.equal('0');
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '500', '1');

        const resistantBalanceAndFei = await deposit.resistantBalanceAndFei();
        expectApproxAbs(resistantBalanceAndFei[0], '500', '1');
        expect(resistantBalanceAndFei[1]).to.be.equal('0'); // no FEI
      });
    });

    describe('Withdraw', function () {
      it('reverts if paused', async function () {
        await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expect(
          deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000')
        ).to.be.revertedWith('Pausable: paused');
      });

      it('reverts if not PCVController', async function () {
        await expect(
          deposit.connect(await getImpersonatedSigner(userAddress)).withdraw(userAddress, '1000')
        ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
      });

      it('succeeds if deposit is not empty', async function () {
        // deposit in the PCVDeposit
        await weth.mint(deposit.address, '250');
        await wsteth.mint(deposit.address, '250');
        await deposit.deposit();

        expectApproxAbs(await deposit.balance(), '500', '10');
        expect(await weth.balanceOf(userAddress)).to.be.equal('0');
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '10');
        expect(await weth.balanceOf(userAddress)).to.be.equal('10');
      });
    });

    describe('Withdraw ERC20', function () {
      it('reverts if not PCVController', async function () {
        await expect(
          deposit.connect(await getImpersonatedSigner(userAddress)).withdrawERC20(weth.address, userAddress, '1000')
        ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
      });

      it('succeeds if called as PCVController', async function () {
        await wsteth.mint(deposit.address, '20000');

        expect(await wsteth.balanceOf(deposit.address)).to.be.equal('20000');
        expect(await wsteth.balanceOf(userAddress)).to.be.equal('0');

        // send half of rewards somewhere else
        await deposit
          .connect(await getImpersonatedSigner(pcvControllerAddress))
          .withdrawERC20(wsteth.address, userAddress, '10000');

        expect(await wsteth.balanceOf(deposit.address)).to.be.equal('10000');
        expect(await wsteth.balanceOf(userAddress)).to.be.equal('10000');
      });
    });

    describe('Exit pool', function () {
      it('reverts if paused', async function () {
        await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expect(deposit.exitPool(userAddress)).to.be.revertedWith('Pausable: paused');
      });

      it('reverts if not PCVController', async function () {
        await expect(
          deposit.connect(await getImpersonatedSigner(userAddress)).exitPool(userAddress)
        ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
      });

      it('succeeds and sends tokens to target', async function () {
        // deposit in the PCVDeposit
        await weth.mint(deposit.address, '250');
        await wsteth.mint(deposit.address, '250');
        await deposit.deposit();
        expect(await weth.balanceOf(userAddress)).to.be.equal('0');
        expect(await wsteth.balanceOf(userAddress)).to.be.equal('0');
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(userAddress);
        expect(await weth.balanceOf(userAddress)).to.be.equal('250');
        expect(await wsteth.balanceOf(userAddress)).to.be.equal('250');
      });
    });
  });

  describe('With 3 ERC20s, including FEI', function () {
    let fei: Fei;
    let dai: MockERC20;
    let lusd: MockERC20;
    let poolAddress: string;

    beforeEach(async function () {
      core = await getCore();
      fei = await ethers.getContractAt('Fei', await core.fei());
      dai = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      lusd = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
        [fei.address, dai.address, lusd.address],
        userAddress
      );
      poolAddress = await vault._pool();
      await vault.setMockDoTransfers(true);
      rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(fei.address);
      deposit = await new BalancerPCVDepositStablePool__factory(await getImpersonatedSigner(userAddress)).deploy(
        core.address,
        vault.address,
        rewards.address,
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000098', // poolId
        '100', // max 1% slippage
        dai.address
      );

      // grant Minter role to be able to manage FEI
      await core.grantMinter(deposit.address);
    });

    describe('Deposit', function () {
      it('Should mint required FEI, and update the balances properly', async function () {
        // start with 0
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await dai.balanceOf(poolAddress)).to.be.equal('0');
        expect(await lusd.balanceOf(poolAddress)).to.be.equal('0');

        // mint and deposit, 500 of each (500 FEI is minted by the deposit)
        await dai.mint(deposit.address, '500');
        await lusd.mint(deposit.address, '500');
        await deposit.deposit();

        // the pool should have 500 of each
        expect(await fei.balanceOf(poolAddress)).to.be.equal('500');
        expect(await dai.balanceOf(poolAddress)).to.be.equal('500');
        expect(await lusd.balanceOf(poolAddress)).to.be.equal('500');

        // check balance() and resistantBalanceAndFei()
        expectApproxAbs(await deposit.balance(), '1000', '1'); // [999, 1001]
        const resistantBalanceAndFei = await deposit.resistantBalanceAndFei();
        expectApproxAbs(resistantBalanceAndFei[0], '1000', '1'); // [999, 1001]
        expectApproxAbs(resistantBalanceAndFei[1], '500', '1'); // [499, 501]
      });
    });

    describe('Exit Pool', function () {
      it('Should burn the FEI', async function () {
        await dai.mint(deposit.address, '500');
        await lusd.mint(deposit.address, '500');
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '1000', '1'); // [999, 1001]
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(deposit.address);
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await dai.balanceOf(poolAddress)).to.be.equal('0');
        expect(await lusd.balanceOf(poolAddress)).to.be.equal('0');
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
        expect(await dai.balanceOf(deposit.address)).to.be.equal('500');
        expect(await lusd.balanceOf(deposit.address)).to.be.equal('500');
      });
    });
  });
});
