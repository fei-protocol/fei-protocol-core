import { VeBalHelper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner, time } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';
import { forceEth } from '../setup/utils';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-veBalHelper-gauge-management', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let vebalOtcHelper: Contract;
  let otcBuyerAddress: string;
  let otcBuyerSigner: SignerWithAddress;

  let gaugeTokenHolderSigner: SignerWithAddress;
  const balFeiWethGaugeTokenHolder = '0xf4adc8369e83d6a599e51438d44b5e53a412f807';

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

    await forceEth(balFeiWethGaugeTokenHolder);
    gaugeTokenHolderSigner = await getImpersonatedSigner(balFeiWethGaugeTokenHolder);
  });

  it('can stakeInGauge()', async () => {
    expect(await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)).to.be.equal(0);
    await contracts.bpt30Fei70Weth.connect(gaugeTokenHolderSigner).transfer(contractAddresses.balancerGaugeStaker, 100);

    await vebalOtcHelper.connect(otcBuyerSigner).stakeInGauge(contractAddresses.bpt30Fei70Weth, 100);

    expect(await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)).to.be.equal(
      100
    );
  });

  it('can stakeAllInGauge()', async () => {
    const stakeBeforeBalance = await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(
      contractAddresses.balancerGaugeStaker
    );
    await contracts.bpt30Fei70Weth.connect(gaugeTokenHolderSigner).transfer(contractAddresses.balancerGaugeStaker, 100);

    await vebalOtcHelper.connect(otcBuyerSigner).stakeAllInGauge(contractAddresses.bpt30Fei70Weth);
    const stakeBalanceIncrease = (
      await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)
    ).sub(stakeBeforeBalance);
    expect(stakeBalanceIncrease).to.equal(100);
  });

  it('can unstakeFromGauge()', async () => {
    const stakeBeforeBalance = await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(
      contractAddresses.balancerGaugeStaker
    );
    await contracts.bpt30Fei70Weth.connect(gaugeTokenHolderSigner).transfer(contractAddresses.balancerGaugeStaker, 100);

    await vebalOtcHelper.connect(otcBuyerSigner).stakeInGauge(contractAddresses.bpt30Fei70Weth, 100);
    await vebalOtcHelper.connect(otcBuyerSigner).unstakeFromGauge(contractAddresses.bpt30Fei70Weth, 100);
    const stakeBalanceDiff = (
      await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)
    ).sub(stakeBeforeBalance);
    expect(stakeBalanceDiff).to.equal(0);
  });

  it('should be able to voteForGaugeWeight() to vote for gauge weights whilst a lock is active ', async () => {
    // remove 100% votes for BB-USD gauge
    expect(
      (
        await contracts.balancerGaugeController.vote_user_slopes(
          contractAddresses.veBalDelegatorPCVDeposit,
          contractAddresses.balancerBBUSDGauge
        )
      )[1]
    ).to.be.equal('10000');
    await time.increase(86400 * 11); // Cannot change gauge weights more than once every 10 days
    await vebalOtcHelper
      .connect(otcBuyerSigner)
      .voteForGaugeWeight(contractAddresses.balancerBBaUSD, contractAddresses.balancerBBUSDGauge, 0);
    expect(
      (
        await contracts.balancerGaugeController.vote_user_slopes(
          contractAddresses.veBalDelegatorPCVDeposit,
          contractAddresses.balancerBBUSDGauge
        )
      )[1]
    ).to.be.equal('0');
    await time.increase(86400 * 11); // Cannot change gauge weights more than once every 10 days
    // set 100% votes for bb-a-usd
    await vebalOtcHelper.connect(otcBuyerSigner).voteForGaugeWeight(
      contractAddresses.balancerBBaUSD, // bb-a-usd token
      contractAddresses.balancerBBUSDGauge, // bb-a-usd gauge
      10000
    );
    expect(
      (
        await contracts.balancerGaugeController.vote_user_slopes(
          contractAddresses.veBalDelegatorPCVDeposit,
          contractAddresses.balancerBBUSDGauge
        )
      )[1]
    ).to.be.equal('10000');
  });
});
