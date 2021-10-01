import { expectRevert, time, getCore, getAddresses } from '../../helpers';
import chai, { expect } from 'chai';
import hre, { artifacts, ethers, network } from 'hardhat';
import { BigNumber, Signer } from 'ethers';

const BondingCurve = artifacts.readArtifactSync('BondingCurve');
const Fei = artifacts.readArtifactSync('Fei');
const MockERC20PCVDeposit = artifacts.readArtifactSync('MockERC20PCVDeposit');
const MockERC20 = artifacts.readArtifactSync('MockERC20');
const MockOracle = artifacts.readArtifactSync('MockOracle');

const toBN = ethers.BigNumber.from;

chai.config.includeStack = true

describe('BondingCurve', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let governorAddress: string;
  let beneficiaryAddress1: string;
  let beneficiaryAddress2: string;
  let keeperAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.keeperAddress
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
    console.log(`Getting addresses...`)
    const { userAddress, governorAddress, secondUserAddress, keeperAddress, beneficiaryAddress1, beneficiaryAddress2 } =
      await getAddresses();
    console.log(`Got addresses...`)

    await network.provider.request({
      method: 'hardhat_reset',
      params: []
    });

    this.core = await getCore();

    this.fei = await ethers.getContractAt(Fei.abi, await this.core.fei());

    const oracleDeployer = await ethers.getContractFactory(MockOracle.abi, MockOracle.bytecode);
    this.oracle = await oracleDeployer.deploy(500); // 500 USD per ETH exchange rate

    const erc20Deployer = await ethers.getContractFactory(MockERC20.abi, MockERC20.bytecode);
    this.token = await erc20Deployer.deploy();

    const mockERC20PCVDepositFactory = await ethers.getContractFactory(
      MockERC20PCVDeposit.abi,
      MockERC20PCVDeposit.bytecode
    );

    this.pcvDeposit1 = await mockERC20PCVDepositFactory.deploy(beneficiaryAddress1, this.token.address);
    this.pcvDeposit2 = await mockERC20PCVDepositFactory.deploy(beneficiaryAddress2, this.token.address);

    this.scale = toBN('100000000000');
    this.buffer = toBN('100');
    this.incentiveAmount = toBN('100');
    this.incentiveDuration = toBN('10');

    const bondingCurveFactory = await ethers.getContractFactory(BondingCurve.abi, BondingCurve.bytecode);
    this.bondingCurve = await bondingCurveFactory.deploy(
      this.core.address,
      this.oracle.address,
      this.oracle.address,
      this.scale,
      [this.pcvDeposit1.address, this.pcvDeposit2.address],
      [9000, 1000],
      this.incentiveDuration,
      this.incentiveAmount,
      this.token.address,
      100,
      100
    );

    await this.token.mint(userAddress, '1000000000000000000000000');
    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.bondingCurve.address);

    await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setMintCap(this.scale.mul(toBN('10')));
  });

  describe('Init', function () {
    it('current price', async function () {
      expect((await this.bondingCurve.getCurrentPrice())[0]).to.be.equal('1010101010101010101'); // ~1.01 FEI/$
    });

    it('getAmountOut', async function () {
      expect(await this.bondingCurve.getAmountOut('50000000')).to.be.equal(toBN('25252525252'));
    });

    it('scale', async function () {
      expect(await this.bondingCurve.scale()).to.be.equal(this.scale);
      expect(await this.bondingCurve.atScale()).to.be.equal(false);
    });

    it('balance', async function () {
      expect(await this.bondingCurve.balance()).to.be.equal(toBN('0'));
    });

    it('totalPurchased', async function () {
      expect(await this.bondingCurve.totalPurchased()).to.be.equal(toBN('0'));
    });

    it('buffer', async function () {
      expect(await this.bondingCurve.buffer()).to.be.equal(this.buffer);
    });

    it('incentive amount', async function () {
      expect(await this.bondingCurve.incentiveAmount()).to.be.equal(this.incentiveAmount);
    });
  });

  describe('Purchase', function () {
    beforeEach(async function () {
      this.purchaseAmount = toBN('50000000');
    });

    describe('Paused', function () {
      it('reverts', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        await this.token
          .connect(impersonatedSigners[userAddress])
          .approve(this.bondingCurve.address, this.purchaseAmount);
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount),
          'Pausable: paused'
        );
      });
    });

    describe('Correct Token amount sent', function () {
      describe('Invalid Oracle', function () {
        it('reverts', async function () {
          this.oracle.setValid(false);
          await this.token
            .connect(impersonatedSigners[userAddress])
            .approve(this.bondingCurve.address, this.purchaseAmount);
          await expectRevert(
            this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount),
            'OracleRef: oracle invalid'
          );
        });
      });

      describe('Pre Scale', function () {
        beforeEach(async function () {
          this.expectedFei1 = toBN('25252525252');
          expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei1);
          await this.token
            .connect(impersonatedSigners[userAddress])
            .approve(this.bondingCurve.address, this.purchaseAmount);
          await expect(
            await this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount)
          )
            .to.emit(this.bondingCurve, 'Purchase')
            .withArgs(userAddress, this.purchaseAmount, this.expectedFei1);
        });

        it('correct FEI sent', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.expectedFei1);
        });

        it('totalPurchased', async function () {
          expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.expectedFei1);
        });

        it('not at Scale', async function () {
          expect(await this.bondingCurve.atScale()).to.be.equal(false);
        });

        it('current price', async function () {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('1010101010101010101');
        });

        it('total PCV held', async function () {
          expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount);
        });

        describe('Second Purchase', function () {
          beforeEach(async function () {
            this.expectedFei2 = toBN('25252525252');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(userAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(userAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.totalExpected);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('not at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('1010101010101010101');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });
        });

        describe('Purchase To', function () {
          beforeEach(async function () {
            this.expectedFei2 = toBN('25252525252');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(secondUserAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(secondUserAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.expectedFei1);
            expect(await this.fei.balanceOf(secondUserAddress)).to.be.equal(this.expectedFei2);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('not at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('1010101010101010101');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });
        });

        describe('Oracle Price Change', function () {
          beforeEach(async function () {
            // 20% reduction in exchange rate
            await this.oracle.setExchangeRate(400);
            this.expectedFei2 = toBN('20202020202');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(userAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(userAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.totalExpected);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('not at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(false);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('1010101010101010101');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });
        });
      });
      describe('Exceeding cap', function () {
        it('reverts', async function () {
          this.purchaseAmount = toBN('4000000000');
          await this.token
            .connect(impersonatedSigners[userAddress])
            .approve(this.bondingCurve.address, this.purchaseAmount);
          await expectRevert(
            this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount),
            'BondingCurve: exceeds mint cap'
          );
        });
      });
      describe('Crossing Scale', function () {
        beforeEach(async function () {
          this.purchaseAmount = toBN('400000000');
          this.expectedFei1 = toBN('200020002000');
          expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei1);
          await this.token
            .connect(impersonatedSigners[userAddress])
            .approve(this.bondingCurve.address, this.purchaseAmount);
          await expect(
            await this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount)
          )
            .to.emit(this.bondingCurve, 'Purchase')
            .withArgs(userAddress, this.purchaseAmount, this.expectedFei1);
        });

        it('correct FEI sent', async function () {
          expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.expectedFei1);
        });

        it('totalPurchased', async function () {
          expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.expectedFei1);
        });

        it('At Scale', async function () {
          expect(await this.bondingCurve.atScale()).to.be.equal(true);
        });

        it('current price', async function () {
          expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('990099009900990099');
        });

        it('total PCV held', async function () {
          expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount);
        });

        describe('Post Scale', function () {
          beforeEach(async function () {
            this.expectedFei2 = toBN('198019801980');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(userAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(userAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.totalExpected);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('990099009900990099');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });

          describe('reset', function () {
            beforeEach(async function () {
              await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).reset()).to.emit(
                this.bondingCurve,
                'Reset'
              );
            });

            it('totalPurchased', async function () {
              expect(await this.bondingCurve.totalPurchased()).to.be.equal(toBN('0'));
            });

            it('at Scale', async function () {
              expect(await this.bondingCurve.atScale()).to.be.equal(false);
            });
          });
        });

        describe('Buffer Change', function () {
          beforeEach(async function () {
            // 5% buffer
            await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setBuffer(500);
            this.expectedFei2 = toBN('190476190476');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(userAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(userAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.totalExpected);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('952380952380952380');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });
        });

        describe('Oracle Price Change', function () {
          beforeEach(async function () {
            // 20% decrease
            await this.oracle.setExchangeRate(600);
            this.expectedFei2 = toBN('237623762376');
            this.totalExpected = this.expectedFei1.add(this.expectedFei2);
            expect(await this.bondingCurve.getAmountOut(this.purchaseAmount)).to.be.equal(this.expectedFei2);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await expect(
              await this.bondingCurve
                .connect(impersonatedSigners[userAddress])
                .purchase(userAddress, this.purchaseAmount)
            )
              .to.emit(this.bondingCurve, 'Purchase')
              .withArgs(userAddress, this.purchaseAmount, this.expectedFei2);
          });

          it('correct FEI sent', async function () {
            expect(await this.fei.balanceOf(userAddress)).to.be.equal(this.totalExpected);
          });

          it('totalPurchased', async function () {
            expect(await this.bondingCurve.totalPurchased()).to.be.equal(this.totalExpected);
          });

          it('at Scale', async function () {
            expect(await this.bondingCurve.atScale()).to.be.equal(true);
          });

          it('current price', async function () {
            expect((await this.bondingCurve.getCurrentPrice()).value).to.be.equal('990099009900990099');
          });

          it('total PCV held', async function () {
            expect(await this.bondingCurve.balance()).to.be.equal(this.purchaseAmount.mul(toBN(2)));
          });
        });
      });
    });
  });

  describe('Allocate', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate(),
          'Pausable: paused'
        );
      });
    });

    describe('No Purchase', function () {
      it('reverts', async function () {
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate(),
          'BondingCurve: Not enough PCV held'
        );
      });
    });

    describe('Purchase too low', function () {
      it('reverts', async function () {
        this.purchaseAmount = toBN('1');
        await this.token
          .connect(impersonatedSigners[userAddress])
          .approve(this.bondingCurve.address, this.purchaseAmount);
        await this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount);
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate(),
          'BondingCurve: Not enough PCV held'
        );
      });
    });

    describe('With Purchase', function () {
      beforeEach(async function () {
        this.purchaseAmount = toBN('10000000');
        this.beneficiaryBalance1 = await this.token.balanceOf(beneficiaryAddress1);
        this.beneficiaryBalance2 = await this.token.balanceOf(beneficiaryAddress2);

        this.keeperFei = await this.fei.balanceOf(keeperAddress);

        await time.increase(10);
        await this.token
          .connect(impersonatedSigners[userAddress])
          .approve(this.bondingCurve.address, this.purchaseAmount);

        await this.bondingCurve.connect(impersonatedSigners[userAddress]).purchase(userAddress, this.purchaseAmount);
        await expect(await this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate())
          .to.emit(this.bondingCurve, 'Allocate')
          .withArgs(keeperAddress, this.purchaseAmount);
      });

      it('splits funds', async function () {
        expect(await this.token.balanceOf(beneficiaryAddress1)).to.be.equal(
          this.beneficiaryBalance1.add(toBN('9000000'))
        );
        expect(await this.token.balanceOf(beneficiaryAddress2)).to.be.equal(
          this.beneficiaryBalance2.add(toBN('1000000'))
        );
      });

      it('incentivizes', async function () {
        expect(await this.fei.balanceOf(keeperAddress)).to.be.equal(this.keeperFei.add(this.incentiveAmount));
      });

      describe('Second Allocate', async function () {
        describe('No Purchase', function () {
          it('reverts', async function () {
            await expectRevert(
              this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate(),
              'BondingCurve: Not enough PCV held'
            );
          });
        });

        describe('With Purchase Before Window', function () {
          beforeEach(async function () {
            this.beneficiaryBalance1 = await this.token.balanceOf(beneficiaryAddress1);
            this.beneficiaryBalance2 = await this.token.balanceOf(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await this.bondingCurve
              .connect(impersonatedSigners[userAddress])
              .purchase(userAddress, this.purchaseAmount);
            await expect(await this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate())
              .to.emit(this.bondingCurve, 'Allocate')
              .withArgs(keeperAddress, this.purchaseAmount);
          });

          it('splits funds', async function () {
            expect(await this.token.balanceOf(beneficiaryAddress1)).to.be.equal(
              this.beneficiaryBalance1.add(toBN('9000000'))
            );
            expect(await this.token.balanceOf(beneficiaryAddress2)).to.be.equal(
              this.beneficiaryBalance2.add(toBN('1000000'))
            );
          });

          it('no incentives', async function () {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.equal(this.keeperFei);
          });
        });

        describe('With Purchase After Window', function () {
          beforeEach(async function () {
            this.beneficiaryBalance1 = await this.token.balanceOf(beneficiaryAddress1);
            this.beneficiaryBalance2 = await this.token.balanceOf(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);

            await time.increase(10);
            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await this.bondingCurve
              .connect(impersonatedSigners[userAddress])
              .purchase(userAddress, this.purchaseAmount);
            await expect(await this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate())
              .to.emit(this.bondingCurve, 'Allocate')
              .withArgs(keeperAddress, this.purchaseAmount);
          });

          it('splits funds', async function () {
            expect(await this.token.balanceOf(beneficiaryAddress1)).to.be.equal(
              this.beneficiaryBalance1.add(toBN('9000000'))
            );
            expect(await this.token.balanceOf(beneficiaryAddress2)).to.be.equal(
              this.beneficiaryBalance2.add(toBN('1000000'))
            );
          });

          it('incentivizes', async function () {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.equal(this.keeperFei.add(this.incentiveAmount));
          });
        });

        describe('Updated Allocation', function () {
          beforeEach(async function () {
            this.beneficiaryBalance1 = await this.token.balanceOf(beneficiaryAddress1);
            this.beneficiaryBalance2 = await this.token.balanceOf(beneficiaryAddress2);

            this.keeperFei = await this.fei.balanceOf(keeperAddress);

            await time.increase(10);
            await this.bondingCurve
              .connect(impersonatedSigners[governorAddress])
              .setAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000]);

            await this.token
              .connect(impersonatedSigners[userAddress])
              .approve(this.bondingCurve.address, this.purchaseAmount);
            await this.bondingCurve
              .connect(impersonatedSigners[userAddress])
              .purchase(userAddress, this.purchaseAmount);
            await expect(await this.bondingCurve.connect(impersonatedSigners[keeperAddress]).allocate())
              .to.emit(this.bondingCurve, 'Allocate')
              .withArgs(keeperAddress, this.purchaseAmount);
          });

          it('splits funds', async function () {
            expect(await this.token.balanceOf(beneficiaryAddress1)).to.be.equal(
              this.beneficiaryBalance1.add(toBN('5000000'))
            );
            expect(await this.token.balanceOf(beneficiaryAddress2)).to.be.equal(
              this.beneficiaryBalance2.add(toBN('5000000'))
            );
          });

          it('incentivizes', async function () {
            expect(await this.fei.balanceOf(keeperAddress)).to.be.equal(this.keeperFei.add(this.incentiveAmount));
          });
        });
      });
    });
  });

  describe('PCV Allocation', function () {
    it('Mismatched lengths revert', async function () {
      await expectRevert(
        this.bondingCurve.checkAllocation([this.pcvDeposit1.address], [9000, 1000]),
        'PCVSplitter: PCV Deposits and ratios are different lengths'
      );
    });

    it('Incomplete allocation rule reverts', async function () {
      await expectRevert(
        this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [9000, 2000]),
        'PCVSplitter: ratios do not total 100%'
      );
    });

    it('Correct allocation rule succeeds', async function () {
      await this.bondingCurve.checkAllocation([this.pcvDeposit1.address, this.pcvDeposit2.address], [5000, 5000]);
    });

    it('Governor set succeeds', async function () {
      await expect(
        await this.bondingCurve
          .connect(impersonatedSigners[governorAddress])
          .setAllocation([this.pcvDeposit1.address], [10000])
      ).to.emit(this.bondingCurve, 'AllocationUpdate');

      const result = await this.bondingCurve.getAllocation();
      expect(result[0].length).to.be.equal(1);
      expect(result[0][0]).to.be.equal(this.pcvDeposit1.address);
      expect(result[1].length).to.be.equal(1);
      expect(result[1][0]).to.be.equal(toBN(10000));
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setAllocation([this.pcvDeposit1.address], [10000]),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Oracle', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setOracle(userAddress))
        .to.emit(this.bondingCurve, 'OracleUpdate')
        .withArgs(this.oracle.address, userAddress);

      expect(await this.bondingCurve.oracle()).to.be.equal(userAddress);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setOracle(userAddress),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Scale', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setScale(100))
        .to.emit(this.bondingCurve, 'ScaleUpdate')
        .withArgs(this.scale, toBN(100));

      expect(await this.bondingCurve.scale()).to.be.equal(toBN(100));
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setScale(100),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Buffer', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setBuffer(1000))
        .to.emit(this.bondingCurve, 'BufferUpdate')
        .withArgs(this.buffer, toBN(1000));

      expect(await this.bondingCurve.buffer()).to.be.equal(toBN(1000));
    });

    it('Governor set outside range reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[governorAddress]).setBuffer(10000),
        'BondingCurve: Buffer exceeds or matches granularity'
      );
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setBuffer(1000),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Discount', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setDiscount(1000))
        .to.emit(this.bondingCurve, 'DiscountUpdate')
        .withArgs('100', toBN(1000));

      expect(await this.bondingCurve.discount()).to.be.equal(toBN(1000));
    });

    it('Governor set outside range reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[governorAddress]).setDiscount(10000),
        'BondingCurve: Buffer exceeds or matches granularity'
      );
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setDiscount(1000),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Core', function () {
    it('Governor set succeeds', async function () {
      await expect(await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setCore(userAddress))
        .to.emit(this.bondingCurve, 'CoreUpdate')
        .withArgs(this.core.address, userAddress);

      expect(await this.bondingCurve.core()).to.be.equal(userAddress);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setCore(userAddress),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Incentive Amount', function () {
    it('Governor set succeeds', async function () {
      this.incentiveAmount = toBN('10');
      await expect(
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).setIncentiveAmount(this.incentiveAmount)
      )
        .to.emit(this.bondingCurve, 'IncentiveUpdate')
        .withArgs(toBN('100'), this.incentiveAmount);

      expect(await this.bondingCurve.incentiveAmount()).to.be.equal(this.incentiveAmount);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setIncentiveAmount(toBN('10')),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Incentive Frequency', function () {
    it('Governor set succeeds', async function () {
      this.incentiveFrequency = toBN('70');
      await expect(
        await this.bondingCurve
          .connect(impersonatedSigners[governorAddress])
          .setIncentiveFrequency(this.incentiveFrequency)
      )
        .to.emit(this.bondingCurve, 'DurationUpdate')
        .withArgs(this.incentiveDuration, this.incentiveFrequency);

      expect(await this.bondingCurve.duration()).to.be.equal(this.incentiveFrequency);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        this.bondingCurve.connect(impersonatedSigners[userAddress]).setIncentiveFrequency(toBN('10')),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Pausable', function () {
    it('init', async function () {
      expect(await this.bondingCurve.paused()).to.be.equal(false);
    });

    describe('Pause', function () {
      it('Governor succeeds', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        expect(await this.bondingCurve.paused()).to.be.equal(true);
      });

      it('Non-governor reverts', async function () {
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[userAddress]).pause(),
          'CoreRef: Caller is not a guardian or governor'
        );
      });
    });

    describe('Unpause', function () {
      beforeEach(async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).pause();
        expect(await this.bondingCurve.paused()).to.be.equal(true);
      });

      it('Governor succeeds', async function () {
        await this.bondingCurve.connect(impersonatedSigners[governorAddress]).unpause();
        expect(await this.bondingCurve.paused()).to.be.equal(false);
      });

      it('Non-governor reverts', async function () {
        await expectRevert(
          this.bondingCurve.connect(impersonatedSigners[userAddress]).unpause(),
          'CoreRef: Caller is not a guardian or governor'
        );
      });
    });
  });
});
