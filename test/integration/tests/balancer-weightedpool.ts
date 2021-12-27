import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, expectRevert, balance, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
const toBN = ethers.BigNumber.from;
import { TransactionResponse } from '@ethersproject/providers';
const BNe18 = (x: any) => ethers.constants.WeiPerEther.mul(toBN(x));

describe('balancer-weightedpool', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let daoSigner: any;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    await forceEth(contracts.feiDAOTimelock.address);
  });

  describe('80% BAL / 20% WETH [existing pool, report in BAL, no FEI]', function () {
    const balancerWethTribePoolId = '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014';
    const balancerWethTribePoolAddress = '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56';

    it('should properly init the PCVDeposit', async function () {
      expect(await contracts.balancerDepositBalWeth.poolId()).to.be.equal(balancerWethTribePoolId);
      expect(await contracts.balancerDepositBalWeth.poolAddress()).to.be.equal(balancerWethTribePoolAddress);
      expect(await contracts.balancerDepositBalWeth.balanceReportedIn()).to.be.equal(contracts.bal.address);
      expect(await contracts.balancerDepositBalWeth.maximumSlippageBasisPoints()).to.be.equal('100');
      expect(await contracts.balancerDepositBalWeth.vault()).to.be.equal(contracts.balancerVault.address);
      expect(await contracts.balancerDepositBalWeth.rewards()).to.be.equal(contracts.balancerRewards.address);
    });

    it('should properly report balance', async function () {
      const balPrice = (await contracts.balUsdCompositeOracle.read())[0] / 1e18; // ~= 20
      const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0] / 1e18; // ~= 4,000
      const depositBalUsd = 200000 * balPrice; // ~= 4,000,000
      const depositEthUsd = 250 * ethPrice; // ~= 1,000,000
      const depositUsd = depositBalUsd + depositEthUsd; // ~= 5,000,000
      const depositBal = depositUsd / balPrice; // ~= 250,000
      const actualBalBalance = (await contracts.balancerDepositBalWeth.balance()) / 1e18;

      // Note: After on-chain deployment, BAL and ETH price will move, so
      // the boundary is kept very large on purpose here. We just check
      // the order of magnitude. Tolerance is a 5x price movement since
      // deployment.
      expect(actualBalBalance).to.be.greaterThan(100_000); // ~= 250,000 initially
      expect(actualBalBalance).to.be.at.least(depositBal * 0.2);
      expect(actualBalBalance).to.be.at.most(depositBal * 5);
    });
  });

  describe('20% WETH / 80% TRIBE [new pool, report in TRIBE, no FEI]', function () {
    let balancerWethTribePool: any;
    let balancerDepositTribeWeth: any;

    before(async function () {
      // Create a new WETH/TRIBE pool
      const weightedPoolTwoTokensFactory = await ethers.getContractAt(
        'IWeightedPool2TokensFactory',
        contracts.balancerWeightedPoolFactory.address
      );
      const tx: TransactionResponse = await weightedPoolTwoTokensFactory.create(
        'Balancer 20 WETH 80 TRIBE',
        'B-20WETH-80TRIBE',
        [contracts.weth.address, contracts.tribe.address],
        [ethers.constants.WeiPerEther.mul(20).div(100), ethers.constants.WeiPerEther.mul(80).div(100)], // 80% TRIBE 20% WETH
        ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
        true, // oracleEnabled
        contracts.feiDAOTimelock.address // pool owner
      );
      const txReceipt = await tx.wait();
      const { logs: rawLogs } = txReceipt;
      balancerWethTribePool = await ethers.getContractAt('IWeightedPool', rawLogs[0].address);

      // Create a new Balancer deposit for the TRIBE/WETH pool
      const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
      balancerDepositTribeWeth = await balancerDepositWeightedPoolFactory.deploy(
        contracts.core.address,
        contracts.balancerVault.address,
        contracts.balancerRewards.address,
        await balancerWethTribePool.getPoolId(), // poolId
        '100', // max 1% slippage
        contracts.tribe.address, // accounting in TRIBE
        [contracts.chainlinkEthUsdOracleWrapper.address, contracts.tribeUsdCompositeOracle.address]
      );
      await balancerDepositTribeWeth.deployTransaction.wait();
    });

    it('should properly create the pool', async function () {
      const poolTokens = await contracts.balancerVault.getPoolTokens(await balancerDepositTribeWeth.poolId());
      expect(poolTokens.tokens[0]).to.be.equal(contracts.weth.address);
      expect(poolTokens.tokens[1]).to.be.equal(contracts.tribe.address);
      expect(poolTokens.balances[0]).to.be.equal('0');
      expect(poolTokens.balances[1]).to.be.equal('0');
    });

    it('should properly init the PCVDeposit', async function () {
      expect(await balancerDepositTribeWeth.poolId()).to.be.equal(await balancerWethTribePool.getPoolId());
      expect(await balancerDepositTribeWeth.poolAddress()).to.be.equal(balancerWethTribePool.address);
      expect(await balancerDepositTribeWeth.balanceReportedIn()).to.be.equal(contracts.tribe.address);
      expect(await balancerDepositTribeWeth.maximumSlippageBasisPoints()).to.be.equal('100');
      expect(await balancerDepositTribeWeth.vault()).to.be.equal(contracts.balancerVault.address);
      expect(await balancerDepositTribeWeth.rewards()).to.be.equal(contracts.balancerRewards.address);
    });

    it('should be empty initially', async function () {
      expect(await balancerDepositTribeWeth.balance()).to.be.equal('0');
      expect((await balancerDepositTribeWeth.resistantBalanceAndFei())[0]).to.be.equal('0');
      expect((await balancerDepositTribeWeth.resistantBalanceAndFei())[1]).to.be.equal('0');
      expect(await contracts.wethERC20.balanceOf(balancerDepositTribeWeth.address)).to.be.equal('0');
      expect(await contracts.tribe.balanceOf(balancerDepositTribeWeth.address)).to.be.equal('0');
    });

    it('should be able to deposit', async function () {
      // send 1 WETH and the equivalent TRIBE to the deposit
      const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0] / 1e18; // ~= 4,000
      const tribePrice = (await contracts.tribeUsdCompositeOracle.read())[0] / 1e18; // ~= 1
      const tribePerEth = ethPrice / tribePrice; // ~= 4,000
      const tribeToAllocate = BNe18(Math.round(4 * tribePerEth * 10000)).div(10000); // rounding error < slippage tolerance
      await contracts.aaveEthPCVDeposit.connect(daoSigner).withdraw(balancerDepositTribeWeth.address, BNe18('1'));
      await contracts.core.connect(daoSigner).allocateTribe(balancerDepositTribeWeth.address, tribeToAllocate);
      expect(await contracts.wethERC20.balanceOf(balancerDepositTribeWeth.address)).to.be.equal(BNe18('1'));
      expect(await contracts.tribe.balanceOf(balancerDepositTribeWeth.address)).to.be.equal(tribeToAllocate);

      // deposit funds in the pool
      await balancerDepositTribeWeth.deposit();
      expect(await contracts.wethERC20.balanceOf(balancerDepositTribeWeth.address)).to.be.equal('0');
      expect(await contracts.tribe.balanceOf(balancerDepositTribeWeth.address)).to.be.equal('0');

      const poolTokens = await contracts.balancerVault.getPoolTokens(await balancerDepositTribeWeth.poolId());
      expect(poolTokens.balances[0]).to.be.equal(BNe18('1'));
      const tribeInPool = poolTokens.balances[1] / 1e18;
      expect(tribeInPool).to.be.at.least(4 * tribePerEth * 0.99);
      expect(tribeInPool).to.be.at.most(4 * tribePerEth * 1.01);
    });

    it('after a deposit, balances are updated', async function () {
      // fetch price
      const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0] / 1e18; // ~= 4,000
      const tribePrice = (await contracts.tribeUsdCompositeOracle.read())[0] / 1e18; // ~= 1
      const tribePerEth = ethPrice / tribePrice; // ~= 4,000

      // balance() should be roughly ~= 5 ETH worth of TRIBE
      const balanceInTribe = (await balancerDepositTribeWeth.balance()) / 1e18;
      expect(balanceInTribe).to.be.at.least(5 * tribePerEth * 0.99);
      expect(balanceInTribe).to.be.at.most(5 * tribePerEth * 1.01);

      // resistantBalanceAndFei()
      const resistantBalanceAndFei = await balancerDepositTribeWeth.resistantBalanceAndFei();
      // shoud have ~5 ETH worth of TRIBE
      const resistantBalanceInTribe = resistantBalanceAndFei[0] / 1e18;
      expect(resistantBalanceInTribe).to.be.at.least(5 * tribePerEth * 0.99);
      expect(resistantBalanceInTribe).to.be.at.most(5 * tribePerEth * 1.01);
      // should have 0 FEI
      expect(resistantBalanceAndFei[1]).to.be.equal('0');
    });

    it('should be able to partially withdraw (100 TRIBE)', async function () {
      const balanceBefore = await balancerDepositTribeWeth.balance();
      await balancerDepositTribeWeth.connect(daoSigner).withdraw(balancerDepositTribeWeth.address, BNe18('100'));
      const balanceAfter = await balancerDepositTribeWeth.balance();
      expect(await contracts.tribe.balanceOf(balancerDepositTribeWeth.address)).to.be.equal(BNe18('100'));
      const balanceDiff = balanceBefore.sub(balanceAfter);
      expect(balanceDiff).to.be.at.least(BNe18('99'));
      expect(balanceDiff).to.be.at.most(BNe18('101'));
    });

    it("should be able to single-side deposit small amounts that don't create high slippage (10 TRIBE)", async function () {
      const balanceBefore = await balancerDepositTribeWeth.balance();
      await balancerDepositTribeWeth.deposit();
      const balanceAfter = await balancerDepositTribeWeth.balance();
      const balanceDiff = balanceAfter.sub(balanceBefore);
      expect(balanceDiff).to.be.at.least(BNe18('99'));
      expect(balanceDiff).to.be.at.most(BNe18('101'));
    });

    it('should revert single-side deposits that create high slippage (10M TRIBE)', async function () {
      const tribeToAllocate = BNe18('10000000');
      // seed the deposit with 10M TRIBE
      await contracts.core.connect(daoSigner).allocateTribe(balancerDepositTribeWeth.address, tribeToAllocate);
      await expectRevert(balancerDepositTribeWeth.deposit(), 'BalancerPCVDepositWeightedPool: slippage too high');
      // send back the 10M TRIBE
      await balancerDepositTribeWeth
        .connect(daoSigner)
        .withdrawERC20(contracts.tribe.address, contracts.core.address, tribeToAllocate);
    });

    it('should be able to exitPool', async function () {
      // exit the pool
      await balancerDepositTribeWeth.connect(daoSigner).exitPool(balancerDepositTribeWeth.address);

      // fetch price
      const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0] / 1e18; // ~= 4,000
      const tribePrice = (await contracts.tribeUsdCompositeOracle.read())[0] / 1e18; // ~= 1
      const tribePerEth = ethPrice / tribePrice; // ~= 4,000

      // check the amount of tokens out after exitPool
      const tribeBalanceAfterExit = (await contracts.tribe.balanceOf(balancerDepositTribeWeth.address)) / 1e18;
      const wethBalanceAfterExit = (await contracts.wethERC20.balanceOf(balancerDepositTribeWeth.address)) / 1e18;
      expect(tribeBalanceAfterExit).to.be.at.least(4 * tribePerEth * 0.99);
      expect(wethBalanceAfterExit).to.be.at.least(0.99);
    });
  });

  describe('50% FEI / 50% USDC [new pool, report in USDC, with FEI]', function () {
    let balancerFeiUsdcPool: any;
    let balancerDepositFeiUsdc: any;

    before(async function () {
      // Create a new FEI/USDC pool
      const weightedPoolTwoTokensFactory = await ethers.getContractAt(
        'IWeightedPool2TokensFactory',
        contracts.balancerWeightedPoolFactory.address
      );
      const tx: TransactionResponse = await weightedPoolTwoTokensFactory.create(
        'Balancer 50 FEI 50 USDC',
        'B-50FEI-50USDC',
        [contracts.fei.address, contracts.usdc.address],
        [ethers.constants.WeiPerEther.mul(50).div(100), ethers.constants.WeiPerEther.mul(50).div(100)], // 50% FEI 50% USDC
        ethers.constants.WeiPerEther.mul(1).div(10_000), // 0.01% swap fees
        true, // oracleEnabled
        contracts.feiDAOTimelock.address // pool owner
      );
      const txReceipt = await tx.wait();
      const { logs: rawLogs } = txReceipt;
      balancerFeiUsdcPool = await ethers.getContractAt('IWeightedPool', rawLogs[0].address);

      // Create a new Balancer deposit for the TRIBE/WETH pool
      const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
      balancerDepositFeiUsdc = await balancerDepositWeightedPoolFactory.deploy(
        contracts.core.address,
        contracts.balancerVault.address,
        contracts.balancerRewards.address,
        await balancerFeiUsdcPool.getPoolId(), // poolId
        '100', // max 1% slippage
        contracts.usdc.address, // accounting in USDC
        [contracts.oneConstantOracle.address, contracts.oneConstantOracle.address]
      );
      await balancerDepositFeiUsdc.deployTransaction.wait();

      // Grant minter role to the deposit, to be able to mint FEI
      await contracts.core.connect(daoSigner).grantMinter(balancerDepositFeiUsdc.address);
    });

    it('should mint associated FEI on deposit', async function () {
      // seed deposit with USDC
      const USDC_HOLDER = '0x0a59649758aa4d66e25f08dd01271e891fe52199';
      const signer = await getImpersonatedSigner(USDC_HOLDER);
      await forceEth(USDC_HOLDER);
      const amount = '10000000000000'; // 10M USDC (6 decimals)
      await contracts.usdc.connect(signer).transfer(balancerDepositFeiUsdc.address, amount);

      // check initial amounts and deposit
      expect(await contracts.usdc.balanceOf(balancerDepositFeiUsdc.address)).to.be.equal(amount);
      expect(await contracts.fei.balanceOf(balancerDepositFeiUsdc.address)).to.be.equal('0');
      await balancerDepositFeiUsdc.deposit();

      // check amount of tokens in pool
      const poolTokens = await contracts.balancerVault.getPoolTokens(await balancerDepositFeiUsdc.poolId());
      expect(poolTokens.balances[0]).to.be.equal(BNe18('10000000')); // 10M FEI
      expect(poolTokens.balances[1]).to.be.equal(amount); // 10M USDC
    });

    it('should report properly the balance after deposit', async function () {
      // check balance
      expect(await balancerDepositFeiUsdc.balance()).to.be.at.least('9990000000000'); // > 9.99M USDC

      // resistantBalanceAndFei
      const resistantBalanceAndFei = await balancerDepositFeiUsdc.resistantBalanceAndFei();
      expect(resistantBalanceAndFei[0]).to.be.at.least('9990000000000'); // >9.99M USDC
      expect(resistantBalanceAndFei[1]).to.be.at.least(BNe18('9990000')); // >9.99M FEI
    });

    it('should burn FEI on exitPool', async function () {
      // exitPool
      await balancerDepositFeiUsdc.connect(daoSigner).exitPool(balancerDepositFeiUsdc.address);

      // check balances
      expect(await contracts.fei.balanceOf(balancerDepositFeiUsdc.address)).to.be.equal('0'); // burn the FEI
      expect(await contracts.usdc.balanceOf(balancerDepositFeiUsdc.address)).to.be.at.least('9990000000000'); // > 9.99M USDC;
      expect(await balancerDepositFeiUsdc.balance()).to.be.equal('0');

      // check amount of tokens in pool
      const poolTokens = await contracts.balancerVault.getPoolTokens(await balancerDepositFeiUsdc.poolId());
      expect(poolTokens.balances[0]).to.be.at.most(BNe18('10')); // max 10 FEI left
      expect(poolTokens.balances[1]).to.be.at.most('10000000'); // max 10 USDC left
    });
  });

  describe('30% FEI / 70% WETH [new pool, report in WETH, with FEI]', function () {
    let balancerFeiWethPool: any;
    let balancerDepositFeiWeth: any;

    before(async function () {
      // Create a new FEI/WETH pool
      const weightedPoolTwoTokensFactory = await ethers.getContractAt(
        'IWeightedPool2TokensFactory',
        contracts.balancerWeightedPoolFactory.address
      );
      const tx: TransactionResponse = await weightedPoolTwoTokensFactory.create(
        'Balancer 30 FEI 70 WETH',
        'B-30FEI-70WETH',
        [contracts.fei.address, contracts.weth.address],
        [ethers.constants.WeiPerEther.mul(30).div(100), ethers.constants.WeiPerEther.mul(70).div(100)], // 30% FEI 70% WETH
        ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
        true, // oracleEnabled
        contracts.feiDAOTimelock.address // pool owner
      );
      const txReceipt = await tx.wait();
      const { logs: rawLogs } = txReceipt;
      balancerFeiWethPool = await ethers.getContractAt('IWeightedPool', rawLogs[0].address);

      // Create a new Balancer deposit for the FEI/WETH pool
      const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
      balancerDepositFeiWeth = await balancerDepositWeightedPoolFactory.deploy(
        contracts.core.address,
        contracts.balancerVault.address,
        contracts.balancerRewards.address,
        await balancerFeiWethPool.getPoolId(), // poolId
        '100', // max 1% slippage
        contracts.weth.address, // accounting in WETH
        [contracts.oneConstantOracle.address, contracts.chainlinkEthUsdOracleWrapper.address]
      );
      await balancerDepositFeiWeth.deployTransaction.wait();

      // Grant minter role to the deposit, to be able to mint FEI
      await contracts.core.connect(daoSigner).grantMinter(balancerDepositFeiWeth.address);
    });

    it('should be able to wrap and unwrap ETH', async function () {
      expect(await contracts.wethERC20.balanceOf(balancerDepositFeiWeth.address)).to.be.equal('0');
      expect((await balance.current(balancerDepositFeiWeth.address)).toString()).to.be.equal('0');

      await (
        await ethers.getSigner(deployAddress)
      ).sendTransaction({ to: balancerDepositFeiWeth.address, value: toBN('1000') });

      expect(await contracts.wethERC20.balanceOf(balancerDepositFeiWeth.address)).to.be.equal('0');
      expect((await balance.current(balancerDepositFeiWeth.address)).toString()).to.be.equal(toBN('1000'));

      await balancerDepositFeiWeth.wrapETH();

      expect(await contracts.wethERC20.balanceOf(balancerDepositFeiWeth.address)).to.be.equal(toBN('1000'));
      expect((await balance.current(balancerDepositFeiWeth.address)).toString()).to.be.equal('0');

      await balancerDepositFeiWeth.connect(daoSigner).unwrapETH();

      expect(await contracts.wethERC20.balanceOf(balancerDepositFeiWeth.address)).to.be.equal('0');
      expect((await balance.current(balancerDepositFeiWeth.address)).toString()).to.be.equal(toBN('1000'));
    });
  });
});
