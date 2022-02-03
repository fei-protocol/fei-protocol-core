import { getImpersonatedSigner, balance, getAddresses, getCore } from '@test/helpers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { ethers } from 'hardhat';
import {
  Fei,
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
    chai.use(CBN(ethers.BigNumber));

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
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000');
        // balance() should be 79000 but is 0 because of mock implementation
        expectApproxAbs(await bal.balanceOf(userAddress), '1000', '1');
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

      it('succeeds and holds all underlying tokens', async function () {
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
    let weth: MockWeth;
    let bal: MockERC20;
    let oracleFei: MockOracle;
    let oracleWeth: MockOracle;
    let poolAddress: string;

    beforeEach(async function () {
      core = await getCore();
      fei = await ethers.getContractAt('Fei', await core.fei());
      weth = await new MockWeth__factory(await getImpersonatedSigner(userAddress)).deploy();
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

    describe('Deposit + balance checks', function () {
      it('Should mint required FEI, and update the balances properly', async function () {
        await weth.mint(deposit.address, toBN('1000'));
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(poolAddress)).to.be.equal('0');
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '1000', '1'); // [999, 1001]
        expectApproxAbs(await fei.balanceOf(poolAddress), '4000000', '1000'); // [3999000, 4001000]
        expectApproxAbs(await weth.balanceOf(poolAddress), '1000', '1'); // [999, 1001]
        expectApproxAbs((await deposit.resistantBalanceAndFei())._resistantBalance, '1000', '1'); // [999, 1001]
        expectApproxAbs((await deposit.resistantBalanceAndFei())._resistantFei, '4000000', '10000'); // [3990000, 4010000]
      });
    });

    describe('Withdraw', function () {
      it('Should burn the FEI', async function () {
        await weth.mint(deposit.address, toBN('1000'));
        await deposit.deposit();
        await deposit
          .connect(await getImpersonatedSigner(pcvControllerAddress))
          .withdraw(deposit.address, toBN('1000'));
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(deposit.address)).to.be.equal(toBN('1000'));
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
      });
    });

    describe('Exit Pool', function () {
      it('Should burn the FEI if sending to self', async function () {
        await weth.mint(deposit.address, toBN('1000'));
        await deposit.deposit();
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(deposit.address);
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(deposit.address)).to.be.equal(toBN('1000'));
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
      });

      it('Should not burn the FEI if sending somewhere lese', async function () {
        await weth.mint(deposit.address, toBN('1000'));
        await deposit.deposit();
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(userAddress);
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(poolAddress)).to.be.equal('0');
        expect(await weth.balanceOf(userAddress)).to.be.equal(toBN('1000'));
        expect(await fei.balanceOf(userAddress)).to.be.equal('4000000');
      });
    });
  });

  describe('With 3 tokens and FEI (4 tokens)', function () {
    let fei: Fei;
    let token1: MockERC20;
    let token2: MockERC20;
    let token3: MockERC20;
    let bal: MockERC20;
    let oracleFei: MockOracle;
    let oracle1: MockOracle;
    let oracle2: MockOracle;
    let oracle3: MockOracle;
    let poolAddress: string;

    beforeEach(async function () {
      core = await getCore();
      fei = await ethers.getContractAt('Fei', await core.fei());
      token1 = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      token2 = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      token3 = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      bal = await new MockERC20__factory(await getImpersonatedSigner(userAddress)).deploy();
      oracleFei = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('1');
      oracle1 = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('100');
      oracle2 = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('200');
      oracle3 = await new MockOracle__factory(await getImpersonatedSigner(userAddress)).deploy('400');
      vault = await new MockVault__factory(await getImpersonatedSigner(userAddress)).deploy(
        [fei.address, token1.address, token2.address, token3.address],
        userAddress
      );
      poolAddress = await vault._pool();
      await vault.setMockDoTransfers(true);
      rewards = await new MockMerkleOrchard__factory(await getImpersonatedSigner(userAddress)).deploy(bal.address);
      deposit = await new BalancerPCVDepositWeightedPool__factory(await getImpersonatedSigner(userAddress)).deploy(
        core.address,
        vault.address,
        rewards.address,
        '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000019', // poolId
        '100', // max 1% slippage
        token1.address,
        [oracleFei.address, oracle1.address, oracle2.address, oracle3.address]
      );

      // grant Minter role to be able to manage FEI
      await core.grantMinter(deposit.address);
    });

    describe('Deposit + balance checks', function () {
      it('Should mint required FEI, and update the balances properly', async function () {
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(poolAddress)).to.be.equal('0');
        expect(await token1.balanceOf(poolAddress)).to.be.equal('0');
        expect(await token2.balanceOf(poolAddress)).to.be.equal('0');
        expect(await token3.balanceOf(poolAddress)).to.be.equal('0');
        await token1.mint(deposit.address, '1000'); // 100,000 $
        await token2.mint(deposit.address, '500'); // 100,000 $
        await token3.mint(deposit.address, '250'); // 100,000 $
        await deposit.deposit();
        expectApproxAbs(await deposit.balance(), '3000', '10'); // 300,000$ expressed in token1 that is worth 100$
        expectApproxAbs(await fei.balanceOf(poolAddress), '100000', '100'); // [99,900, 100,100]
        expectApproxAbs(await token1.balanceOf(poolAddress), '1000', '10'); // [990, 1010]
        expectApproxAbs(await token2.balanceOf(poolAddress), '500', '10'); // [490, 510]
        expectApproxAbs(await token3.balanceOf(poolAddress), '250', '10'); // [240, 260]
        expectApproxAbs((await deposit.resistantBalanceAndFei())._resistantBalance, '3000', '10'); // 300,000$ expressed in token1
        expectApproxAbs((await deposit.resistantBalanceAndFei())._resistantFei, '100000', '100'); // [99,900, 100,100]
      });
    });

    describe('Withdraw', function () {
      it('Should burn the FEI', async function () {
        await token1.mint(deposit.address, '1000'); // 100,000 $
        await token2.mint(deposit.address, '500'); // 100,000 $
        await token3.mint(deposit.address, '250'); // 100,000 $
        await deposit.deposit();
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).withdraw(userAddress, '1000');
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
        expect(await fei.balanceOf(userAddress)).to.be.equal('0');
        expectApproxAbs(await token1.balanceOf(userAddress), '1000', '10'); // [990, 1010]
      });
    });

    describe('Exit Pool', function () {
      it('Should burn the FEI if sending to self', async function () {
        await token1.mint(deposit.address, '1000'); // 100,000 $
        await token2.mint(deposit.address, '500'); // 100,000 $
        await token3.mint(deposit.address, '250'); // 100,000 $
        await deposit.deposit();
        await deposit.connect(await getImpersonatedSigner(pcvControllerAddress)).exitPool(deposit.address);
        expect(await deposit.balance()).to.be.equal('0');
        expect(await fei.balanceOf(deposit.address)).to.be.equal('0');
        expectApproxAbs(await token1.balanceOf(deposit.address), '1000', '10'); // [990, 1010]
        expectApproxAbs(await token2.balanceOf(deposit.address), '500', '10'); // [490, 510]
        expectApproxAbs(await token3.balanceOf(deposit.address), '250', '10'); // [240, 260]
      });
    });
  });
});
