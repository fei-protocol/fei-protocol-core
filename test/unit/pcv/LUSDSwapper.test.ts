import { getCore, getAddresses, getImpersonatedSigner, expectRevert } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { Core, LUSDSwapper, MockBAMM, MockERC20, MockEthPCVDeposit, MockPCVDepositV2 } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe('LUSDSwapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let core: Core;
  let token: MockERC20;
  let deposit: MockPCVDepositV2;
  let ethDeposit: MockEthPCVDeposit;
  let lusdSwapper: LUSDSwapper;
  let bamm: MockBAMM;

  let userAddress: string;
  let governorAddress: string;

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress];

    userAddress = addresses.userAddress;
    governorAddress = addresses.governorAddress;

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    core = await getCore();
    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    deposit = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      core.address,
      token.address,
      '2000',
      '0' // ignoted protocol FEI
    );

    ethDeposit = await (await ethers.getContractFactory('MockEthPCVDeposit')).deploy(userAddress);

    bamm = await (await ethers.getContractFactory('MockBAMM')).deploy();

    lusdSwapper = await (
      await ethers.getContractFactory('LUSDSwapper')
    ).deploy(core.address, bamm.address, deposit.address, ethDeposit.address);
  });

  it('initial state', async function () {
    expect(await lusdSwapper.bamm()).to.be.equal(bamm.address);
    expect(await lusdSwapper.lusdDeposit()).to.be.equal(deposit.address);
    expect(await lusdSwapper.ethDeposit()).to.be.equal(ethDeposit.address);

    expect(await token.allowance(lusdSwapper.address, bamm.address)).to.be.bignumber.equal(ethers.constants.MaxUint256);
  });

  it('receive forwards eth', async function () {
    const beforeBalance = await ethers.provider.getBalance(userAddress);
    await impersonatedSigners[governorAddress].sendTransaction({ to: lusdSwapper.address, value: 100 });
    const afterBalance = await ethers.provider.getBalance(userAddress);
    expect(afterBalance.sub(beforeBalance)).to.be.bignumber.equal(toBN(100));
  });

  describe('swap', function () {
    it('Governor succeeds', async function () {
      await expect(await lusdSwapper.connect(impersonatedSigners[governorAddress]).swapLUSD(1, 2))
        .to.emit(bamm, 'Swap')
        .withArgs(1, 2, ethDeposit.address);
    });

    it('Non-governor reverts', async function () {
      await expectRevert(
        lusdSwapper.connect(impersonatedSigners[userAddress]).swapLUSD(0, 0),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('setLusdDeposit', function () {
    it('Governor set succeeds', async function () {
      await expect(await lusdSwapper.connect(impersonatedSigners[governorAddress]).setLusdDeposit(userAddress))
        .to.emit(lusdSwapper, 'LusdDepositUpdate')
        .withArgs(deposit.address, userAddress);

      expect(await lusdSwapper.lusdDeposit()).to.be.equal(userAddress);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        lusdSwapper.connect(impersonatedSigners[userAddress]).setLusdDeposit(userAddress),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('setEthDeposit', function () {
    it('Governor set succeeds', async function () {
      await expect(await lusdSwapper.connect(impersonatedSigners[governorAddress]).setEthDeposit(userAddress))
        .to.emit(lusdSwapper, 'EthDepositUpdate')
        .withArgs(ethDeposit.address, userAddress);

      expect(await lusdSwapper.ethDeposit()).to.be.equal(userAddress);
    });

    it('Non-governor set reverts', async function () {
      await expectRevert(
        lusdSwapper.connect(impersonatedSigners[userAddress]).setEthDeposit(userAddress),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });
});
