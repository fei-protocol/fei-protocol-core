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

describe('e2e-veBalHelper-boost-management', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let vebalOtcHelper: Contract;
  let otcBuyerAddress: string;
  let otcBuyerSigner: SignerWithAddress;

  beforeEach(async function () {
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

    await time.increase(86400 * 3);
    const aaveCreatedBoostId = '0xC4EAC760C2C631EE0B064E39888B89158FF808B2000000000000000000005ABF';
    await vebalOtcHelper.connect(otcBuyerSigner).cancel_boost(aaveCreatedBoostId);
  });

  it('should be able to create_boost() to boost delegation to another address', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).create_boost(
      contractAddresses.veBalDelegatorPCVDeposit, // address _delegator
      contractAddresses.eswak, // address _receiver
      '10000', // int256 _percentage
      '1669852800', // uint256 _cancel_time = December 1 2022
      '1672272000', // uint256 _expire_time = December 29 2022
      '0' // uint256 _id
    );
    const expectedMinBoost = '65000000000000000000000'; // should be 77.5k with 18 decimals as of 14/09/2022
    expect(
      await contracts.balancerVotingEscrowDelegation.delegated_boost(contracts.veBalDelegatorPCVDeposit.address)
    ).to.be.at.least(expectedMinBoost);
    expect(await contracts.balancerVotingEscrowDelegation.received_boost(contractAddresses.eswak)).to.be.at.least(
      expectedMinBoost
    );

    // token id is uint256(delegatorAddress << 96 + boostId), and boostId = 0
    const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
    expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least(expectedMinBoost);
    expect(await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId)).to.equal('1672272000');
    expect(await contracts.balancerVotingEscrowDelegation.token_cancel_time(tokenId)).to.equal('1669852800');
  });

  it('should be able to extend_boost', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).create_boost(
      contractAddresses.veBalDelegatorPCVDeposit, // address _delegator
      contractAddresses.eswak, // address _receiver
      '10000', // int256 _percentage
      '1669852800', // uint256 _cancel_time = December 1 2022
      '1672272000', // uint256 _expire_time = December 29 2022
      '0' // uint256 _id
    );
    const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';

    await time.increase(86400 * 8);
    const boostedExpireTime = '1674998582'; // uint256 _expire_time = Jan 29 2023
    //  - boostedExpireTime gets rounded down to nearest week
    const boostedCancelTime = '1672694348'; // uint256 _cancel_time = Jan 2 2023

    // Extend the boost
    await vebalOtcHelper.connect(otcBuyerSigner).extend_boost(
      tokenId,
      '10000', // int256 _percentage
      boostedExpireTime,
      boostedCancelTime
    );

    const recordedBoostedExpireTime = await contracts.balancerVotingEscrowDelegation.token_expiry(tokenId);

    // Expected boosted expire time rounded down to nearest week
    const WEEK = 86400 * 7;
    const expectedBoostedExpire = Math.floor(Number(boostedExpireTime) / WEEK) * WEEK;
    expect(recordedBoostedExpireTime).to.equal(expectedBoostedExpire);
    expect(await contracts.balancerVotingEscrowDelegation.token_cancel_time(tokenId)).to.equal(boostedCancelTime);
  });

  it('should be able to cancel_boost', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).create_boost(
      contractAddresses.veBalDelegatorPCVDeposit, // address _delegator
      contractAddresses.eswak, // address _receiver
      '10000', // int256 _percentage
      '1665432310', // uint256 _cancel_time = October 10 2022
      '1676495110', // uint256 _expire_time = February 15 2023
      '0' // uint256 _id
    );
    const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
    expect(await contracts.balancerVotingEscrowDelegation.token_boost(tokenId)).to.be.at.least('1'); // non-zero check

    // Cancel boost - fast forward past cancel time
    await time.increase(86400 * 30);
    await vebalOtcHelper.connect(otcBuyerSigner).cancel_boost(tokenId);

    const balancerTokenBoost = await contracts.balancerVotingEscrowDelegation.token_boost(tokenId);
    expect(balancerTokenBoost).to.equal(0);
  });

  it('should be able to burn a token', async () => {
    await vebalOtcHelper.connect(otcBuyerSigner).create_boost(
      contractAddresses.veBalDelegatorPCVDeposit, // address _delegator
      contractAddresses.veBalDelegatorPCVDeposit, // address _receiver (becomes owner, only owner can burn)
      '10000', // int256 _percentage
      '1669852800', // uint256 _cancel_time = December 1 2022
      '1672272000', // uint256 _expire_time = December 29 2022
      '0' // uint256 _id
    );
    const tokenId = '0xc4eac760c2c631ee0b064e39888b89158ff808b2000000000000000000000000';
    // Burn token
    await vebalOtcHelper.connect(otcBuyerSigner).burn(tokenId);
  });
});
