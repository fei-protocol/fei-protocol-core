import {
  AavePCVDeposit,
  PegStabilityModule,
  Fei,
  IERC20,
  PCVDripController,
  PSMRouter,
  WETH9
} from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, expectRevert, getImpersonatedSigner, increaseTime, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '../setup/utils';
import { contract } from '@openzeppelin/test-environment';
import { time, overwriteChainlinkAggregator } from '@test/helpers';

const oneEth = ethers.constants.WeiPerEther;

describe('Backup Oracles', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: SignerWithAddress;
  let guardian: SignerWithAddress;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let ethPSM: PegStabilityModule;
  let ethPSMRouter: PSMRouter;
  let weth: WETH9;
  let aWeth: IERC20;
  let fei: Fei;
  let dripper: PCVDripController;
  let aaveEthPCVDeposit: AavePCVDeposit;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0];
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress.address,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
    ethPSM = contracts.ethPSM as PegStabilityModule;
    ethPSMRouter = contracts.ethPSMRouter as PSMRouter;
    aaveEthPCVDeposit = contracts.aaveEthPCVDeposit as AavePCVDeposit;
    aWeth = contracts.aWETH as IERC20;

    weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
  });

  before(async function () {
    // Make PSM fully online
    const redeemPaused = await contracts.ethPSM.redeemPaused();
    if (redeemPaused) {
      await contracts.ethPSM.unpauseRedeem();
    }
    const paused = await contracts.ethPSM.paused();
    if (paused) {
      await contracts.ethPSM.unpause();
    }
  });

  it('should switch to the backup oracle', async () => {});

  it('should read reasonable Uniswap V3 TWAP oracle price', async () => {});

  it('should read Uniswap V3 TWAP oracle price comparable to primary oracle price', async () => {});
});
