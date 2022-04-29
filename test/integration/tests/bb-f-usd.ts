import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { expectRevert, expectApproxAbs, getImpersonatedSigner, resetFork } from '@test/helpers';
import { forceEth } from '../setup/utils';
import { BigNumberish } from 'ethers';

const e18 = '000000000000000000';
const BB_F_FEI_POOLID = '0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196';
const BB_F_DAI_POOLID = '0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197';
const BB_F_LUSD_POOLID = '0xb0f75e97a114a4eb4a425edc48990e6760726709000000000000000000000198';
const BB_F_USD_ADDRESS = '0xD997f35c9b1281B82C8928039D14CdDaB5e13c20';
const BB_F_FEI_ADDRESS = '0xc8C79fCD0e859e7eC81118e91cE8E4379A481ee6';
const BB_F_DAI_ADDRESS = '0x8f4063446F5011bC1C9F79A819EFE87776F23704';
const BB_F_LUSD_ADDRESS = '0xb0F75E97A114A4EB4a425eDc48990e6760726709';
const ERC20_DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
const ERC20_LUSD = '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0';
const ERC20_FEI = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';
const ERC4626_DAI = '0xbA63738C2E476B1a0CFB6b41A7b85d304d032454';
const ERC4626_LUSD = '0x83e556baEA9b5fa5f131BC89a4C7282cA240B156';
const ERC4626_FEI = '0xf486608dbc7dd0EB80e4B9fA0FDB03E40F414030';

describe('bb-f-usd e2e', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let deposit: any;
  let daoSigner: any;
  let userSigner: any;

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
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    daoSigner = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
    userSigner = await getImpersonatedSigner('0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77');
  });

  beforeEach(async function () {
    const factory = await ethers.getContractFactory('BalancerPCVDepositBBFUSD');
    deposit = await factory.deploy(contracts.core.address, '50'); // max 0.5% slippage
    await deposit.deployed();
  });

  describe('init', function () {
    it('balanceReportedIn()', async function () {
      expect(await deposit.balanceReportedIn()).to.be.equal('0x1111111111111111111111111111111111111111');
    });
    it('balance()', async function () {
      expect(await deposit.balance()).to.be.equal('0');
    });
    it('resistantBalanceAndFei()', async function () {
      expect((await deposit.resistantBalanceAndFei())[0]).to.be.equal('0');
      expect((await deposit.resistantBalanceAndFei())[1]).to.be.equal('0');
    });
    it('public constants (pool ids, token addresses...)', async function () {
      expect(await deposit.BB_F_FEI_POOLID()).to.be.equal(BB_F_FEI_POOLID);
      expect(await deposit.BB_F_DAI_POOLID()).to.be.equal(BB_F_DAI_POOLID);
      expect(await deposit.BB_F_LUSD_POOLID()).to.be.equal(BB_F_LUSD_POOLID);
      expect(await deposit.BB_F_USD_ADDRESS()).to.be.equal(BB_F_USD_ADDRESS);
      expect(await deposit.BB_F_FEI_ADDRESS()).to.be.equal(BB_F_FEI_ADDRESS);
      expect(await deposit.BB_F_DAI_ADDRESS()).to.be.equal(BB_F_DAI_ADDRESS);
      expect(await deposit.BB_F_LUSD_ADDRESS()).to.be.equal(BB_F_LUSD_ADDRESS);
      expect(await deposit.ERC20_DAI()).to.be.equal(ERC20_DAI);
      expect(await deposit.ERC20_LUSD()).to.be.equal(ERC20_LUSD);
      expect(await deposit.ERC20_FEI()).to.be.equal(ERC20_FEI);
      expect(await deposit.ERC4626_DAI()).to.be.equal(ERC4626_DAI);
      expect(await deposit.ERC4626_LUSD()).to.be.equal(ERC4626_LUSD);
      expect(await deposit.ERC4626_FEI()).to.be.equal(ERC4626_FEI);
    });
  });

  describe('depositUnwrapped()', function () {
    const depositAmount = `10000${e18}`;

    it('should revert if paused', async function () {
      await deposit.connect(daoSigner).pause();
      await expectRevert(deposit.depositUnwrapped(0), 'Pausable: paused');
    });
    it('should revert if not PCV_CONTROLLER_ROLE', async function () {
      await expectRevert(deposit.connect(userSigner).depositUnwrapped(0), 'CoreRef: Caller is not a PCV controller');
    });
    it('should revert if slippage is too high', async function () {
      await deposit.connect(daoSigner).setMaximumSlippage(0);
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await expectRevert(deposit.depositUnwrapped(0), 'BalancerPCVDepositBBFUSD: slippage too high');
    });
    it('should revert if no DAI/LUSD/FEI are held', async function () {
      await expectRevert(deposit.depositUnwrapped(0), 'BalancerPCVDepositBBFUSD: Deposit 0');
    });
    it('should deposit a limited amount if max > 0', async function () {
      await seedDepositWith(depositAmount, depositAmount, depositAmount);

      const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      const maxDeposit = `5000${e18}`;
      await deposit.depositUnwrapped(maxDeposit);

      const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      const erc20DaiDeposited = daiLinearPoolTokensAfter.balances[0].sub(daiLinearPoolTokensBefore.balances[0]);
      const erc4626DaiDeposited = daiLinearPoolTokensAfter.balances[2].sub(daiLinearPoolTokensBefore.balances[2]);
      const erc20LusdDeposited = lusdLinearPoolTokensAfter.balances[0].sub(lusdLinearPoolTokensBefore.balances[0]);
      const erc4626LusdDeposited = lusdLinearPoolTokensAfter.balances[1].sub(lusdLinearPoolTokensBefore.balances[1]);
      const erc20FeiDeposited = feiLinearPoolTokensAfter.balances[0].sub(feiLinearPoolTokensBefore.balances[0]);
      const erc4626FeiDeposited = feiLinearPoolTokensAfter.balances[2].sub(feiLinearPoolTokensBefore.balances[2]);

      await expectApproxAbs(erc20DaiDeposited, maxDeposit, `100${e18}`);
      await expectApproxAbs(erc4626DaiDeposited, '0', '0');
      await expectApproxAbs(erc20LusdDeposited, maxDeposit, `100${e18}`);
      await expectApproxAbs(erc4626LusdDeposited, '0', '0');
      await expectApproxAbs(erc20FeiDeposited, maxDeposit, `100${e18}`);
      await expectApproxAbs(erc4626FeiDeposited, '0', '0');

      expectApproxAbs(await deposit.balance(), `15000${e18}`, `300${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[0], `10000${e18}`, `200${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[1], `5000${e18}`, `100${e18}`);

      expectApproxAbs(await contracts.dai.balanceOf(deposit.address), `5000${e18}`, '0');
      expectApproxAbs(await contracts.lusd.balanceOf(deposit.address), `5000${e18}`, '0');
      expectApproxAbs(await contracts.fei.balanceOf(deposit.address), `5000${e18}`, '0');
    });
    it('should deposit all tokens held if max = 0', async function () {
      await seedDepositWith(depositAmount, depositAmount, depositAmount);

      const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      await deposit.depositUnwrapped(0);

      const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      const erc20DaiDeposited = daiLinearPoolTokensAfter.balances[0].sub(daiLinearPoolTokensBefore.balances[0]);
      const erc4626DaiDeposited = daiLinearPoolTokensAfter.balances[2].sub(daiLinearPoolTokensBefore.balances[2]);
      const erc20LusdDeposited = lusdLinearPoolTokensAfter.balances[0].sub(lusdLinearPoolTokensBefore.balances[0]);
      const erc4626LusdDeposited = lusdLinearPoolTokensAfter.balances[1].sub(lusdLinearPoolTokensBefore.balances[1]);
      const erc20FeiDeposited = feiLinearPoolTokensAfter.balances[0].sub(feiLinearPoolTokensBefore.balances[0]);
      const erc4626FeiDeposited = feiLinearPoolTokensAfter.balances[2].sub(feiLinearPoolTokensBefore.balances[2]);

      await expectApproxAbs(erc20DaiDeposited, depositAmount, `100${e18}`);
      await expectApproxAbs(erc4626DaiDeposited, '0', '0');
      await expectApproxAbs(erc20LusdDeposited, depositAmount, `100${e18}`);
      await expectApproxAbs(erc4626LusdDeposited, '0', '0');
      await expectApproxAbs(erc20FeiDeposited, depositAmount, `100${e18}`);
      await expectApproxAbs(erc4626FeiDeposited, '0', '0');

      expectApproxAbs(await deposit.balance(), `30000${e18}`, `300${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[0], `20000${e18}`, `200${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[1], `10000${e18}`, `100${e18}`);
    });
  });

  describe('deposit()', function () {
    const depositAmount = `10000${e18}`;

    it('should revert if paused', async function () {
      await deposit.connect(daoSigner).pause();
      await expectRevert(deposit.deposit(), 'Pausable: paused');
    });
    it('should revert if slippage is too high', async function () {
      await deposit.connect(daoSigner).setMaximumSlippage(0);
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await expectRevert(deposit.deposit(), 'BalancerPCVDepositBBFUSD: slippage too high');
    });
    it('should revert if no DAI/LUSD/FEI are held', async function () {
      await expectRevert(deposit.deposit(), 'BalancerPCVDepositBBFUSD: Deposit 0');
    });
    it('should wrap in 4626 and deposit all', async function () {
      await seedDepositWith(depositAmount, depositAmount, depositAmount);

      const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      await deposit.deposit();

      const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      const erc20DaiDeposited = daiLinearPoolTokensAfter.balances[0].sub(daiLinearPoolTokensBefore.balances[0]);
      const erc4626DaiDeposited = daiLinearPoolTokensAfter.balances[2].sub(daiLinearPoolTokensBefore.balances[2]);
      const erc20LusdDeposited = lusdLinearPoolTokensAfter.balances[0].sub(lusdLinearPoolTokensBefore.balances[0]);
      const erc4626LusdDeposited = lusdLinearPoolTokensAfter.balances[1].sub(lusdLinearPoolTokensBefore.balances[1]);
      const erc20FeiDeposited = feiLinearPoolTokensAfter.balances[0].sub(feiLinearPoolTokensBefore.balances[0]);
      const erc4626FeiDeposited = feiLinearPoolTokensAfter.balances[2].sub(feiLinearPoolTokensBefore.balances[2]);

      await expectApproxAbs(erc20DaiDeposited, '0', '0');
      await expectApproxAbs(erc4626DaiDeposited, depositAmount, `100${e18}`);
      await expectApproxAbs(erc20LusdDeposited, '0', '0');
      await expectApproxAbs(erc4626LusdDeposited, depositAmount, `100${e18}`);
      await expectApproxAbs(erc20FeiDeposited, '0', '0');
      await expectApproxAbs(erc4626FeiDeposited, depositAmount, `100${e18}`);

      expectApproxAbs(await deposit.balance(), `30000${e18}`, `300${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[0], `20000${e18}`, `200${e18}`);
      expectApproxAbs((await deposit.resistantBalanceAndFei())[1], `10000${e18}`, `100${e18}`);
    });
  });

  describe('withdraw()', function () {
    const depositAmount = `10000${e18}`;

    it('should revert if paused', async function () {
      await deposit.connect(daoSigner).pause();
      await expectRevert(deposit.withdraw(deposit.address, '10000'), 'Pausable: paused');
    });
    it('should revert if not PCV_CONTROLLER_ROLE', async function () {
      await expectRevert(
        deposit.connect(userSigner).withdraw(deposit.address, '10000'),
        'CoreRef: Caller is not a PCV controller'
      );
    });
    it('should revert if slippage is too high', async function () {
      // seed the pool
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.deposit();
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.depositUnwrapped(0);

      await deposit.connect(daoSigner).setMaximumSlippage(0);

      await expectRevert(
        deposit.connect(daoSigner).withdraw(userSigner.address, depositAmount),
        // fails with BAL#416 : ERC20_TRANSFER_EXCEEDS_BALANCE
        'BAL#416'
      );
    });
    it('should revert if funds are insufficient', async function () {
      // seed the pool
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.deposit();
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.depositUnwrapped(0);

      // set deposit balance to 0 by sending its bbfusd tokens away
      await deposit
        .connect(daoSigner)
        .withdrawERC20(
          BB_F_USD_ADDRESS,
          userSigner.address,
          await contracts.balancerBoostedFuseUsdStablePool.balanceOf(deposit.address)
        );

      await expectRevert(
        deposit.connect(daoSigner).withdraw(userSigner.address, `10${e18}`),
        // fails with BAL#416 : ERC20_TRANSFER_EXCEEDS_BALANCE
        'BAL#416'
      );
    });
    it('should withdraw wrapped FEI & unwrap it before sending', async function () {
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.deposit();

      const feiBalanceBefore = await contracts.fei.balanceOf(userSigner.address);
      const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      await deposit.connect(daoSigner).withdraw(userSigner.address, depositAmount);

      const feiBalanceAfter = await contracts.fei.balanceOf(userSigner.address);
      const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
      const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
      const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

      const feiReceived = feiBalanceAfter.sub(feiBalanceBefore);
      const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
      const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
      const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
      const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
      const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
      const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

      expect(feiReceived).to.be.equal(depositAmount);
      await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
      await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
      await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
      await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
      await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
      await expectApproxAbs(erc4626FeiWithdrawn, depositAmount, `100${e18}`);
    });
  });

  describe('withdrawBatchSwap()', function () {
    const depositAmount = `10000${e18}`;
    const withdrawAmount = `3000${e18}`;

    it('should revert if paused', async function () {
      await deposit.connect(daoSigner).pause();
      await expectRevert(
        deposit.withdrawBatchSwap(
          '0x8f4063446F5011bC1C9F79A819EFE87776F23704', // BB_F_DAI_ADDRESS
          '0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197', // BB_F_DAI_POOLID
          '0xbA63738C2E476B1a0CFB6b41A7b85d304d032454', // ERC4626_DAI
          '1000',
          deposit.address,
          true
        ),
        'Pausable: paused'
      );
    });
    it('should revert if not PCV_CONTROLLER_ROLE', async function () {
      await expectRevert(
        deposit.connect(userSigner).withdrawBatchSwap(
          '0x8f4063446F5011bC1C9F79A819EFE87776F23704', // BB_F_DAI_ADDRESS
          '0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197', // BB_F_DAI_POOLID
          '0xbA63738C2E476B1a0CFB6b41A7b85d304d032454', // ERC4626_DAI
          '1000',
          deposit.address,
          true
        ),
        'CoreRef: Caller is not a PCV controller'
      );
    });
    it('should revert if slippage is too high', async function () {
      // seed the pool
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.deposit();
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.depositUnwrapped(0);

      await deposit.connect(daoSigner).setMaximumSlippage(0);

      await expectRevert(
        deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_DAI_ADDRESS, // linearPoolAddress
          BB_F_DAI_POOLID, // linearPoolId
          ERC20_DAI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          false // unwrap
        ),
        // fails with BAL#416 : ERC20_TRANSFER_EXCEEDS_BALANCE
        'BAL#416'
      );
    });
    it('should revert if funds are insufficient', async function () {
      // seed the pool
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.deposit();
      await seedDepositWith(depositAmount, depositAmount, depositAmount);
      await deposit.depositUnwrapped(0);

      // set deposit balance to 0 by sending its bbfusd tokens away
      await deposit
        .connect(daoSigner)
        .withdrawERC20(
          BB_F_USD_ADDRESS,
          userSigner.address,
          await contracts.balancerBoostedFuseUsdStablePool.balanceOf(deposit.address)
        );

      await expectRevert(
        deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_DAI_ADDRESS, // linearPoolAddress
          BB_F_DAI_POOLID, // linearPoolId
          ERC20_DAI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          false // unwrap
        ),
        // fails with BAL#416 : ERC20_TRANSFER_EXCEEDS_BALANCE
        'BAL#416'
      );
    });

    describe('successful withdraws', function () {
      beforeEach(async function () {
        await seedDepositWith(depositAmount, depositAmount, depositAmount);
        await deposit.deposit();
        await seedDepositWith(depositAmount, depositAmount, depositAmount);
        await deposit.depositUnwrapped(0);
      });

      it('should be able to withdraw DAI', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.dai.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_DAI_ADDRESS, // linearPoolAddress
          BB_F_DAI_POOLID, // linearPoolId
          ERC20_DAI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          false // unwrap
        );
        const balanceAfter = await contracts.dai.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, withdrawAmount, `100${e18}`);
        await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626FeiWithdrawn, '0', '0');
      });
      it('should be able to withdraw 4626-fDAI-8 and unwrap it to DAI', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.dai.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_DAI_ADDRESS, // linearPoolAddress
          BB_F_DAI_POOLID, // linearPoolId
          ERC4626_DAI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          true // unwrap
        );
        const balanceAfter = await contracts.dai.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626DaiWithdrawn, withdrawAmount, `100${e18}`);
        await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626FeiWithdrawn, '0', '0');
      });
      it('should be able to withdraw LUSD', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.lusd.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_LUSD_ADDRESS, // linearPoolAddress
          BB_F_LUSD_POOLID, // linearPoolId
          ERC20_LUSD, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          false // unwrap
        );
        const balanceAfter = await contracts.lusd.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc20LusdWithdrawn, withdrawAmount, `100${e18}`);
        await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626FeiWithdrawn, '0', '0');
      });
      it('should be able to withdraw 4626-fLUSD-8 and unwrap it to LUSD', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.lusd.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_LUSD_ADDRESS, // linearPoolAddress
          BB_F_LUSD_POOLID, // linearPoolId
          ERC4626_LUSD, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          true // unwrap
        );
        const balanceAfter = await contracts.lusd.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc4626LusdWithdrawn, withdrawAmount, `100${e18}`);
        await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626FeiWithdrawn, '0', '0');
      });
      it('should be able to withdraw FEI', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.fei.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_FEI_ADDRESS, // linearPoolAddress
          BB_F_FEI_POOLID, // linearPoolId
          ERC20_FEI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          false // unwrap
        );
        const balanceAfter = await contracts.fei.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc20FeiWithdrawn, withdrawAmount, `100${e18}`);
        await expectApproxAbs(erc4626FeiWithdrawn, '0', '0');
      });
      it('should be able to withdraw 4626-fFEI-8 and unwrap it to FEI (default withdraw)', async function () {
        const daiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensBefore = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const balanceBefore = await contracts.fei.balanceOf(userSigner.address);
        await deposit.connect(daoSigner).withdrawBatchSwap(
          BB_F_FEI_ADDRESS, // linearPoolAddress
          BB_F_FEI_POOLID, // linearPoolId
          ERC4626_FEI, // tokenAddress
          withdrawAmount, // tokenAmount
          userSigner.address, // tokenDestination
          true // unwrap
        );
        const balanceAfter = await contracts.fei.balanceOf(userSigner.address);

        const daiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_DAI_POOLID);
        const lusdLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_LUSD_POOLID);
        const feiLinearPoolTokensAfter = await contracts.balancerVault.getPoolTokens(BB_F_FEI_POOLID);

        const tokensReceived = balanceAfter.sub(balanceBefore);
        const erc20DaiWithdrawn = daiLinearPoolTokensBefore.balances[0].sub(daiLinearPoolTokensAfter.balances[0]);
        const erc4626DaiWithdrawn = daiLinearPoolTokensBefore.balances[2].sub(daiLinearPoolTokensAfter.balances[2]);
        const erc20LusdWithdrawn = lusdLinearPoolTokensBefore.balances[0].sub(lusdLinearPoolTokensAfter.balances[0]);
        const erc4626LusdWithdrawn = lusdLinearPoolTokensBefore.balances[1].sub(lusdLinearPoolTokensAfter.balances[1]);
        const erc20FeiWithdrawn = feiLinearPoolTokensBefore.balances[0].sub(feiLinearPoolTokensAfter.balances[0]);
        const erc4626FeiWithdrawn = feiLinearPoolTokensBefore.balances[2].sub(feiLinearPoolTokensAfter.balances[2]);

        expect(tokensReceived).to.be.equal(withdrawAmount);
        await expectApproxAbs(erc20DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626DaiWithdrawn, '0', '0');
        await expectApproxAbs(erc20LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc4626LusdWithdrawn, '0', '0');
        await expectApproxAbs(erc20FeiWithdrawn, '0', '0');
        await expectApproxAbs(erc4626FeiWithdrawn, withdrawAmount, `100${e18}`);
      });
    });
  });

  // Util mock function to put [DAI, LUSD, FEI] tokens on the PCVDeposit
  async function seedDepositWith(dai: BigNumberish, lusd: BigNumberish, fei: BigNumberish) {
    if (dai) {
      const DAI_HOLDER = '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7';
      await forceEth(DAI_HOLDER);
      await contracts.dai.connect(await getImpersonatedSigner(DAI_HOLDER)).transfer(deposit.address, dai);
    }
    if (lusd) {
      const LUSD_HOLDER = '0x66017d22b0f8556afdd19fc67041899eb65a21bb';
      await forceEth(LUSD_HOLDER);
      await contracts.lusd.connect(await getImpersonatedSigner(LUSD_HOLDER)).transfer(deposit.address, lusd);
    }
    if (fei) {
      const FEI_HOLDER = '0x9928e4046d7c6513326ccea028cd3e7a91c7590a';
      await forceEth(FEI_HOLDER);
      await contracts.fei.connect(await getImpersonatedSigner(FEI_HOLDER)).transfer(deposit.address, fei);
    }
  }
});
