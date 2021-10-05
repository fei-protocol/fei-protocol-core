import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
import '@nomiclabs/hardhat-ethers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import hre, { ethers } from 'hardhat';

const toBN = ethers.BigNumber.from;

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

/*

V2 Phase 1 Upgrade

Part 3 - Deploys collateralization oracle keeper, collateralization oracle guardian, chainlink oracle wrapper for tribe-eth, chainlink composite oracle for tribe-usd, tribe reserve stabilizer, 
         tribe splitter, pcv equity minter, and the balancer-v2 liquidity bootstrapping pool (and associated swapper). Grants
         burner role[remove] to the tribe reserve stabilizer, and minter roles to the pvc equity minter & collateralization oracle keeper.
         Also grants tribe-minter role to the tribe reserve stabilizer, and seeds tribe to the liquidity bootstrapping pool swapper.

----- PART 3 -----

DEPLOY ACTIONS:
1. Collateralization Ratio Oracle Keeer
2. Collateralization Oracle Guardian
3. Chainlink Tribe ETH Oracle Wrapper
4. Chainlink Tribe USD Composite Oracle
5. Tribe Reserve Stabilizer
6. Tribe Splitter
7. Fei Tribe LBP Swapper
8. Fei Tribe LBP (Liquidity Bootstrapping Pool)
9. PCV Equity Minter

DAO ACTIONS:
1. Grant Burner role to new TribeReserveStabilizer
2. Grant Minter role to PCV Equity Minter
3. Grant Minter role to Collateralization Oracle Keeper
4. Grant Tribe Minter role to Tribe Reserve Stabilizer
5. Grant Oracle Admin role to Collateralization Oracle Guardian
6. Seed TRIBE to LBP Swapper

*/

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { timelock } = addresses;

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelock]
  });
};

export const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const { timelock: timelockAddress, rariPool19DpiPCVDeposit: rariPool19DpiPCVDepositAddress } = addresses;

  const {
    tribeReserveStabilizer,
    feiTribeLBPSwapper,
    core,
    tribe
  } = contracts;

  // special role
  // check via tribe contract
  logging && console.log('Transferring TRIBE Minter role to TribeReserveStabilizer');

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  await tribe.setMinter(tribeReserveStabilizer.address);

  logging && console.log(`Allocating Tribe...`);
  await core.allocateTribe(feiTribeLBPSwapper.address, toBN('1000000').mul(ethers.constants.WeiPerEther));
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  logging && console.log(`Nothing to run in teardown function for v2Phase1 part 3.`);
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  const { dai: daiAddress, dpi: dpiAddress, rai: raiAddress, fei: feiAddress, weth: wethAddress } = addresses;
  const {
    collateralizationOracle,
    collateralizationOracleWrapperImpl,
    collateralizationOracleWrapper,
    core,
    proxyAdmin,
    feiTribeLBPSwapper
  } = contracts;

  const pcvStatsCurrent = await collateralizationOracleWrapper.pcvStatsCurrent();
  const pcvStats = await collateralizationOracle.pcvStats();

  expect(pcvStatsCurrent[0].toString()).to.be.equal(pcvStats[0].toString());
  expect(pcvStatsCurrent[1].toString()).to.be.equal(pcvStats[1].toString());
  expect(pcvStatsCurrent[2].toString()).to.be.equal(pcvStats[2].toString());
  expect(pcvStatsCurrent[3].toString()).to.be.equal(pcvStats[3].toString());

  await collateralizationOracleWrapper.update();

  expect((await collateralizationOracle.getTokensInPcv()).length).to.be.equal(6);
  expect((await collateralizationOracle.getDepositsForToken(daiAddress)).length).to.be.equal(2);
  expect((await collateralizationOracle.getDepositsForToken(dpiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(raiAddress)).length).to.be.equal(3);
  expect((await collateralizationOracle.getDepositsForToken(wethAddress)).length).to.be.equal(6);
  expect((await collateralizationOracle.getDepositsForToken(feiAddress)).length).to.be.equal(11);

  expect(await feiTribeLBPSwapper.CONTRACT_ADMIN_ROLE()).to.be.not.equal(await core.GOVERN_ROLE());

  expect(await proxyAdmin.getProxyImplementation(collateralizationOracleWrapper.address)).to.be.equal(
    collateralizationOracleWrapperImpl.address
  );

  expect(await proxyAdmin.getProxyAdmin(collateralizationOracleWrapper.address)).to.be.equal(proxyAdmin.address);
};
