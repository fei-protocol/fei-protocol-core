import { getCore, getAddresses, expectRevert, expectEvent } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { Core, Fei, NamedStaticPCVDepositWrapper } from '@custom-types/contracts';
const toBN = ethers.BigNumber.from;

describe('NamedStaticPCVDepositWrapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};

  let underlyingTokenAmount: string;
  let governorAddress: string;
  let newDepositName: string;
  let balance: string;
  let fei: string;
  let core: Core;
  let deposit: NamedStaticPCVDepositWrapper;

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.governorAddress
    ];

    for (const address of impersonatedAddresses) {

      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());

    newDepositName = 'Visor Finance Deposit';
    balance = '2000';
    fei = '1000';
    underlyingTokenAmount = '100000';
    core = await getCore();
    deposit = await (
      await ethers.getContractFactory('NamedStaticPCVDepositWrapper')
    ).deploy(core.address, [
      {
        depositName: newDepositName,
        usdAmount: balance, /// USD equivalent in this deposit, not including FEI value
        feiAmount: fei, /// amount of FEI in this deposit
        underlyingTokenAmount: underlyingTokenAmount, /// amount of underlying token in this deposit
        underlying: await core.fei()
      }
    ]);
  });

  describe('init', function () {
    it('reported in USD', async function () {
      expect(await deposit.balanceReportedIn()).to.be.equal('0x1111111111111111111111111111111111111111');
    });

    it('depositName', async function () {
      const { depositName } = await deposit.pcvDeposits(0);
      expect(depositName).to.be.equal(newDepositName);
    });

    it('usdAmount', async function () {
      const { usdAmount } = await deposit.pcvDeposits(0);
      expect(usdAmount).to.be.equal(balance);
    });

    it('underlyingTokenAmount', async function () {
      const { underlyingTokenAmount } = await deposit.pcvDeposits(0);
      expect(underlyingTokenAmount).to.be.equal(underlyingTokenAmount);
    });

    it('underlying', async function () {
      const { underlying } = await deposit.pcvDeposits(0);
      expect(underlying).to.be.equal(await core.fei());
    });

    it('feiAmount', async function () {
      const { feiAmount } = await deposit.pcvDeposits(0);
      expect(feiAmount).to.be.equal(fei);
    });

    it('numDeposits', async function () {
      expect(await deposit.numDeposits()).to.be.equal(1);
    });

    it('getAllUnderlying', async function () {
      const allUnderlying = await deposit.getAllUnderlying();
      expect(allUnderlying.length).to.be.equal(1);
      expect(allUnderlying[0]).to.be.equal(await core.fei());
    });

    it('returns stored values', async function () {
      expect(await deposit.balance()).to.be.equal(balance);
      expect(await deposit.feiReportBalance()).to.be.equal(fei);

      const resistantBalances = await deposit.resistantBalanceAndFei();

      expect(resistantBalances[0]).to.be.equal(balance);
      expect(resistantBalances[1]).to.be.equal(fei);
    });
  });

  describe('addDeposit', function () {
    it('add new deposit', async function () {
      const startingBalance = await deposit.balance();
      const startingFeiBalance = await deposit.feiReportBalance();

      expectEvent(
        await deposit.connect(impersonatedSigners[governorAddress]).addDeposit({
          usdAmount: balance,
          feiAmount: fei,
          underlyingTokenAmount: 1000,
          depositName: 'Visor Finance USDC/FEI Deposit',
          underlying: await core.fei()
        }),
        deposit,
        'BalanceUpdate',
        [startingBalance, startingBalance.add(balance), startingFeiBalance, startingFeiBalance.add(fei)]
      );

      const endingBalance = await deposit.balance();
      const endingFeiBalance = await deposit.feiReportBalance();

      expect(endingBalance.sub(startingBalance)).to.be.equal(balance);
      expect(endingFeiBalance.sub(startingFeiBalance)).to.be.equal(fei);
      expect(await deposit.numDeposits()).to.be.equal(2);
    });

    it('add new deposit fails when there is 0 fei and usd amount', async function () {
      await expectRevert(
        deposit.connect(impersonatedSigners[governorAddress]).addDeposit({
          usdAmount: 0,
          feiAmount: 0,
          underlyingTokenAmount: 1000,
          depositName: 'Visor Finance USDC/FEI Deposit',
          underlying: await core.fei()
        }),
        'NamedStaticPCVDepositWrapper: must supply either fei or usd amount'
      );
    });

    it('addDeposit non-governor-admin reverts', async function () {
      await expectRevert(
        deposit.addDeposit({
          usdAmount: 0,
          feiAmount: 0,
          underlyingTokenAmount: 1000,
          depositName: 'Visor Finance USDC/FEI Deposit',
          underlying: await core.fei()
        }),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('bulkAddDeposits', function () {
    it('bulk adds 2 new deposits', async function () {
      const startingBalance = await deposit.balance();
      const startingFeiBalance = await deposit.feiReportBalance();
      const startingNumDeposits = await deposit.numDeposits();

      expectEvent(
        await deposit.connect(impersonatedSigners[governorAddress]).bulkAddDeposits([
          {
            usdAmount: balance,
            feiAmount: fei,
            underlyingTokenAmount: 1000,
            depositName: 'Visor Finance USDC/FEI Deposit',
            underlying: await core.fei()
          },
          {
            usdAmount: balance,
            feiAmount: fei,
            underlyingTokenAmount: 1000,
            depositName: 'Visor Finance USDC/FEI Deposit',
            underlying: await core.fei()
          }
        ]),
        deposit,
        'BalanceUpdate',
        [startingBalance, startingBalance.add(balance), startingFeiBalance, startingFeiBalance.add(fei)]
      );

      const endingBalance = await deposit.balance();
      const endingFeiBalance = await deposit.feiReportBalance();
      const endingNumDeposits = await deposit.numDeposits();

      expect(endingBalance.sub(startingBalance)).to.be.equal(toBN(balance).mul(2));
      expect(endingFeiBalance.sub(startingFeiBalance)).to.be.equal(toBN(fei).mul(2));
      expect(endingNumDeposits.sub(startingNumDeposits)).to.be.equal(2);
    });

    it('add new deposit fails when there is 0 fei and usd amount', async function () {
      await expectRevert(
        deposit.connect(impersonatedSigners[governorAddress]).bulkAddDeposits([
          {
            usdAmount: 0,
            feiAmount: 0,
            underlyingTokenAmount: 1000,
            depositName: 'Visor Finance USDC/FEI Deposit',
            underlying: await core.fei()
          }
        ]),
        'NamedStaticPCVDepositWrapper: must supply either fei or usd amount'
      );
    });

    it('addDeposit non-governor-admin reverts', async function () {
      await expectRevert(
        deposit.bulkAddDeposits([
          {
            usdAmount: 0,
            feiAmount: 0,
            underlyingTokenAmount: 1000,
            depositName: 'Visor Finance USDC/FEI Deposit',
            underlying: await core.fei()
          }
        ]),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('editDeposit', function () {
    it('edits existing deposit', async function () {
      const startingBalance = await deposit.balance();
      const startingFeiBalance = await deposit.feiReportBalance();
      const newUnderlyingAmt = 100_000;
      fei = '200';
      balance = '100';

      expectEvent(
        await deposit
          .connect(impersonatedSigners[governorAddress])
          .editDeposit(0, balance, fei, newUnderlyingAmt, 'Visor Finance USDC/FEI Deposit', await core.fei()),
        deposit,
        'BalanceUpdate',
        [startingBalance, balance, startingFeiBalance, fei]
      );

      const endingBalance = await deposit.balance();
      const endingFeiBalance = await deposit.feiReportBalance();
      const { underlyingTokenAmount } = await deposit.pcvDeposits(0);

      expect(endingBalance).to.be.equal(balance);
      expect(endingFeiBalance).to.be.equal(fei);
      expect(await deposit.numDeposits()).to.be.equal(1);
      expect(underlyingTokenAmount).to.be.equal(newUnderlyingAmt);
    });

    it('editDeposit non-governor-admin reverts', async function () {
      await expectRevert(
        deposit.editDeposit(0, balance, fei, 10, 'DPI UniV2 LP Token', await core.fei()),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('removeDeposit', function () {
    it('remove existing deposit', async function () {
      const startingNumDeposits = await deposit.numDeposits();
      expectEvent(
        await deposit.connect(impersonatedSigners[governorAddress]).removeDeposit(0),
        deposit,
        'DepositRemoved',
        [0]
      );

      const endingBalance = await deposit.balance();
      const endingFeiBalance = await deposit.feiReportBalance();
      const { underlyingTokenAmount } = await deposit.pcvDeposits(0);

      expect(underlyingTokenAmount).to.be.equal(0);
      expect(endingBalance).to.be.equal(0);
      expect(endingFeiBalance).to.be.equal(0);
      expect(await deposit.numDeposits()).to.be.equal(startingNumDeposits);
    });

    it('editDeposit non-governor-admin reverts', async function () {
      await expectRevert(deposit.removeDeposit(0), 'CoreRef: Caller is not a governor or contract admin');
    });
  });
});
