const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const IDO = contract.fromArtifact('IDO');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const Tribe = contract.fromArtifact('Tribe');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockRouter = contract.fromArtifact('MockRouter');

describe('IDO', function () {
  const [ userAddress, governorAddress, minterAddress, beneficiaryAddress, genesisGroup, beneficiaryAddress2 ] = accounts;
  const LIQUIDITY_INCREMENT = 10000; // amount of liquidity created by mock for each deposit

  beforeEach(async function () {
    this.core = await Core.new({from: governorAddress});
    await this.core.init({from: governorAddress});

    await this.core.setGenesisGroup(genesisGroup, {from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());

    this.pair = await MockPair.new(this.fei.address, this.tribe.address);
    this.router = await MockRouter.new(this.pair.address);

    this.window = new BN(4 * 365 * 24 * 60 * 60);
    this.ido = await IDO.new(this.core.address, beneficiaryAddress, this.window, this.pair.address, this.router.address);
    await this.core.grantMinter(this.ido.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.core.allocateTribe(this.ido.address, 100000, {from: governorAddress});
  });

  describe('Swap', function() {
    describe('Not Genesis Group', function() {
      it('reverts', async function() {
        await expectRevert(this.ido.swapFei('5000', {from: userAddress}), "CoreRef: Caller is not GenesisGroup");
      });
    });

    describe('From Genesis Group', function() {
      beforeEach(async function() {
        await this.pair.setReserves('500000', '100000');
        await this.fei.mint(genesisGroup, '50000', {from: minterAddress});
      });

      describe('Not approved', function() {
        it('reverts', async function() {
          await expectRevert(this.ido.swapFei('50000', {from: genesisGroup}), "ERC20: transfer amount exceeds allowance");
        });
      });
      describe('Approved', function() {
        beforeEach(async function() {
          await this.fei.approve(this.ido.address, '50000', {from: genesisGroup});
          await this.ido.swapFei('50000', {from: genesisGroup});
        });

        it('genesis group balances', async function() {
          expect(await this.fei.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(0));
        });

        it('updates pair balances', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(50000));
        });
      });
    });
  });
  
  describe('Bad Duration', function() {
    it('reverts', async function() {
      await expectRevert(IDO.new(this.core.address, beneficiaryAddress, 0, this.pair.address, this.router.address), "LinearTokenTimelock: duration is 0");
    });
  });

  describe('Deploy', function() {
    describe('Not Genesis Group', function() {
      it('reverts', async function() {
        await expectRevert(this.ido.deploy(['5000000000000000000'], {from: userAddress}), "CoreRef: Caller is not GenesisGroup");
      });
    });

    describe('From Genesis Group', function() {
      beforeEach(async function() {
        expectEvent(
          await this.ido.deploy(['5000000000000000000'], {from: genesisGroup}),
          'Deploy',
          {
            _amountFei: "500000",
            _amountTribe: "100000"
          }
        );
      });

      it('updates ido balances', async function() {
        expect(await this.fei.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(0));
        expect(await this.tribe.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(0));
        expect(await this.pair.balanceOf(this.ido.address)).to.be.bignumber.equal(new BN(10000));
      });

      it('updates pair balances', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(500000));
        expect(await this.tribe.balanceOf(this.pair.address)).to.be.bignumber.equal(new BN(100000));
      });

      it('updates total token', async function() {
        expect(await this.ido.totalToken()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT));
      });

      describe('After window', function() {
        beforeEach(async function() {
          await time.increase(this.window.mul(new BN('2')));
        });

        it('all available for release', async function() {
          expect(await this.ido.availableForRelease()).to.be.bignumber.equal(new BN(LIQUIDITY_INCREMENT));
        });
      });
    });

    describe('Beneficiary', function() {
      it('change succeeds', async function() {
        await this.ido.setPendingBeneficiary(beneficiaryAddress2, {from: beneficiaryAddress});
        expect(await this.ido.pendingBeneficiary()).to.be.equal(beneficiaryAddress2);
        expect(await this.ido.beneficiary()).to.be.equal(beneficiaryAddress);
        await this.ido.acceptBeneficiary({from: beneficiaryAddress2});
        expect(await this.ido.beneficiary()).to.be.equal(beneficiaryAddress2);
      });

      it('unauthorized set fails', async function() {
        await expectRevert(this.ido.setPendingBeneficiary(beneficiaryAddress2, {from: beneficiaryAddress2}), "LinearTokenTimelock: Caller is not a beneficiary");
      });

      it('unauthorized accept fails', async function() {
        await this.ido.setPendingBeneficiary(beneficiaryAddress2, {from: beneficiaryAddress});
        expect(await this.ido.pendingBeneficiary()).to.be.equal(beneficiaryAddress2);
        expect(await this.ido.beneficiary()).to.be.equal(beneficiaryAddress);
        await expectRevert(this.ido.acceptBeneficiary({from: userAddress}), "LinearTokenTimelock: Caller is not pending beneficiary");
      });
    });
  });
});