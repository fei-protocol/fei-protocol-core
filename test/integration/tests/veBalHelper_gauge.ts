import { VeBalHelper } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner } from '@test/helpers';
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
  const balFeiWethGaugeTokenHolder = '0x7818a1da7bd1e64c199029e86ba244a9798eee10';

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
    otcBuyerSigner = await getImpersonatedSigner(otcBuyerAddress);

    await forceEth(balFeiWethGaugeTokenHolder);
    gaugeTokenHolderSigner = await getImpersonatedSigner(balFeiWethGaugeTokenHolder);
  });

  describe('Gauge management', () => {
    it('can stakeInGauge()', async () => {
      expect(await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)).to.be.equal(
        0
      );
      await contracts.bpt30Fei70Weth
        .connect(gaugeTokenHolderSigner)
        .transfer(contractAddresses.balancerGaugeStaker, 100);

      await vebalOtcHelper.connect(otcBuyerSigner).stakeInGauge(contractAddresses.bpt30Fei70Weth, 100);

      expect(await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)).to.be.equal(
        100
      );
    });

    it('can stakeAllInGauge()', async () => {
      const stakeBeforeBalance = await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(
        contractAddresses.balancerGaugeStaker
      );
      await contracts.bpt30Fei70Weth
        .connect(gaugeTokenHolderSigner)
        .transfer(contractAddresses.balancerGaugeStaker, 100);

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
      await contracts.bpt30Fei70Weth
        .connect(gaugeTokenHolderSigner)
        .transfer(contractAddresses.balancerGaugeStaker, 100);

      await vebalOtcHelper.connect(otcBuyerSigner).stakeInGauge(contractAddresses.bpt30Fei70Weth, 100);
      await vebalOtcHelper.connect(otcBuyerSigner).unstakeFromGauge(contractAddresses.bpt30Fei70Weth, 100);
      const stakeBalanceDiff = (
        await contracts.balancerGaugeBpt30Fei70Weth.balanceOf(contractAddresses.balancerGaugeStaker)
      ).sub(stakeBeforeBalance);
      expect(stakeBalanceDiff).to.equal(0);
    });

    it('should be able to voteForGaugeWeight() to vote for gauge weights whilst a lock is active ', async () => {
      // remove 100% votes for B-30FEI-70WETH
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            contractAddresses.balancerGaugeBpt30Fei70Weth
          )
        )[1]
      ).to.be.equal('10000');
      await vebalOtcHelper
        .connect(otcBuyerSigner)
        .voteForGaugeWeight(contractAddresses.bpt30Fei70Weth, contractAddresses.balancerGaugeBpt30Fei70Weth, 0);
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            contractAddresses.balancerGaugeBpt30Fei70Weth
          )
        )[1]
      ).to.be.equal('0');
      // set 100% votes for bb-a-usd
      await vebalOtcHelper.connect(otcBuyerSigner).voteForGaugeWeight(
        '0x7B50775383d3D6f0215A8F290f2C9e2eEBBEceb2', // bb-a-usd token
        '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb', // bb-a-usd gauge
        10000
      );
      expect(
        (
          await contracts.balancerGaugeController.vote_user_slopes(
            contractAddresses.veBalDelegatorPCVDeposit,
            '0x68d019f64A7aa97e2D4e7363AEE42251D08124Fb'
          )
        )[1]
      ).to.be.equal('10000');
    });
  });
});
