import { ERC20, TribeRedeemer } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, getImpersonatedSigner } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import { forceEth } from '@test/integration/setup/utils';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract, Signer } from 'ethers';
import { ethers } from 'hardhat';

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
});

describe('e2e-tribe-redeemer', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let userAddress: string;
  let dai: Contract;
  let tribe: Contract;
  let tribeRedeemer: Contract;
  let tribeWhaleSigner: SignerWithAddress;
  let tribeWhale: string;
  let expectedTokensRecevied: string[];

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);
    const addresses = await getAddresses();
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    ({ userAddress } = addresses);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());

    ({ dai, tribeRedeemer, tribe } = contracts);
    doLogging && console.log(`Environment loaded.`);
    tribeRedeemer = tribeRedeemer as TribeRedeemer;

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }

    tribeWhale = contractAddresses.core;
    await forceEth(tribeWhale);
    tribeWhaleSigner = await getImpersonatedSigner(tribeWhale);

    // Configuration
    expectedTokensRecevied = [addresses.steth, addresses.lqty, addresses.fox];
  });

  it('should previewRedeem() for 10,000 TRIBE', async () => {
    const tribeRedeem = ethers.constants.WeiPerEther.mul(10_000_000);
    const [tokensReceived, amountsOut] = await tribeRedeemer.previewRedeem(tribeRedeem);
    console.log({ tokensReceived });

    // ~500M TRIBE
    // ~50.3M stETH
    // ~1.1M LQTY
    // ~15.3M FOX
    expect(tokensReceived.length).to.equal(3);
    // expect(tokensReceived[0]).to.equal();
  });

  it('should redeem() for 10,000 TRIBE', async () => {
    // const startingTRIBEBalance = await tribe.balanceOf(userAddress);
    // const expectedDAIAmount = await daiPSM.getRedeemAmountOut(redeemAmount);
    // await tribeRedeemer.connect(largeTribeHolderSigner).redeem(userAddress, redeemAmount, expectedDAIAmount);
    // const endingFEIBalance = await fei.balanceOf(userAddress);
    // const endingDAIBalance = await dai.balanceOf(userAddress);
    // expect(endingDAIBalance.sub(startingDAIBalance)).to.be.equal(expectedDAIAmount);
    // expect(startingTRIBEBalance.sub(endingFEIBalance)).to.be.equal(redeemAmount);
    // expect(expectedDAIAmount).to.be.gt(0);
  });
});
