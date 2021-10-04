import '@nomiclabs/hardhat-ethers';
import hre, { ethers } from 'hardhat';
import {
  SetupUpgradeFunc,
  ValidateUpgradeFunc,
  RunUpgradeFunc,
  TeardownUpgradeFunc
} from '@custom-types/types';

import chai, { expect } from 'chai';
import CBN from 'chai-bn';

const toBN = ethers.BigNumber.from;

before(() => {
  chai.use(CBN(ethers.BigNumber));
});

/*

V2 Phase 1 Upgrade Steps

Part 1 - Deploys the PCV deposits we have to swap out, the new ETH bonding curve, and the ratio PCV controller.
         Grants minter roles to the pcv deposits & the bonding curve, and pcv controller role to the ratio pcv controller.
         Sets bonding curve minting cap maximum for eth bonding curve, and updates the dpi bonding curve allocation. Finally,
         moves pcv from the old eth & dpi uni pcv deposits into the new ones.

Part 2 - Deploys all of the PCV deposit wrappers needed for the collateralization oracle, deploys the constant oracles used
         for FEI & USD, and deploys the collateralization oracle (along proxy-impl, and proxy-base) contracts.

Part 3 - Deploys collateralization oracle keeper, collateralization oracle guardian, chainlink oracle wrapper for tribe-eth, chainlink composite oracle for tribe-usd, tribe reserve stabilizer, 
         tribe splitter, pcv equity minter, and the balancer-v2 liquidity bootstrapping pool (and associated swapper). Grants
         burner role[remove] to the tribe reserve stabilizer, and minter roles to the pvc equity minter & collateralization oracle keeper.
         Also grants tribe-minter role to the tribe reserve stabilizer, and seeds tribe to the liquidity bootstrapping pool swapper.

        // todo: move pcv-transfer to p1
        // todo: pr to change ALL reserve stabilizers to transfer to dumpster contract (make this too) which actually burns it
        // todo: move keeper deployment to p3
        // todo: deploy collateralization-oracle guardian in p3
        // todo: add oracle-admin-role-grant to collateralizationoracle guardian

----- PART 1 -----

DEPLOY ACTIONS:
1. ETH Uni PCV Deposit
2. DPI Uni PCV Deposit
3. ETH Bonding Curve
4. Ratio PCV Controller

DAO ACTIONS:
1. Grant Minter role to new ETH BondingCurve
2. Grant Minter role to new ETH Uni PCV Deposit
3. Grant Minter role to new DPI Uni PCV Deposit
4. Grant PCV Controller role to new RatioPCVController
5. Set ETH Bonding Curve Minting Cap Max
6. Update DPI Bonding Curve allocation
7. Move PCV from old ETH Uni PCV Deposit to new
8. Move PCV from old DPI Uni PCV Deposit to new

----- PART 2 -----

DEPLOY ACTIONS:
1. Static Pcv Deposit Wrapper
2. Eth Reserve Stabilizer Wrapper
3. Dai bonding curve wrapper
4. Rai bonding curve wrapper
5. Dpi bonding curve wrapper
6. Eth Lido PCV Deposit Wrapper
7. Cream Fei PCV Deposit Wrapper
8. Compound dai PCV Deposit Wrapper
9. Compound Eth PCV Deposit Wrapper
10. Aave Rai PCV Deposit Wrapper
11. Aave Eth PCV Deposit Wrapper
12. Rari Pool 9 Rai PCV Deposit Wrapper
13. Rari Pool 19 Dpi PCV Deposit Wrapper
14. Rari Pool 8 Fei PCV Deposit Wrapper
15. Rari Pool 9 Fei PCV Deposit Wrapper
16. Rari Pool 7 Fei PCV Deposit Wrapper
17. Rari Pool 6 Fei PCV Deposit Wrapper
18. Rari Pool 19 Fei PCV Deposit Wrapper
19. Rari Pool 24 Fei PCV Deposit Wrapper
20. Rari Pool 25 Fei PCV Deposit Wrapper
21. Rari Pool 26 Fei PCV Deposit Wrapper
22. Rari Pool 27 Fei PCV Deposit Wrapper
23. Rari Pool 18 Fei PCV Deposit Wrapper
24. Zero Constant Oracle
25. One Constant Oracle
26. Collateralization Ratio Oracle
27. Collateralization Ratio Oracle Wrapper Implementation
28. Collateralization Ratio Oracle Wrapper Proxy


DAO ACTIONS:
(no actions by the dao)

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
    dpiUniswapPCVDeposit,
    uniswapPCVDeposit,
    bondingCurve,
    dpiBondingCurve,
    tribeReserveStabilizer,
    ratioPCVController,
    feiTribeLBPSwapper,
    core,
    tribe
  } = contracts;

  const oldRatioPCVController = oldContracts.ratioPCVController;

  // special role
  // check via tribe contract
  logging && console.log('Transferring TRIBE Minter role to TribeReserveStabilizer');

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });

  const timelockSigner = await ethers.getSigner(timelockAddress);

  await tribe.connect(timelockSigner).setMinter(tribeReserveStabilizer.address);

  logging && console.log('Setting mint cap.');
  await bondingCurve.setMintCap(ethers.constants.MaxUint256);

  logging && console.log(`Withdrawing ratio from old uniswap pcv deposit to new.`);
  await oldRatioPCVController.withdrawRatio(oldContracts.uniswapPCVDeposit.address, uniswapPCVDeposit.address, '10000'); // move 100% of PCV from old -> new

  await ratioPCVController.withdrawRatio(
    oldContracts.dpiUniswapPCVDeposit.address,
    dpiUniswapPCVDeposit.address,
    '10000'
  ); // move 100% of PCV from old -> new

  logging && console.log(`Allocating Tribe...`);
  await core.allocateTribe(feiTribeLBPSwapper.address, toBN('1000000').mul(ethers.constants.WeiPerEther));

  logging && console.log(`Setting allocation...`);
  await dpiBondingCurve.setAllocation([dpiUniswapPCVDeposit.address, rariPool19DpiPCVDepositAddress], ['9000', '1000']);
};

/// /  --------------------- NOT RUN ON CHAIN ----------------------
/* 
 revoke minter from old bonding curve, eth uni pcv deposit, dpi pcv deposit, uni pcv controller
 revoke pcv controller from uni pcv controller, ratioPCVController
 deposit eth and dpi Uni PCV deposits
*/
export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const core = contracts.core;
  const { uniswapPCVController } = addresses;
  const { uniswapPCVDeposit, dpiUniswapPCVDeposit, ratioPCVController, bondingCurve } = oldContracts;

  // Revoke controller permissions
  await core.revokeMinter(uniswapPCVController);
  await core.revokeMinter(uniswapPCVDeposit.address);
  await core.revokeMinter(dpiUniswapPCVDeposit.address);
  await core.revokeMinter(bondingCurve.address);

  await core.revokePCVController(ratioPCVController.address);
  await core.revokePCVController(uniswapPCVController);

  // Deposit Uni and DPI
  await contracts.dpiUniswapPCVDeposit.deposit();
  await contracts.uniswapPCVDeposit.deposit();
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
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

  const updateTx = await collateralizationOracleWrapper.update();

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