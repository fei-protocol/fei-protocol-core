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

describe('e2e-veBalHelper-vote-lock', function () {
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
    otcBuyerSigner = await getImpersonatedSigner(otcBuyerAddress);
    await forceEth(otcBuyerAddress);

    balWethBPTWhaleSigner = await getImpersonatedSigner(balWethBPTWhale);
    await forceEth(balWethBPTWhale);
  });

  it('can lock', async () => {
    // Transfer BPT tokens to the PCV deposit, for veBalHelper to lock into veBAL
    await contracts.balWethBPT.connect(balWethBPTWhaleSigner).transfer(contractAddresses.veBalDelegatorPCVDeposit, 100);

    // Expected to fail, Balancer DAO prevented this veBAL from being relocked
    await expect(vebalOtcHelper.connect(otcBuyerSigner).lock()).to.be.revertedWith(
      'Smart contract depositors not allowed'
    );
  });

  it('should be able to setLockDuration()', async () => {
    await contracts.vebalOtcHelper.connect(otcBuyerSigner).setLockDuration(20);
    expect(await contracts.veBalDelegatorPCVDeposit.lockDuration()).to.be.eq(20);
  });

  it('should be able to exitLock()', async () => {
    const veBalBefore = await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    const balWethBefore = await contracts.balWethBPT.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    expect(veBalBefore).to.be.not.eq(0);

    await time.increase(3600 * 24 * 365); // fast foward to end of locking period
    await vebalOtcHelper.connect(otcBuyerSigner).exitLock();

    const veBalAfter = await contracts.veBal.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    const balWethAfter = await contracts.balWethBPT.balanceOf(contracts.veBalDelegatorPCVDeposit.address);
    expect(veBalAfter).to.be.eq(0);
    expect(balWethAfter).to.be.gt(balWethBefore);
  });
});
