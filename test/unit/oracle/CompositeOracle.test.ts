import { expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

describe('CompositeOracle', function () {
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());
    this.core = await getCore();

    this.oracleA = await (await ethers.getContractFactory('MockOracle')).deploy(400);
    this.oracleB = await (await ethers.getContractFactory('MockOracle')).deploy(2);

    this.oracle = await (
      await ethers.getContractFactory('CompositeOracle')
    ).deploy(this.core.address, this.oracleA.address, this.oracleB.address);
  });

  describe('Init', function () {
    it('oracleA', async function () {
      expect(await this.oracle.oracleA()).to.be.equal(this.oracleA.address);
    });

    it('oracleB', async function () {
      expect(await this.oracle.oracleB()).to.be.equal(this.oracleB.address);
    });

    it('paused', async function () {
      expect(await this.oracle.paused()).to.be.equal(false);
    });
  });

  describe('Is Outdated', function () {
    describe('Both up to date', function () {
      it('returns false', async function () {
        const result = await this.oracle.isOutdated();
        expect(result).to.be.equal(false);
      });
    });

    describe('One outdated', function () {
      describe('Oracle A', function () {
        beforeEach(async function () {
          await this.oracleA.setOutdated(true);
        });

        it('returns true', async function () {
          const result = await this.oracle.isOutdated();
          expect(result).to.be.equal(true);
        });
      });

      describe('Oracle B', function () {
        beforeEach(async function () {
          await this.oracleB.setOutdated(true);
        });

        it('returns true', async function () {
          const result = await this.oracle.isOutdated();
          expect(result).to.be.equal(true);
        });
      });
    });
  });
  describe('Read', function () {
    describe('Both Valid', function () {
      describe('Paused', function () {
        beforeEach(async function () {
          await this.oracle.connect(impersonatedSigners[governorAddress]).pause({});
        });

        it('returns invalid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });

      describe('Unpaused', function () {
        it('returns valid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(true);
        });
      });
    });

    describe('One Invalid', function () {
      describe('Oracle A', function () {
        beforeEach(async function () {
          await this.oracleA.setValid(false);
        });

        it('returns invalid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });

      describe('Oracle B', function () {
        beforeEach(async function () {
          await this.oracleB.setValid(false);
        });

        it('returns invalid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('800000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });
    });
  });
  describe('Update', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.oracle.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(this.oracle.update(), 'Pausable: paused');
      });
    });

    describe('Unpaused', function () {
      beforeEach(async function () {
        await this.oracle.update();
      });

      it('updates both', async function () {
        expect(await this.oracleA.updated()).to.be.equal(true);
        expect(await this.oracleB.updated()).to.be.equal(true);
      });
    });
  });
});
