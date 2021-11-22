import {
  IBAMM,
  CErc20Delegator,
  IERC20,
  BAMMPlugin,
  Unitroller,
  IFuseAdmin,
  IRewardsDistributor
} from '@custom-types/contracts';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, increaseTime, resetFork } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe.only('e2e-fuse', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('Liquity Fuse Plugin', function () {
    beforeEach(async function () {
      const bamm: IBAMM = contracts.bamm as IBAMM;
      const stabilityPool = await bamm.SP();

      const spSigner = await getImpersonatedSigner(stabilityPool);

      const lusd: IERC20 = contracts.lusd as IERC20;
      await lusd
        .connect(spSigner)
        .transfer(contractAddresses.rariPool7LusdPCVDeposit, ethers.constants.WeiPerEther.mul(10_000_000));

      await contracts.rariPool7LusdPCVDeposit.deposit();
    });

    it('deposit, then withdraw under held balance', async function () {
      const fLUSD: CErc20Delegator = contracts.liquityFusePoolLusd as CErc20Delegator;
      const bammPlugin: BAMMPlugin = contracts.bammPlugin as BAMMPlugin;

      const bamm: IBAMM = contracts.bamm as IBAMM;
      const bammSupplyBefore = await bamm.totalSupply();

      const stabilityPool = await bamm.SP();
      const spContract = await ethers.getContractAt('IStabilityPool', stabilityPool);

      const bammLUSDBefore = await spContract.getCompoundedLUSDDeposit(bamm.address);

      const spSigner = await getImpersonatedSigner(stabilityPool);
      const lusd: IERC20 = contracts.lusd as IERC20;

      const signer = await getImpersonatedSigner(deployAddress);

      doLogging && console.log('Seeding LUSD');
      await lusd.connect(spSigner).transfer(deployAddress, ethers.constants.WeiPerEther.mul(10_000_000));

      doLogging && console.log('Approving LUSD');
      await lusd.connect(signer).approve(fLUSD.address, ethers.constants.MaxUint256);

      doLogging && console.log('Minting fLUSD');
      await fLUSD.connect(signer).mint(ethers.constants.WeiPerEther.mul(10_000_000));

      const bammSupplyAfter = await bamm.totalSupply();
      expect(bammSupplyAfter).to.be.bignumber.greaterThan(bammSupplyBefore);
      expectApprox(await lusd.balanceOf(bammPlugin.address), ethers.constants.WeiPerEther.mul(200_000));
      expect(await spContract.getCompoundedLUSDDeposit(bamm.address)).to.be.bignumber.greaterThan(bammLUSDBefore);

      doLogging && console.log('Redeeming Underlying');
      await fLUSD.connect(signer).redeemUnderlying(ethers.constants.WeiPerEther.mul(100_000));

      expect(await bamm.totalSupply()).to.be.bignumber.equal(bammSupplyAfter);
      expectApprox(await lusd.balanceOf(bammPlugin.address), ethers.constants.WeiPerEther.mul(100_000));

      const distributor: IRewardsDistributor = contracts.liquityFusePoolRewardsDistributor as IRewardsDistributor;

      await increaseTime(100_000);
      doLogging && console.log('Claim');
      await bammPlugin.claim();
      await distributor.claimRewards(deployAddress);

      // TODO: figure out why all of these are 0
      console.log(await contracts.lqty.balanceOf(fLUSD.address));
      console.log(await contracts.lqty.balanceOf(bammPlugin.address));
      console.log(await contracts.lqty.balanceOf(deployAddress));
    });

    it('deposit, then withdraw over target', async function () {
      const fLUSD: CErc20Delegator = contracts.liquityFusePoolLusd as CErc20Delegator;
      const bammPlugin: BAMMPlugin = contracts.bammPlugin as BAMMPlugin;

      const bamm: IBAMM = contracts.bamm as IBAMM;
      const bammSupplyBefore = await bamm.totalSupply();

      const stabilityPool = await bamm.SP();
      const spContract = await ethers.getContractAt('IStabilityPool', stabilityPool);

      const bammLUSDBefore = await spContract.getCompoundedLUSDDeposit(bamm.address);

      const spSigner = await getImpersonatedSigner(stabilityPool);
      const lusd: IERC20 = contracts.lusd as IERC20;

      const signer = await getImpersonatedSigner(deployAddress);

      doLogging && console.log('Seeding LUSD');
      await lusd.connect(spSigner).transfer(deployAddress, ethers.constants.WeiPerEther.mul(10_000_000));

      doLogging && console.log('Approving LUSD');
      await lusd.connect(signer).approve(fLUSD.address, ethers.constants.MaxUint256);

      doLogging && console.log('Minting fLUSD');
      await fLUSD.connect(signer).mint(ethers.constants.WeiPerEther.mul(10_000_000));

      const bammSupplyAfter = await bamm.totalSupply();
      expect(bammSupplyAfter).to.be.bignumber.greaterThan(bammSupplyBefore);
      expectApprox(await lusd.balanceOf(bammPlugin.address), ethers.constants.WeiPerEther.mul(200_000));
      expect(await spContract.getCompoundedLUSDDeposit(bamm.address)).to.be.bignumber.greaterThan(bammLUSDBefore);

      doLogging && console.log('Redeeming Underlying');
      await fLUSD.connect(signer).redeemUnderlying(ethers.constants.WeiPerEther.mul(1_000_000));

      expect(await bamm.totalSupply()).to.be.bignumber.lessThan(bammSupplyAfter);
      expectApprox(await lusd.balanceOf(bammPlugin.address), toBN(0));
    });
  });
});
