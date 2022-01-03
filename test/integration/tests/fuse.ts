import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '../setup/utils';

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

  describe('D3 Fuse Plugin', function () {
    it('deposit, claim, then withdraw', async function () {
      const comptroller = await ethers.getContractAt('Unitroller', contractAddresses.rariPool8Comptroller);

      const fD3 = await ethers.getContractAt(
        'CErc20Delegator',
        await comptroller.cTokensByUnderlying(contractAddresses.curveD3pool)
      );

      const d3Whale = '0x16c2bee6f55dab7f494dba643ff52ef2d47fba36';

      await forceEth(d3Whale);

      const d3 = await ethers.getContractAt('IERC20', contractAddresses.curveD3pool);

      const signer = await getImpersonatedSigner(deployAddress);

      doLogging && console.log('Seeding d3');
      await d3
        .connect(await getImpersonatedSigner(d3Whale))
        .transfer(deployAddress, ethers.constants.WeiPerEther.mul(1_000_000));

      doLogging && console.log('Approving d3');
      await d3.connect(signer).approve(fD3.address, ethers.constants.MaxUint256);

      doLogging && console.log('Minting fD3');
      await fD3.connect(signer).mint(ethers.constants.WeiPerEther.mul(1_000_000));

      // TODO add address to mainnet addresses config
      const plugin = '0x5fc748f1FEb28d7b76fa1c6B07D8ba2d5535177c';
      expect(await contracts.convexD3poolRewards.balanceOf(plugin)).to.be.equal(
        ethers.constants.WeiPerEther.mul(1_000_000)
      );
      expect(await fD3.balanceOfUnderlying(deployAddress)).to.be.equal(ethers.constants.WeiPerEther.mul(1_000_000));

      doLogging && console.log('Redeeming Underlying');
      await fD3.connect(signer).redeemUnderlying(ethers.constants.WeiPerEther.mul(1_000_000));

      expect(await contracts.convexD3poolRewards.balanceOf(plugin)).to.be.equal(0);
      expect(await fD3.balanceOfUnderlying(deployAddress)).to.be.equal(0);

      doLogging && console.log('Notifying rewards');

      const operator = await getImpersonatedSigner(await contracts.convexD3poolRewards.operator());
      await forceEth(await operator.getAddress());
      await time.increaseTo(await contracts.convexD3poolRewards.periodFinish());

      await contracts.convexD3poolRewards
        .connect(operator)
        .queueNewRewards(ethers.constants.WeiPerEther.mul(10_000_000));

      doLogging && console.log('Claiming rewards');

      // Note this is not the right interface but it has the desired function
      const rewards = await ethers.getContractAt('ConvexPCVDeposit', plugin);
      await rewards.claimRewards();

      expect(await contracts.crv.balanceOf(contractAddresses.feiDAOTimelock)).to.be.at.least(1);
      expect(await contracts.cvx.balanceOf(contractAddresses.feiDAOTimelock)).to.be.at.least(1);
    });
  });
});
