import {
  AutoRewardsDistributor,
  IBAMM,
  ICLusdDelegate,
  IERC20,
  IFuseAdmin,
  TribalChief
} from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-fuse', function () {
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

  describe.only('CLusdDelegate', function () {
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
      const fLUSD: ICLusdDelegate = contracts.liquityFusePoolLusd as ICLusdDelegate;

      const bamm: IBAMM = contracts.bamm as IBAMM;
      const bammSupplyBefore = await bamm.totalSupply();

      const stabilityPool = await bamm.SP();
      const spContract = await ethers.getContractAt('IStabilityPool', stabilityPool);

      const bammLUSDBefore = await spContract.getCompoundedLUSDDeposit(bamm.address);

      const spSigner = await getImpersonatedSigner(stabilityPool);
      const lusd: IERC20 = contracts.lusd as IERC20;

      const signer = await getImpersonatedSigner(deployAddress);

      await lusd.connect(spSigner).transfer(deployAddress, ethers.constants.WeiPerEther.mul(10_000_000));

      await lusd.connect(signer).approve(fLUSD.address, ethers.constants.MaxUint256);

      await fLUSD.connect(signer).mint(ethers.constants.WeiPerEther.mul(10_000_000));

      const bammSupplyAfter = await bamm.totalSupply();
      expect(bammSupplyAfter).to.be.bignumber.greaterThan(bammSupplyBefore);
      expectApprox(await lusd.balanceOf(fLUSD.address), ethers.constants.WeiPerEther.mul(200_000));
      expect(await spContract.getCompoundedLUSDDeposit(bamm.address)).to.be.bignumber.greaterThan(bammLUSDBefore);

      await fLUSD.connect(signer).redeemUnderlying(ethers.constants.WeiPerEther.mul(100_000));

      expect(await bamm.totalSupply()).to.be.bignumber.equal(bammSupplyAfter);
      expectApprox(await lusd.balanceOf(fLUSD.address), ethers.constants.WeiPerEther.mul(100_000));
    });

    it('deposit, then withdraw over target', async function () {
      const fLUSD: ICLusdDelegate = contracts.liquityFusePoolLusd as ICLusdDelegate;

      const bamm: IBAMM = contracts.bamm as IBAMM;
      const bammSupplyBefore = await bamm.totalSupply();

      const stabilityPool = await bamm.SP();
      const spContract = await ethers.getContractAt('IStabilityPool', stabilityPool);

      const bammLUSDBefore = await spContract.getCompoundedLUSDDeposit(bamm.address);

      const spSigner = await getImpersonatedSigner(stabilityPool);
      const lusd: IERC20 = contracts.lusd as IERC20;

      const signer = await getImpersonatedSigner(deployAddress);

      await lusd.connect(spSigner).transfer(deployAddress, ethers.constants.WeiPerEther.mul(10_000_000));

      await lusd.connect(signer).approve(fLUSD.address, ethers.constants.MaxUint256);

      await fLUSD.connect(signer).mint(ethers.constants.WeiPerEther.mul(10_000_000));

      const bammSupplyAfter = await bamm.totalSupply();
      expect(bammSupplyAfter).to.be.bignumber.greaterThan(bammSupplyBefore);
      expectApprox(await lusd.balanceOf(fLUSD.address), ethers.constants.WeiPerEther.mul(200_000));
      expect(await spContract.getCompoundedLUSDDeposit(bamm.address)).to.be.bignumber.greaterThan(bammLUSDBefore);

      await fLUSD.connect(signer).redeemUnderlying(ethers.constants.WeiPerEther.mul(1_000_000));

      expect(await bamm.totalSupply()).to.be.bignumber.lessThan(bammSupplyAfter);
      expect(await lusd.balanceOf(fLUSD.address)).to.be.bignumber.equal(toBN(0));
    });

    it('update', async function () {
      // setup admin
      const admin: IFuseAdmin = contracts.rariFuseAdmin as IFuseAdmin;

      const signer = await getImpersonatedSigner(admin.address);
      await forceEth(admin.address);

      const bamm = contractAddresses.bamm;
      const swapper = contractAddresses.lusdSwapper;
      const buffer = ethers.constants.WeiPerEther.div(20); // 5% buffer
      const ethSwapMin = ethers.constants.WeiPerEther.div(10); // 0.1 ETH minimum swap

      // call _becomeImplementation to update initial state variables
      const fLUSD: ICLusdDelegate = contracts.liquityFusePoolLusd as ICLusdDelegate;
      await fLUSD.connect(signer)._becomeImplementation(
        await ethers.utils.defaultAbiCoder.encode(
          ['address', 'address', 'uint256', 'uint256', 'address'],
          [
            bamm,
            swapper,
            buffer,
            ethSwapMin,
            deployAddress // use deploy address as LQTY admin
          ]
        )
      );

      expect(await fLUSD.BAMM()).to.be.equal(bamm);
      expect(await fLUSD.lusdSwapper()).to.be.equal(swapper);
      expect(await fLUSD.lqty()).to.be.equal('0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D');
      expect(await fLUSD.stabilityPool()).to.be.equal('0x66017D22b0f8556afDd19FC67041899Eb65a21bb');

      expect(await fLUSD.buffer()).to.be.bignumber.equal(buffer);
      expect(await fLUSD.ethSwapMin()).to.be.bignumber.equal(ethSwapMin);
    });
  });
});
