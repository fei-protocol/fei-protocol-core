import { ZERO_ADDRESS, getCore, getAddresses, expectRevert, expectUnspecifiedRevert } from '../../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const e18 = '000000000000000000';

describe('CollateralizationOracle', function () {
  let userAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());
    this.core = await getCore();
    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(userAddress);
    this.fei = await ethers.getContractAt('IFei', await this.core.fei());

    // fake stablecoin
    this.oracle1 = await (await ethers.getContractFactory('MockOracleCoreRef')).deploy(this.core.address, 1);
    this.token1 = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.deposit1 = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      this.core.address,
      this.token1.address,
      `2000${e18}`, // balance
      `1000${e18}` // protocol FEI
    );
    await this.fei.mint(this.deposit1.address, `1000${e18}`);
    // fake ETH
    this.oracle2 = await (await ethers.getContractFactory('MockOracleCoreRef')).deploy(this.core.address, 3000);
    this.token2 = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.deposit2 = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      this.core.address,
      this.token2.address,
      `1${e18}`, // balance
      `1000${e18}` // protocol FEI
    );
    await this.fei.mint(this.deposit2.address, `1000${e18}`);

    // user circulating fei
    await this.fei.mint(userAddress, `2500${e18}`);

    // PCV overview :
    //   PCVDepost 1 : stablecoin
    //     - 2000$ PCV
    //     - 1000 protocol FEI
    //   PCVDeposit 2 : some token (e.g. ETH)
    //     - 3000$ PCV
    //     - 1000 protocol FEI
    //   Circulating :
    //     - 2500 FEI
    // create oracle
    this.oracle = await (
      await ethers.getContractFactory('CollateralizationOracle')
    ).deploy(this.core.address, [], [], []);
  });

  describe('getters', function () {
    beforeEach(async function () {
      this.oracle = await (
        await ethers.getContractFactory('CollateralizationOracle')
      ).deploy(
        this.core.address,
        [this.deposit1.address, this.deposit2.address],
        [this.token1.address, this.token2.address],
        [this.oracle1.address, this.oracle2.address]
      );
    });

    it('tokenToOracle(address) => address', async function () {
      expect(await this.oracle.tokenToOracle(this.token1.address)).to.be.equal(this.oracle1.address);
    });
    it('depositToToken(address) => address', async function () {
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(this.token1.address);
    });
    it('isTokenInPcv(address) => bool', async function () {
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
      expect(await this.oracle.isTokenInPcv(ZERO_ADDRESS)).to.be.equal(false);
    });
    it('getTokensInPcv() => address[]', async function () {
      const tokens = await this.oracle.getTokensInPcv();
      expect(tokens.length).to.be.equal(2);
      expect(tokens[0]).to.be.equal(this.token1.address);
      expect(tokens[1]).to.be.equal(this.token2.address);
    });
    it('getTokenInPcv(uint256) => address', async function () {
      expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
      expect(await this.oracle.getTokenInPcv('1')).to.be.equal(this.token2.address);
    });
    it('getDepositsForToken(address) => address[]', async function () {
      const deposits = await this.oracle.getDepositsForToken(this.token1.address);
      expect(deposits.length).to.be.equal(1);
      expect(deposits[0]).to.be.equal(this.deposit1.address);
    });
    it('getDepositForToken(address, uint256) => address', async function () {
      expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1.address);
    });
  });

  describe('Batched setters', function () {
    describe('Set Oracles', function () {
      beforeEach(async function () {
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracles([this.token1.address, this.token2.address], [this.oracle1.address, this.oracle2.address]);
      });

      it('tokenToOracle(address) => address', async function () {
        expect(await this.oracle.tokenToOracle(this.token1.address)).to.be.equal(this.oracle1.address);
        expect(await this.oracle.tokenToOracle(this.token2.address)).to.be.equal(this.oracle2.address);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          this.oracle
            .connect(impersonatedSigners[userAddress])
            .setOracles([this.token1.address, this.token2.address], [this.oracle1.address, this.oracle2.address]),
          'CoreRef: Caller is not a governor'
        );
      });

      describe('Add Deposits', function () {
        beforeEach(async function () {
          await this.oracle
            .connect(impersonatedSigners[governorAddress])
            .addDeposits([this.deposit1.address, this.deposit2.address]);
        });

        it('isTokenInPcv(address) => bool', async function () {
          expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
          expect(await this.oracle.isTokenInPcv(ZERO_ADDRESS)).to.be.equal(false);
        });

        it('getTokensInPcv() => address[]', async function () {
          const tokens = await this.oracle.getTokensInPcv();
          expect(tokens.length).to.be.equal(2);
          expect(tokens[0]).to.be.equal(this.token1.address);
          expect(tokens[1]).to.be.equal(this.token2.address);
        });

        it('getTokenInPcv(uint256) => address', async function () {
          expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
          expect(await this.oracle.getTokenInPcv('1')).to.be.equal(this.token2.address);
        });

        it('depositToToken(address) => address', async function () {
          expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(this.token1.address);
        });

        it('getDepositsForToken(address) => address[]', async function () {
          const deposits = await this.oracle.getDepositsForToken(this.token1.address);
          expect(deposits.length).to.be.equal(1);
          expect(deposits[0]).to.be.equal(this.deposit1.address);
        });

        it('getDepositForToken(address, uint256) => address', async function () {
          expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1.address);
        });

        it('non-governor reverts', async function () {
          await expectRevert(
            this.oracle
              .connect(impersonatedSigners[userAddress])
              .addDeposits([this.deposit1.address, this.deposit2.address]),
            'CoreRef: Caller is not a governor'
          );
        });

        describe('Remove Deposits', function () {
          beforeEach(async function () {
            await this.oracle
              .connect(impersonatedSigners[governorAddress])
              .removeDeposits([this.deposit1.address, this.deposit2.address]);
          });

          it('depositToToken(address) => address', async function () {
            expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(ZERO_ADDRESS);
          });

          it('getDepositsForToken(address) => address[]', async function () {
            const deposits = await this.oracle.getDepositsForToken(this.token1.address);
            expect(deposits.length).to.be.equal(0);
          });

          it('non-governor reverts', async function () {
            await expectRevert(
              this.oracle
                .connect(impersonatedSigners[userAddress])
                .removeDeposits([this.deposit1.address, this.deposit2.address]),
              'CoreRef: Caller is not a governor'
            );
          });
        });
      });
    });
  });

  describe('addDeposit()', function () {
    it('should emit DepositAdd', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await expect(await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address))
        .to.emit(this.oracle, 'DepositAdd')
        .withArgs(governorAddress, this.deposit1.address, this.token1.address);
    });
    it('should update maps & array properties', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
      expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1.address);
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(this.token1.address);
      expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
    });
    it('should revert if not governor', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await expectRevert(
        this.oracle.connect(impersonatedSigners[userAddress]).addDeposit(this.deposit1.address),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if deposit is duplicate', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
      await expectRevert(
        this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address),
        'CollateralizationOracle: deposit duplicate'
      );
    });
    it('should revert if deposit has no oracle', async function () {
      await expectRevert(
        this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address),
        'CollateralizationOracle: no oracle'
      );
    });
  });

  describe('removeDeposit()', function () {
    it('should emit DepositRemove', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
      await expect(await this.oracle.connect(impersonatedSigners[governorAddress]).removeDeposit(this.deposit1.address))
        .to.emit(this.oracle, 'DepositRemove')
        .withArgs(governorAddress, this.deposit1.address);
    });
    it('should update maps & array properties', async function () {
      // initial situation : 1 deposit
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
      expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1.address);
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(this.token1.address);
      expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
      // remove deposit
      await this.oracle.connect(impersonatedSigners[governorAddress]).removeDeposit(this.deposit1.address);
      // after remove
      await expectUnspecifiedRevert(this.oracle.getDepositForToken(this.token1.address, '0'));
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(ZERO_ADDRESS);
      await expectUnspecifiedRevert(this.oracle.getTokenInPcv('0'));
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(false);
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracle.addDeposit(this.deposit1.address, { from: userAddress }),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if deposit is not found', async function () {
      await expectRevert(
        this.oracle.connect(impersonatedSigners[governorAddress]).removeDeposit(this.deposit2.address),
        'CollateralizationOracle: deposit not found'
      );
    });
  });

  describe('swapDeposit()', function () {
    beforeEach(async function () {
      this.deposit1bis = await (
        await ethers.getContractFactory('MockPCVDepositV2')
      ).deploy(
        this.core.address,
        this.token1.address,
        `2000${e18}`, // balance
        `1000${e18}` // protocol FEI
      );
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
    });
    it('should emit DepositRemove', async function () {
      await expect(
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .swapDeposit(this.deposit1.address, this.deposit1bis.address)
      )
        .to.emit(this.oracle, 'DepositRemove')
        .withArgs(governorAddress, this.deposit1.address);
    });
    it('should emit DepositAdd', async function () {
      await expect(
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .swapDeposit(this.deposit1.address, this.deposit1bis.address)
      )
        .to.emit(this.oracle, 'DepositAdd')
        .withArgs(governorAddress, this.deposit1bis.address, this.token1.address);
    });
    it('should update maps & array properties', async function () {
      // initial situation : 1 deposit
      expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1.address);
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(this.token1.address);
      expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
      // swap deposit
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .swapDeposit(this.deposit1.address, this.deposit1bis.address);
      // after swap
      expect(await this.oracle.getDepositForToken(this.token1.address, '0')).to.be.equal(this.deposit1bis.address);
      await expectUnspecifiedRevert(this.oracle.getDepositForToken(this.token1.address, '1'));
      expect(await this.oracle.depositToToken(this.deposit1bis.address)).to.be.equal(this.token1.address);
      expect(await this.oracle.depositToToken(this.deposit1.address)).to.be.equal(ZERO_ADDRESS);
      expect(await this.oracle.getTokenInPcv('0')).to.be.equal(this.token1.address);
      expect(await this.oracle.isTokenInPcv(this.token1.address)).to.be.equal(true);
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracle
          .connect(impersonatedSigners[userAddress])
          .swapDeposit(this.deposit1.address, this.deposit1bis.address),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if deposit is not found', async function () {
      await expectRevert(
        this.oracle
          .connect(impersonatedSigners[governorAddress])
          .swapDeposit(this.deposit2.address, this.deposit1bis.address),
        'CollateralizationOracle: deposit not found'
      );
    });
    it('should revert if new deposit is already found', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token2.address, this.oracle2.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit2.address);
      await expectRevert(
        this.oracle
          .connect(impersonatedSigners[governorAddress])
          .swapDeposit(this.deposit1.address, this.deposit2.address),
        'CollateralizationOracle: deposit duplicate'
      );
    });
  });

  describe('setOracle()', function () {
    it('should emit OracleUpdate', async function () {
      await expect(
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address)
      )
        .to.emit(this.oracle, 'OracleUpdate')
        .withArgs(governorAddress, this.token1.address, ZERO_ADDRESS, this.oracle1.address);
    });
    it('should update maps & array properties', async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      expect(await this.oracle.tokenToOracle(this.token1.address)).to.be.equal(this.oracle1.address);
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracle.connect(impersonatedSigners[userAddress]).setOracle(this.token1.address, this.oracle1.address),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if token = 0x0', async function () {
      await expectRevert(
        this.oracle.connect(impersonatedSigners[governorAddress]).setOracle(ZERO_ADDRESS, this.oracle1.address),
        'CollateralizationOracle: token must be != 0x0'
      );
    });
    it('should revert if oracle = 0x0', async function () {
      await expectRevert(
        this.oracle.connect(impersonatedSigners[governorAddress]).setOracle(this.token1.address, ZERO_ADDRESS),
        'CollateralizationOracle: oracle must be != 0x0'
      );
    });
  });

  describe('IOracle', function () {
    describe('update()', function () {
      it('should propagage update() calls', async function () {
        expect(await this.oracle1.updated()).to.be.equal(false);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        await this.oracle.update();
        expect(await this.oracle1.updated()).to.be.equal(true);
      });
      it('should not revert if some oracles are paused', async function () {
        expect(await this.oracle1.updated()).to.be.equal(false);
        expect(await this.oracle2.updated()).to.be.equal(false);
        await this.oracle1.connect(impersonatedSigners[governorAddress]).pause({});
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token2.address, this.oracle2.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit2.address);
        await this.oracle.update();
        expect(await this.oracle1.updated()).to.be.equal(false);
        expect(await this.oracle2.updated()).to.be.equal(true);
      });
    });

    describe('isOutdated()', function () {
      it('should be outdated if one of the oracles is outdated', async function () {
        expect(await this.oracle.isOutdated()).to.be.equal(false);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        await this.oracle1.setOutdated(true);
        expect(await this.oracle.isOutdated()).to.be.equal(true);
      });
      it('should not be outdated if a paused oracle is outdated', async function () {
        expect(await this.oracle1.isOutdated()).to.be.equal(false);
        expect(await this.oracle2.isOutdated()).to.be.equal(false);
        await this.oracle1.setOutdated(true);
        await this.oracle1.connect(impersonatedSigners[governorAddress]).pause();
        expect(await this.oracle1.isOutdated()).to.be.equal(true);
        expect(await this.oracle2.isOutdated()).to.be.equal(false);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token2.address, this.oracle2.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit2.address);
        expect(await this.oracle.isOutdated()).to.be.equal(false);
      });
    });

    describe('read()', function () {
      it('should return the global collateral ratio', async function () {
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token2.address, this.oracle2.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit2.address);
        const val = await this.oracle.read();
        expect(val[0].value).to.be.equal(`2${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(true); // valid
      });
      it('should be invalid if the contract is paused', async function () {
        await this.oracle.connect(impersonatedSigners[governorAddress]).pause();
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        const val = await this.oracle.read();
        expect(val[1]).to.be.equal(false); // not valid
      });
      it('should be invalid if an oracle is invalid', async function () {
        await this.oracle1.setValid(false);
        await this.oracle
          .connect(impersonatedSigners[governorAddress])
          .setOracle(this.token1.address, this.oracle1.address);
        await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
        const val = await this.oracle.read();
        expect(val[1]).to.be.equal(false); // not valid
      });
    });
  });

  describe('ICollateralizationOracle', function () {
    beforeEach(async function () {
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token1.address, this.oracle1.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit1.address);
      await this.oracle
        .connect(impersonatedSigners[governorAddress])
        .setOracle(this.token2.address, this.oracle2.address);
      await this.oracle.connect(impersonatedSigners[governorAddress]).addDeposit(this.deposit2.address);
    });

    describe('isOvercollateralized()', function () {
      it('should revert if paused', async function () {
        await this.oracle.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(this.oracle.isOvercollateralized(), 'Pausable: paused');
      });
      it('should revert if invalid', async function () {
        expect(await this.oracle.isOvercollateralized()).to.be.equal(true);
        await this.oracle1.setValid(false);
        await expectRevert(this.oracle.isOvercollateralized(), 'CollateralizationOracle: reading is invalid');
      });
      it('should return true/false if the protocol is overcollateralized or not', async function () {
        expect(await this.oracle.isOvercollateralized()).to.be.equal(true);
        await this.fei.mint(userAddress, `2499${e18}`);
        expect(await this.oracle.isOvercollateralized()).to.be.equal(true);
        await this.fei.mint(userAddress, `1${e18}`);
        expect(await this.oracle.isOvercollateralized()).to.be.equal(false);
        await this.fei.mint(userAddress, `5000${e18}`);
        expect(await this.oracle.isOvercollateralized()).to.be.equal(false);
      });
    });

    describe('pcvStats()', function () {
      it('should return the PCV value in USD', async function () {
        expect((await this.oracle.pcvStats()).protocolControlledValue).to.be.equal(`5000${e18}`);
        await this.oracle2.setExchangeRate(5000); // 3000 -> 5000
        expect((await this.oracle.pcvStats()).protocolControlledValue).to.be.equal(`7000${e18}`);
      });
      it('should return the total amount of circulating fei', async function () {
        expect((await this.oracle.pcvStats()).userCirculatingFei).to.be.equal(`2500${e18}`);
        await this.fei.mint(userAddress, `2500${e18}`);
        expect((await this.oracle.pcvStats()).userCirculatingFei).to.be.equal(`5000${e18}`);
        await this.fei.mint(userAddress, `2500${e18}`);
        expect((await this.oracle.pcvStats()).userCirculatingFei).to.be.equal(`7500${e18}`);
      });
      it('should return the PCV equity in USD (PCV value - circulating FEI)', async function () {
        expect((await this.oracle.pcvStats()).protocolEquity).to.be.equal(`2500${e18}`);
        await this.fei.mint(userAddress, `2500${e18}`);
        expect((await this.oracle.pcvStats()).protocolEquity).to.be.equal('0');
        await this.oracle2.setExchangeRate(4000); // 3000 -> 4000
        expect((await this.oracle.pcvStats()).protocolEquity).to.be.equal(`1000${e18}`);
        await this.fei.mint(userAddress, `5000${e18}`);
        expect((await this.oracle.pcvStats()).protocolEquity).to.be.equal(`-4000${e18}`);
      });
      it('should be invalid if an oracle is invalid', async function () {
        await this.oracle1.setValid(false);
        expect((await this.oracle.pcvStats()).validityStatus).to.be.equal(false);
      });
      it('should be invalid if paused', async function () {
        await this.oracle.connect(impersonatedSigners[governorAddress]).pause();
        expect((await this.oracle.pcvStats()).validityStatus).to.be.equal(false);
      });
      it('should be valid if not paused and all oracles are valid', async function () {
        expect((await this.oracle.pcvStats()).validityStatus).to.be.equal(true);
      });
    });
  });
});
