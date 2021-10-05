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

V2 Phase 1 Upgrade

Part 3 - Deploys collateralization oracle keeper, collateralization oracle guardian, chainlink oracle wrapper for tribe-eth, chainlink composite oracle for tribe-usd, tribe reserve stabilizer, 
         tribe splitter, pcv equity minter, and the balancer-v2 liquidity bootstrapping pool (and associated swapper). Grants
         burner role[remove] to the tribe reserve stabilizer, and minter roles to the pvc equity minter & collateralization oracle keeper.
         Also grants tribe-minter role to the tribe reserve stabilizer, and seeds tribe to the liquidity bootstrapping pool swapper.

        // todo: move pcv-transfer to p1
        // todo: pr to change ALL reserve stabilizers to transfer to dumpster contract (make this too) which actually burns it
        // todo: move keeper deployment to p3
        // todo: deploy collateralization-oracle guardian in p3
        // todo: add oracle-admin-role-grant to collateralizationoracle guardian


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

    logging && console.log(`Withdrawing ratio from old dpi uniswap pcv deposit to new.`)
    
    await ratioPCVController.withdrawRatio(
        oldContracts.dpiUniswapPCVDeposit.address,
        dpiUniswapPCVDeposit.address,
        '10000'
    ); // move 100% of PCV from old -> new

    logging && console.log(`Allocating Tribe...`);
    await core.allocateTribe(feiTribeLBPSwapper.address, toBN('1000000').mul(ethers.constants.WeiPerEther));

    logging && console.log(`Setting allocation...`);
    await dpiBondingCurve.setAllocation([dpiUniswapPCVDeposit.address, rariPool19DpiPCVDepositAddress], ['9000', '1000']);
}

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
    const core = contracts.core;
    const { uniswapPCVController } = addresses;
    const { ratioPCVController } = oldContracts;
  
    await core.revokePCVController(ratioPCVController.address);
    await core.revokePCVController(uniswapPCVController);
    await core.revokeMinter(uniswapPCVController);
  
    // Deposit Uni and DPI
    await contracts.dpiUniswapPCVDeposit.deposit();
    await contracts.uniswapPCVDeposit.deposit();
}

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
}