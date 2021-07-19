import { expect, web3 } from 'hardhat'
import { time } from '@openzeppelin/test-helpers';
import { TestEndtoEndCoordinator } from './setup';
import { syncPool } from '../scripts/utils/syncPool'
import { MainnetContractAddresses, MainnetContracts } from './setup/types';
import { getPeg, getPrice } from './setup/utils'
import { expectApprox } from '../test/helpers'
import proposals from '../proposals/config.json'

const { toBN } = web3.utils;

describe('e2e', function () {
  let contracts: MainnetContracts;
  let contractAddresses: MainnetContractAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;

  const tenPow18 = toBN('1000000000000000000');

  before(async function () {
    // Setup test environment and get contracts
    const version = 1
    deployAddress = (await web3.eth.getAccounts())[0];
    
    const config = {
      logging: false,
      deployAddress: deployAddress,
      version: version,
    }
    e2eCoord = new TestEndtoEndCoordinator(config, proposals);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment())

    await contracts.uniswapPCVDeposit.deposit()
  })

  describe('BondingCurve', async () => {
    beforeEach(async function () {
      // Seed bonding curve with eth and update oracle
      const bondingCurve = contracts.bondingCurve
      const ethSeedAmount = tenPow18.mul(toBN(1000))
      await bondingCurve.purchase(deployAddress, ethSeedAmount, {value: ethSeedAmount})
      await bondingCurve.updateOracle();
    })

    it('should allow purchase of Fei through bonding curve', async function () {
      const bondingCurve = contracts.bondingCurve;
      const fei = contracts.fei;
      const feiBalanceBefore = await fei.balanceOf(deployAddress);

      const ethAmount = tenPow18; // 1 ETH
      const oraclePrice = toBN((await bondingCurve.readOracle())[0]);
      const currentPrice = toBN((await bondingCurve.getCurrentPrice())[0]);

      // expected = amountIn * oracle * price (Note: there is an edge case when crossing scale where this is not true)
      const expected = ethAmount.mul(oraclePrice).mul(currentPrice).div(tenPow18).div(tenPow18);

      await bondingCurve.purchase(deployAddress, ethAmount, {value: ethAmount});
      
      const feiBalanceAfter = await fei.balanceOf(deployAddress);
      const expectedFinalBalance = feiBalanceBefore.add(expected)
      expect(feiBalanceAfter).to.be.bignumber.equal(expectedFinalBalance);
    })

    it('should transfer allocation from bonding curve to the reserve stabiliser', async function () {
      const bondingCurve = contracts.bondingCurve;
      const uniswapPCVDeposit = contracts.uniswapPCVDeposit

      const pcvDepositBefore = await uniswapPCVDeposit.balance()

      const curveEthBalanceBefore = toBN(await web3.eth.getBalance(bondingCurve.address));
      expect(curveEthBalanceBefore).to.be.bignumber.greaterThan(toBN(0))

      const fei = contracts.fei;
      const callerFeiBalanceBefore = await fei.balanceOf(deployAddress)
      const pcvAllocations = await bondingCurve.getAllocation()
      expect(pcvAllocations[0].length).to.be.equal(1)

      const durationWindow = await bondingCurve.duration()

      // pass the duration window, so Fei incentive will be sent
      await time.increase(durationWindow);

      const allocatedEth = await bondingCurve.balance()
      await bondingCurve.allocate()
    
      const curveEthBalanceAfter = toBN(await web3.eth.getBalance(bondingCurve.address));
      expect(curveEthBalanceAfter).to.be.bignumber.equal(curveEthBalanceBefore.sub(allocatedEth))
      
      const pcvDepositAfter = await uniswapPCVDeposit.balance()
      await expectApprox(pcvDepositAfter, pcvDepositBefore.add(allocatedEth), '100')

      const feiIncentive = await bondingCurve.incentiveAmount();
      const callerFeiBalanceAfter = await fei.balanceOf(deployAddress);
      expect(callerFeiBalanceAfter).to.be.bignumber.equal(callerFeiBalanceBefore.add(feiIncentive))
    })
  });

  it('should be able to redeem Fei from stabiliser', async function () {
    const fei = contracts.fei;
    const reserveStabilizer = contracts.ethReserveStabilizer;
    await web3.eth.sendTransaction({from: deployAddress, to: reserveStabilizer.address, value: tenPow18.mul(toBN(200))});

    const contractEthBalanceBefore = toBN(await web3.eth.getBalance(reserveStabilizer.address))
    const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress))

    const feiTokensExchange = toBN(40000000000000)
    await reserveStabilizer.updateOracle();
    const expectedAmountOut = await reserveStabilizer.getAmountOut(feiTokensExchange)
    await reserveStabilizer.exchangeFei(feiTokensExchange)

    const contractEthBalanceAfter = toBN(await web3.eth.getBalance(reserveStabilizer.address))
    const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress))
  
    expect(contractEthBalanceBefore.sub(toBN(expectedAmountOut))).to.be.bignumber.equal(contractEthBalanceAfter)
    expect(userFeiBalanceAfter).to.be.bignumber.equal(userFeiBalanceBefore.sub(feiTokensExchange))
  })

  it('drip controller can withdraw from PCV deposit to stabiliser', async function () {
    const ethReserveStabilizer = contracts.ethReserveStabilizer
    const uniswapPCVDeposit = contracts.uniswapPCVDeposit
    const pcvDripper = contracts.pcvDripController
    const fei = contracts.fei

    const userFeiBalanceBefore = await fei.balanceOf(deployAddress)
    const pcvDepositBefore = await uniswapPCVDeposit.balance()
    const stabilizerBalanceBefore = await ethReserveStabilizer.balance()

    // Trigger drip
    await time.increase(await pcvDripper.remainingTime());
    await pcvDripper.drip({from: deployAddress});

    // Check PCV deposit loses dripAmount ETH and stabilizer gets dripAmount ETH
    const dripAmount = toBN(await pcvDripper.dripAmount())
    const pcvDepositAfter = toBN(await uniswapPCVDeposit.balance())
    await expectApprox(pcvDepositAfter, pcvDepositBefore.sub(dripAmount), '100')

    const stabilizerBalanceAfter = toBN(await ethReserveStabilizer.balance())
    await expectApprox(stabilizerBalanceAfter, stabilizerBalanceBefore.add(dripAmount), '100')

    const feiIncentive = await pcvDripper.incentiveAmount()

    const userFeiBalanceAfter = await fei.balanceOf(deployAddress)
    expect(userFeiBalanceAfter).to.bignumber.equal(userFeiBalanceBefore.add(feiIncentive))
  })

  describe('Reweights', async () => {
    it('should perform reweight above peg correctly',  async function () {
      // Sync pool to 3% above peg
      await syncPool(
        toBN('9700'),
        {
          feiAddress: contractAddresses.feiAddress,
          ethUniswapPCVDepositAddress: contractAddresses.uniswapPCVDepositAddress,
          ethPairAddress: contractAddresses.feiEthPairAddress, // this is fei eth pair
        },
        deployAddress,
      );
  
      const controller = contracts.uniswapPCVController
      await time.increase(await controller.remainingTime());
  
      const eligible = await controller.reweightEligible();
      expect(eligible).to.be.equal(true)
  
      await controller.reweight();
  
      // Check that the reweight was successful
      // asset pool ratio = oracle ratio
      const peg = await getPeg(controller)
      const currentPrice = await getPrice(controller);
      expect(peg).to.be.bignumber.equal(currentPrice)
  
      // ensure timer reset
      const timeReset = !(await controller.isTimeEnded());
      expect(timeReset).to.equal(true)
    })
  
    it('should perform reweight below peg correctly',  async function () {
      // Sync pool to 3% below peg
      await syncPool(
        toBN('10300'),
        {
          feiAddress: contractAddresses.feiAddress,
          ethUniswapPCVDepositAddress: contractAddresses.uniswapPCVDepositAddress,
          ethPairAddress: contractAddresses.feiEthPairAddress, // this is fei eth pair
        },
        deployAddress,
      );
  
      const controller = contracts.uniswapPCVController
      await time.increase(await controller.remainingTime());
  
      const eligible = await controller.reweightEligible();
      expect(eligible).to.be.equal(true)
  
      await controller.reweight();
  
      // Check that the reweight was successful
      // asset pool ratio = oracle ratio
      const peg = await getPeg(controller)
      const currentPrice = await getPrice(controller);
      expect(peg).to.be.bignumber.equal(currentPrice)
  
      // ensure timer reset
      const timeReset = !(await controller.isTimeEnded());
      expect(timeReset).to.equal(true)
    })
  })

  describe('Compound', async () => {
    it('should be able to deposit and withdraw ERC20 tokens',  async function () {
      const erc20CompoundPCVDeposit = contracts.rariPool8FeiPCVDeposit;
      const fei = contracts.fei;
      const amount = '100000000000000000000000000'
      await fei.mint(erc20CompoundPCVDeposit.address, amount);

      const balanceBefore = await erc20CompoundPCVDeposit.balance();

      await erc20CompoundPCVDeposit.deposit();
      expect((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.greaterThan(amount);

      await erc20CompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await erc20CompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.lessThan(amount);
    })
  
    it('should be able to deposit and withdraw ETH',  async function () {
      const ethCompoundPCVDeposit = contracts.rariPool8EthPCVDeposit;
      const amount = tenPow18.mul(toBN(200));
      await web3.eth.sendTransaction({from: deployAddress, to: ethCompoundPCVDeposit.address, value: amount });

      const balanceBefore = await ethCompoundPCVDeposit.balance();

      await ethCompoundPCVDeposit.deposit();
      expect((await ethCompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.greaterThan(amount);

      await ethCompoundPCVDeposit.withdraw(deployAddress, amount);
      expect((await ethCompoundPCVDeposit.balance()).sub(balanceBefore)).to.be.bignumber.lessThan(amount);
    })
  })
  describe('Access control', async () => {
    before(async () => {
      // Revoke deploy address permissions, so that does not erroneously
      // contribute to num governor roles etc
      await e2eCoord.revokeDeployAddressPermission()
    })

    it('should have granted correct role cardinality', async function () {
      const core = contracts.core
      const accessRights = e2eCoord.getAccessControlMapping()

      const minterId = await core.MINTER_ROLE()
      const numMinterRoles = await core.getRoleMemberCount(minterId)
      expect(numMinterRoles.toNumber()).to.be.equal(accessRights.minter.length)

      const burnerId = await core.BURNER_ROLE()
      const numBurnerRoles = await core.getRoleMemberCount(burnerId)
      expect(numBurnerRoles.toNumber()).to.be.equal(accessRights.burner.length)

      const pcvControllerId = await core.PCV_CONTROLLER_ROLE()
      const numPCVControllerRoles = await core.getRoleMemberCount(pcvControllerId)
      expect(numPCVControllerRoles.toNumber()).to.be.equal(accessRights.pcvController.length)

      const governorId = await core.GOVERN_ROLE()
      const numGovernorRoles = await core.getRoleMemberCount(governorId)
      expect(numGovernorRoles.toNumber()).to.be.equal(accessRights.governor.length)
      
      const guardianId = await core.GUARDIAN_ROLE()
      const numGuaridanRoles = await core.getRoleMemberCount(guardianId)
      expect(numGuaridanRoles.toNumber()).to.be.equal(accessRights.guardian.length)
    })

    it('should have granted contracts correct roles', async function () {
      const core = contracts.core;
      const accessControl = e2eCoord.getAccessControlMapping()

      for (let i = 0; i < accessControl.minter.length; i += 1) {
        const contractAddress = accessControl.minter[i]
        const isMinter = await core.isMinter(contractAddress)
        expect(isMinter).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.burner.length; i += 1) {
        const contractAddress = accessControl.burner[i]
        const isBurner = await core.isBurner(contractAddress)
        expect(isBurner).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.pcvController.length; i += 1) {
        const contractAddress = accessControl.pcvController[i]
        const isPCVController = await core.isPCVController(contractAddress)
        expect(isPCVController).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.guardian.length; i += 1) {
      const contractAddress = accessControl.guardian[i]
        const isGuardian = await core.isGuardian(contractAddress)
        expect(isGuardian).to.be.equal(true)
      }

      for (let i = 0; i < accessControl.governor.length; i += 1) {
        const contractAddress = accessControl.governor[i]
        const isGovernor = await core.isGovernor(contractAddress)
        expect(isGovernor).to.be.equal(true)
      }

      const tribe = contracts.tribe
      const tribeMinter = await tribe.minter()
      expect(tribeMinter).to.equal(contractAddresses.tribeReserveStabilizerAddress)
    })
  })
});
