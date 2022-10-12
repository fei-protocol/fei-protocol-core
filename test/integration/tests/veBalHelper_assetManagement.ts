import { VeBalHelper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner, time } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumberish, Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { forceEth } from '../setup/utils';

const e18 = (x: BigNumberish) => ethers.constants.WeiPerEther.mul(x);

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-veBalHelper-assetManagement', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let vebalOtcHelper: Contract;
  let otcBuyerAddress: string;
  let otcBuyerSigner: SignerWithAddress;

  let balWethBPTWhaleSigner: SignerWithAddress;
  const balWethBPTWhale = '0xC128a9954e6c874eA3d62ce62B468bA073093F25';

  before(async function () {
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);
    const addresses = await getAddresses();
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: 1
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());

    ({ vebalOtcHelper } = contracts);
    doLogging && console.log(`Environment loaded.`);
    vebalOtcHelper = vebalOtcHelper as VeBalHelper;

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }

    otcBuyerAddress = contractAddresses.aaveCompaniesMultisig;
    await forceEth(otcBuyerAddress);
    otcBuyerSigner = await getImpersonatedSigner(otcBuyerAddress);

    balWethBPTWhaleSigner = await getImpersonatedSigner(balWethBPTWhale);
    await forceEth(balWethBPTWhale);
  });

  // Tests withdrawERC20() from pcvDeposit
  it('should be able to withdrawERC20() to receive B-80BAL-20WETH at end of lock', async () => {
    await time.increase(3600 * 24 * 365);
    await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

    // Can withdrawERC20() to receive B-80BAL-20WETH at end of lock
    const bpt80Bal20WethAmount = await contracts.bpt80Bal20Weth.balanceOf(contractAddresses.veBalDelegatorPCVDeposit);
    await vebalOtcHelper
      .connect(otcBuyerSigner)
      .withdrawERC20(contractAddresses.bpt80Bal20Weth, otcBuyerAddress, bpt80Bal20WethAmount);
    expect(await contracts.bpt80Bal20Weth.balanceOf(otcBuyerAddress)).to.be.equal(bpt80Bal20WethAmount);
    expect(bpt80Bal20WethAmount).to.be.at.least(e18(112_041));
  });

  // Tests withdrawERC20() from staker
  it('can withdrawERC20 from staker', async () => {
    await forceEth(balWethBPTWhale);

    // Transfer 1 balWETHBPT token to the balancerGaugeStaker, which we will later withdraw
    // via the vebalOtcHelper contract
    await contracts.balWethBPT.connect(balWethBPTWhaleSigner).transfer(contracts.balancerGaugeStaker.address, 1);
    await forceEth(contracts.balancerGaugeStaker.address);

    const userBalanceBefore = await contracts.balWethBPT.balanceOf(otcBuyerAddress);

    // Withdraw the 1 BPT token from the balancerGaugeStaker to the user
    await contracts.vebalOtcHelper
      .connect(otcBuyerSigner)
      .withdrawERC20fromStaker(contracts.balWethBPT.address, otcBuyerAddress, 1);

    const userBalanceAfter = await contracts.balWethBPT.balanceOf(otcBuyerAddress);
    expect(userBalanceAfter).to.be.eq(userBalanceBefore.add(1));
  });

  it('can withdrawETH from pcvDeposit', async () => {
    // Transfer 1 ETH to the veBalPCVDeposit
    await forceEth(contractAddresses.veBalDelegatorPCVDeposit);
    const oneEth = ethers.utils.parseEther('1');

    const receiverAddress = '0x0000000000000000000000000000000000000001';
    const userEthBefore = await ethers.provider.getBalance(receiverAddress);

    // Withdraw ETH from pcvDeposit to the user
    await vebalOtcHelper.connect(otcBuyerSigner).withdrawETH(receiverAddress, oneEth);

    const userEthAfter = await ethers.provider.getBalance(receiverAddress);
    expect(userEthAfter.sub(userEthBefore)).to.equal(oneEth);
  });

  it('can withdrawETH from staker', async () => {
    // Transfer 1 ETH to the staker
    await forceEth(contractAddresses.balancerGaugeStaker);
    const oneEth = ethers.utils.parseEther('1');

    const receiverAddress = '0x0000000000000000000000000000000000000001';
    const userEthBefore = await ethers.provider.getBalance(receiverAddress);

    // Withdraw ETH from pcvDeposit to the user
    await vebalOtcHelper.connect(otcBuyerSigner).withdrawETHfromStaker(receiverAddress, oneEth);

    const userEthAfter = await ethers.provider.getBalance(receiverAddress);
    expect(userEthAfter.sub(userEthBefore)).to.equal(oneEth);
  });
});
