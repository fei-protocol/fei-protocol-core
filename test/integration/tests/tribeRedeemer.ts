import { TribeRedeemer } from '@custom-types/contracts';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { getAddresses, expectRevert, getImpersonatedSigner } from '@test/helpers';
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
  let contracts: NamedContracts;
  let addresses: NamedAddresses;
  let e2eCoord: TestEndtoEndCoordinator;

  before(async function () {
    // Setup test environment and get contracts
    e2eCoord = new TestEndtoEndCoordinator(
      {
        logging: false,
        deployAddress: (await ethers.getSigners())[0].address,
        version: 1
      },
      ProposalsConfig
    );
    ({ contracts, contractAddresses: addresses } = await e2eCoord.loadEnvironment());
  });

  it('previewRedeem() for 100% base should return the full balance', async () => {
    const [tokensReceived, amountsOut] = await contracts.tribeRedeemer.previewRedeem(
      await contracts.tribeRedeemer.redeemBase()
    );

    expect(tokensReceived.length).to.equal(4);
    expect(tokensReceived[0]).to.equal(contracts.steth.address);
    expect(tokensReceived[1]).to.equal(contracts.lqty.address);
    expect(tokensReceived[2]).to.equal(contracts.fox.address);
    expect(tokensReceived[3]).to.equal(contracts.dai.address);
    expect(amountsOut[0]).to.equal(await contracts.steth.balanceOf(contracts.tribeRedeemer.address));
    expect(amountsOut[1]).to.equal(await contracts.lqty.balanceOf(contracts.tribeRedeemer.address));
    expect(amountsOut[2]).to.equal(await contracts.fox.balanceOf(contracts.tribeRedeemer.address));
    expect(amountsOut[3]).to.equal(await contracts.dai.balanceOf(contracts.tribeRedeemer.address));
  });

  it('previewRedeem() for 10,000 TRIBE', async () => {
    const [tokensReceived, amountsOut] = await contracts.tribeRedeemer.previewRedeem(
      ethers.constants.WeiPerEther.mul(10_000)
    );

    expect(tokensReceived.length).to.equal(4);
    expect(tokensReceived[0]).to.equal(contracts.steth.address);
    expect(tokensReceived[1]).to.equal(contracts.lqty.address);
    expect(tokensReceived[2]).to.equal(contracts.fox.address);
    expect(tokensReceived[3]).to.equal(contracts.dai.address);

    // sanity checks on the amounts
    /*console.log('amountsOut[0]', amountsOut[0].toString());
    console.log('amountsOut[1]', amountsOut[1].toString());
    console.log('amountsOut[2]', amountsOut[2].toString());
    console.log('amountsOut[3]', amountsOut[3].toString());*/
    expect(amountsOut[0]).to.be.at.least(ethers.constants.WeiPerEther.mul(109).div(100)); // [1.09, 1.12] stETH
    expect(amountsOut[0]).to.be.at.most(ethers.constants.WeiPerEther.mul(112).div(100)); // [1.09, 1.12] stETH
    expect(amountsOut[1]).to.be.at.least(ethers.constants.WeiPerEther.mul(23));
    expect(amountsOut[1]).to.be.at.most(ethers.constants.WeiPerEther.mul(24));
    expect(amountsOut[2]).to.be.at.least(ethers.constants.WeiPerEther.mul(330));
    expect(amountsOut[2]).to.be.at.most(ethers.constants.WeiPerEther.mul(335));
    expect(amountsOut[3]).to.be.at.least(ethers.constants.WeiPerEther.mul(660));
    expect(amountsOut[3]).to.be.at.most(ethers.constants.WeiPerEther.mul(670));
  });

  it('redeem() 1,000,000 TRIBE, twice', async () => {
    const signer = await getImpersonatedSigner(addresses.core);
    await forceEth(signer.address);
    const amount = ethers.constants.WeiPerEther.mul(1_000_000);

    const tribeBalance0 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance0 = await contracts.steth.balanceOf(signer.address);
    const daiBalance0 = await contracts.dai.balanceOf(signer.address);

    // first redeem
    await contracts.tribe.connect(signer).approve(contracts.tribeRedeemer.address, amount);
    await contracts.tribeRedeemer.connect(signer).redeem(signer.address, amount);

    const tribeBalance1 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance1 = await contracts.steth.balanceOf(signer.address);
    const daiBalance1 = await contracts.dai.balanceOf(signer.address);

    // second redeem
    await contracts.tribe.connect(signer).approve(contracts.tribeRedeemer.address, amount);
    await contracts.tribeRedeemer.connect(signer).redeem(signer.address, amount);

    const tribeBalance2 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance2 = await contracts.steth.balanceOf(signer.address);
    const daiBalance2 = await contracts.dai.balanceOf(signer.address);

    // should spend the TRIBE in each call
    expect(tribeBalance0.sub(tribeBalance1)).to.be.equal(amount);
    expect(tribeBalance1.sub(tribeBalance2)).to.be.equal(amount);

    // both redeems should give the same amounts of tokens
    expect(stethBalance1.sub(stethBalance0)).to.be.equal(stethBalance2.sub(stethBalance1));
    expect(daiBalance1.sub(daiBalance0)).to.be.equal(daiBalance2.sub(daiBalance1));

    // sanity checks on the amounts
    const stethPerRedeem = stethBalance1.sub(stethBalance0);
    const daiPerRedeem = daiBalance1.sub(daiBalance0);
    expect(stethPerRedeem).to.be.at.least(ethers.constants.WeiPerEther.mul(109));
    expect(stethPerRedeem).to.be.at.most(ethers.constants.WeiPerEther.mul(112));
    expect(daiPerRedeem).to.be.at.least(ethers.constants.WeiPerEther.mul(66000));
    expect(daiPerRedeem).to.be.at.most(ethers.constants.WeiPerEther.mul(67000));
  });

  it('small redeemooor', async () => {
    const signer = await getImpersonatedSigner(addresses.core);
    await forceEth(signer.address);
    const amount = ethers.constants.WeiPerEther.div(1_000_000); // 0.000001 TRIBE

    const tribeBalance0 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance0 = await contracts.steth.balanceOf(signer.address);
    const daiBalance0 = await contracts.dai.balanceOf(signer.address);

    // redeem
    await contracts.tribe.connect(signer).approve(contracts.tribeRedeemer.address, amount);
    await contracts.tribeRedeemer.connect(signer).redeem(signer.address, amount);

    const tribeBalance1 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance1 = await contracts.steth.balanceOf(signer.address);
    const daiBalance1 = await contracts.dai.balanceOf(signer.address);

    // check amount spent
    expect(tribeBalance0.sub(tribeBalance1)).to.be.equal(amount);
    // check amount received
    const stethReceived = stethBalance1.sub(stethBalance0);
    const daiReceived = daiBalance1.sub(daiBalance0);
    expect(stethReceived).to.be.at.least('109000000'); // >= 0.000000000109 stETH
    expect(stethReceived).to.be.at.most('112000000'); // <= 0.000000000112 stETH
    expect(daiReceived).to.be.at.least('66000000000'); // >= 0.000000066 DAI
    expect(daiReceived).to.be.at.most('67000000000'); // <>>= 0.000000067 DAI
  });

  it('dust redeemooor', async () => {
    const signer = await getImpersonatedSigner(addresses.core);
    await forceEth(signer.address);
    const amount = '100'; // 100 TRIBE Wei

    const tribeBalance0 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance0 = await contracts.steth.balanceOf(signer.address);
    const daiBalance0 = await contracts.dai.balanceOf(signer.address);

    // redeem
    await contracts.tribe.connect(signer).approve(contracts.tribeRedeemer.address, amount);
    await contracts.tribeRedeemer.connect(signer).redeem(signer.address, amount);

    const tribeBalance1 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance1 = await contracts.steth.balanceOf(signer.address);
    const daiBalance1 = await contracts.dai.balanceOf(signer.address);

    // check amount spent
    expect(tribeBalance0.sub(tribeBalance1)).to.be.equal(amount);
    // check amount received
    const stethReceived = stethBalance1.sub(stethBalance0);
    const daiReceived = daiBalance1.sub(daiBalance0);
    expect(stethReceived).to.be.equal('0'); // got rounded down to 0, no revert
    expect(daiReceived).to.be.equal('6'); // 6 DAI Wei
  });

  it('last redeemooor', async () => {
    const signer = await getImpersonatedSigner(addresses.core);
    await forceEth(signer.address);
    const redeemerSigner = await getImpersonatedSigner(contracts.tribeRedeemer.address);
    await forceEth(redeemerSigner.address);

    const redeemChunkSizeNumber = 50_000_000;
    const redeemChunkSize = ethers.constants.WeiPerEther.mul(redeemChunkSizeNumber);
    const lastRedeemSize = ethers.constants.WeiPerEther.mul(10_000);

    // Empty all redemption capacity, until 1000 TRIBE is left to redeem
    await contracts.tribe.connect(signer).approve(contracts.tribeRedeemer.address, ethers.constants.MaxUint256);
    let redeemBase = await contracts.tribeRedeemer.redeemBase();
    while (redeemBase / 1e18 > redeemChunkSizeNumber) {
      await contracts.tribeRedeemer.connect(signer).redeem(signer.address, redeemChunkSize);
      await contracts.tribe.connect(redeemerSigner).transfer(signer.address, redeemChunkSize);
      redeemBase = await contracts.tribeRedeemer.redeemBase();
    }
    await contracts.tribeRedeemer
      .connect(signer)
      .redeem(signer.address, (await contracts.tribeRedeemer.redeemBase()).sub(lastRedeemSize));

    const tribeBalance0 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance0 = await contracts.steth.balanceOf(signer.address);
    const daiBalance0 = await contracts.dai.balanceOf(signer.address);

    // last redeem
    await contracts.tribeRedeemer.connect(signer).redeem(signer.address, lastRedeemSize);

    const tribeBalance1 = await contracts.tribe.balanceOf(signer.address);
    const stethBalance1 = await contracts.steth.balanceOf(signer.address);
    const daiBalance1 = await contracts.dai.balanceOf(signer.address);

    // check amount spent
    expect(tribeBalance0.sub(tribeBalance1)).to.be.equal(lastRedeemSize);
    // check amount received
    const stethReceived = stethBalance1.sub(stethBalance0);
    const daiReceived = daiBalance1.sub(daiBalance0);
    expect(stethReceived).to.be.at.least(ethers.constants.WeiPerEther.mul(109).div(100)); // [1.09, 1.12] stETH
    expect(stethReceived).to.be.at.most(ethers.constants.WeiPerEther.mul(112).div(100)); // [1.09, 1.12] stETH
    expect(daiReceived).to.be.at.least(ethers.constants.WeiPerEther.mul(660));
    expect(daiReceived).to.be.at.most(ethers.constants.WeiPerEther.mul(670));

    // balance after all redeems
    expect(await contracts.steth.balanceOf(contracts.tribeRedeemer.address)).to.be.at.most('1');
    expect(await contracts.lqty.balanceOf(contracts.tribeRedeemer.address)).to.be.at.most('1');
    expect(await contracts.fox.balanceOf(contracts.tribeRedeemer.address)).to.be.at.most('1');
    expect(await contracts.dai.balanceOf(contracts.tribeRedeemer.address)).to.be.at.most('1');

    // redeem after all tokens have expired
    // reverted with panic code 0x12 (Division or modulo division by zero)
    await expectRevert(contracts.tribeRedeemer.connect(signer).redeem(signer.address, 1000), '0x12');
  });
});
