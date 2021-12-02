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
  BalancerPCVDepositWeightedPool,
  BalancerPCVDepositWeightedPool__factory,
  Core
} from '@custom-types/contracts';
import { expectApproxAbs } from '@test/helpers';

chai.config.includeStack = true;
const toBN = ethers.BigNumber.from;

describe('BalancerPCVDepositWeightedPool', function () {
  let core: Core;
  let vault: MockVault;
  let rewards: MockMerkleOrchard;
  let deposit: BalancerPCVDepositWeightedPool;

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
    let bal: MockERC20;
    let oracleBal: MockOracle;
    let oracleWeth: MockOracle;

    beforeEach(async function () {
      core = await getCore();
      weth = await new MockWeth__factory(await getImpersonatedSigner(userAddress)).deploy();
      bal = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      oracleBal = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('25');
      oracleWeth = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('4000');
      vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
        [bal.address, weth.address],
        userAddress
      );
      await vault.setMockDoTransfers(true);
      rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(bal.address);
      deposit = await new BalancerPCVDepositWeightedPool__factory(await getImpersonatedSigner(userAddress)).deploy(
        core.address,
        vault.address,
        rewards.address,
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
        '300', // max 3% slippage
        bal.address,
        [oracleBal.address, oracleWeth.address]
      );
    });

    describe('Deposit', function () {
      it('reverts if paused', async function () {
        await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expect(deposit.deposit()).to.be.revertedWith('Pausable: paused');
      });

      it('reverts if slippage is too high', async function () {
        // seed the deposit with BAL & WETH
        await weth.mint(deposit.address, '2500'); // 10M$ of WETH
        await bal.mint(deposit.address, '4'); // 100$ of BAL

        await expect(deposit.deposit()).to.be.revertedWith('BalancerPCVDepositWeightedPool: slippage too high');
      });

      it('succeeds if not paused - updates balance() and resistantBalanceAndFei()', async function () {
        // seed the deposit with BAL & WETH
        await weth.mint(deposit.address, '250'); // 1M$ of WETH
        await bal.mint(deposit.address, '40000'); // 1M$ of BAL

        expect(await deposit.balance()).to.be.equal('0');
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '80000', '10');

        const resistantBalanceAndFei = await deposit.resistantBalanceAndFei();
        expectApproxAbs(resistantBalanceAndFei[0], '80000', '10');
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
        await weth.mint(deposit.address, '250'); // 1M$ of WETH
        await bal.mint(deposit.address, '40000'); // 1M$ of BAL
        await deposit.deposit();

        expectApproxAbs(await deposit.balance(), '80000', '10');
        expect(await bal.balanceOf(userAddress)).to.be.equal('0');
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '40000');
        expect(await deposit.balance()).to.be.equal('0');
        expectApproxAbs(await bal.balanceOf(userAddress), '40000', '10');
      });
    });

    describe('Withdraw ERC20', function () {
      it('reverts if not PCVController', async function () {
        await expect(
          deposit.connect(await getImpersonatedSigner(userAddress)).withdrawERC20(weth.address, userAddress, '1000')
        ).to.be.revertedWith('CoreRef: Caller is not a PCV controller');
      });

      it('succeeds if called as PCVController', async function () {
        await bal.mint(deposit.address, '20000'); // suppose we just claimed some rewards

        expect(await bal.balanceOf(deposit.address)).to.be.equal('20000');
        expect(await bal.balanceOf(userAddress)).to.be.equal('0');

        // send half of rewards somewhere else
        await deposit
          .connect(await getImpersonatedSigner(pcvControllerAddress))
          .withdrawERC20(bal.address, userAddress, '10000');

        expect(await bal.balanceOf(deposit.address)).to.be.equal('10000');
        expect(await bal.balanceOf(userAddress)).to.be.equal('10000');
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
        await weth.mint(deposit.address, '250'); // 1M$ of WETH
        await bal.mint(deposit.address, '40000'); // 1M$ of BAL
        await deposit.deposit();
        expect(await weth.balanceOf(userAddress)).to.be.equal('0');
        expect(await bal.balanceOf(userAddress)).to.be.equal('0');
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(userAddress);
        expect(await weth.balanceOf(userAddress)).to.be.equal('250');
        expect(await bal.balanceOf(userAddress)).to.be.equal('40000');
      });
    });

    describe('Claim Rewards', function () {
      it('reverts if paused', async function () {
        await deposit.connect(await getImpersonatedSigner(governorAddress)).pause();
        await expect(
          deposit.claimRewards(
            '83', // distributionId
            '524310123843078144915', // amount
            ['0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f'] // merkleProof
          )
        ).to.be.revertedWith('Pausable: paused');
      });

      it('claims some BAL on the deposit', async function () {
        expect(await bal.balanceOf(deposit.address)).to.be.equal('0');
        await deposit.claimRewards('1', '42', ['0x44ab278ba36dedbd9b06ceb6c60f884dbaeacb8b3ac4043b901267a2af02ef6f']);
        expect(await bal.balanceOf(deposit.address)).to.be.equal('42');
      });
    });

    describe('Set oracle', function () {
      it('reverts if not Governor or Admin', async function () {
        const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('3980');
        await expect(
          deposit.connect(await getImpersonatedSigner(userAddress)).setOracle(weth.address, newOracle.address)
        ).to.be.revertedWith('CoreRef: Caller is not a governor or contract admin');
      });

      it('reverts if token not in pool', async function () {
        const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('1');
        await expect(
          deposit.connect(await getImpersonatedSigner(governorAddress)).setOracle(userAddress, newOracle.address)
        ).to.be.revertedWith('BalancerPCVDepositWeightedPool: invalid token');
      });

      it("can update a token's oracle", async function () {
        const newOracle = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('33');
        expect(await deposit.tokenOraclesMapping(bal.address)).to.be.equal(oracleBal.address);
        await deposit.connect(await getImpersonatedSigner(governorAddress)).setOracle(bal.address, newOracle.address);
        expect(await deposit.tokenOraclesMapping(bal.address)).to.be.equal(newOracle.address);
      });
    });
  });

  describe('With ETH and FEI', function () {
    let fei: Fei;
    let weth: IWETH;
    let wethERC20: IERC20;
    let bal: MockERC20;
    let oracleFei: MockOracle;
    let oracleWeth: MockOracle;
    let poolAddress: string;

    beforeEach(async function () {
      core = await getCore();
      fei = await ethers.getContractAt('Fei', await core.fei());
      weth = await ethers.getContractAt('IWETH', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
      wethERC20 = await ethers.getContractAt('IERC20', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
      bal = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      oracleFei = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('1');
      oracleWeth = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('4000');
      vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
        [weth.address, fei.address],
        userAddress
      );
      poolAddress = await vault._pool();
      await vault.setMockDoTransfers(true);
      rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(bal.address);
      deposit = await new BalancerPCVDepositWeightedPool__factory(await getImpersonatedSigner(userAddress)).deploy(
        core.address,
        vault.address,
        rewards.address,
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
        '300', // max 3% slippage
        weth.address,
        [oracleWeth.address, oracleFei.address]
      );

      // grant Minter role to be able to manage FEI
      await core.grantMinter(deposit.address);
    });

    it('should be able to wrap and unwrap ETH', async function () {
      expect(await wethERC20.balanceOf(deposit.address)).to.be.equal('0');
      expect((await balance.current(deposit.address)).toString()).to.be.equal('0');

      await (await ethers.getSigner(userAddress)).sendTransaction({ to: deposit.address, value: toBN('1000') });

      expect(await wethERC20.balanceOf(deposit.address)).to.be.equal('0');
      expect((await balance.current(deposit.address)).toString()).to.be.equal(toBN('1000'));

      await deposit.wrapETH();

      expect(await wethERC20.balanceOf(deposit.address)).to.be.equal(toBN('1000'));
      expect((await balance.current(deposit.address)).toString()).to.be.equal('0');

      await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).unwrapETH();

      expect(await wethERC20.balanceOf(deposit.address)).to.be.equal('0');
      expect((await balance.current(deposit.address)).toString()).to.be.equal(toBN('1000'));
    });

    describe('Deposit', function () {
      it('Should mint required FEI, and update the balances properly', async function () {
        await (await ethers.getSigner(userAddress)).sendTransaction({ to: deposit.address, value: toBN('1000') });
        await deposit.wrapETH();
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await wethERC20.balanceOf(poolAddress)).to.be.equal('0');
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '1000', '1'); // [999, 1001]
        expectApproxAbs(await fei.balanceOf(poolAddress), '4000000', '1000'); // [3999000, 4001000]
        expectApproxAbs(await wethERC20.balanceOf(poolAddress), '1000', '1'); // [999, 1001]
        const resistantBalanceAndFei = await deposit.resistantBalanceAndFei();
        expectApproxAbs(resistantBalanceAndFei[0], '1000', '1'); // [999, 1001]
        expectApproxAbs(resistantBalanceAndFei[1], '4000000', '10000'); // [3990000, 4010000]
      });
    });

    describe('Withdraw', function () {
      it('Should burn the FEI', async function () {
        await (await ethers.getSigner(userAddress)).sendTransaction({ to: deposit.address, value: toBN('1000') });
        await deposit.wrapETH();
        await deposit.deposit();
        await deposit
          .connect(await getImpersonatedSigner(pcvControllerAddress))
          .withdraw(deposit.address, toBN('1000'));
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await wethERC20.balanceOf(poolAddress)).to.be.equal('0');
        expect(await wethERC20.balanceOf(deposit.address)).to.be.equal(toBN('1000'));
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
      });
    });

    describe('Exit Pool', function () {
      it('Should burn the FEI', async function () {
        await (await ethers.getSigner(userAddress)).sendTransaction({ to: deposit.address, value: toBN('1000') });
        await deposit.wrapETH();
        await deposit.deposit();
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(deposit.address);
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await wethERC20.balanceOf(poolAddress)).to.be.equal('0');
        expect(await wethERC20.balanceOf(deposit.address)).to.be.equal(toBN('1000'));
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
      });
    });
  });
});
