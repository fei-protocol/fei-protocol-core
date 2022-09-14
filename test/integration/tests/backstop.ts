import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { overwriteChainlinkAggregator, time } from '@test/helpers';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

const toBN = ethers.BigNumber.from;

describe.only('e2e-backstop', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const tenPow18 = ethers.constants.WeiPerEther;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

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

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('TribeMinter', async function () {
    it('mint TRIBE', async function () {
      const { tribeMinter, tribe } = contracts;
      const tribeSupply = await tribe.totalSupply();
      const balanceBefore = await tribe.balanceOf(deployAddress);

      await tribeMinter.mint(deployAddress, '100000');

      // Minting increases total supply and target balance
      expect(balanceBefore.add(toBN('100000'))).to.be.equal(await tribe.balanceOf(deployAddress));
      expect(tribeSupply.add(toBN('100000'))).to.be.equal(await tribe.totalSupply());
    });
  });
  describe('TribeReserveStabilizer', async function () {
    it('exchangeFei', async function () {
      const { fei, tribe, tribeReserveStabilizer, collateralizationOracle } = contracts;

      // set Chainlink ETHUSD to a fixed 4,000$ value
      await overwriteChainlinkAggregator(contractAddresses.chainlinkEthUsdOracle, '400000000000', '8');

      await fei.mint(deployAddress, tenPow18.mul(tenPow18).mul(toBN(4)));
      await collateralizationOracle.update();

      const userFeiBalanceBefore = toBN(await fei.balanceOf(deployAddress));
      const userTribeBalanceBefore = await tribe.balanceOf(deployAddress);

      const feiTokensExchange = toBN(40000000000000);
      await fei.approve(tribeReserveStabilizer.address, feiTokensExchange);

      await tribeReserveStabilizer.updateOracle();

      await tribeReserveStabilizer.startOracleDelayCountdown();
      await time.increase(await tribeReserveStabilizer.duration());

      await collateralizationOracle.update();

      const expectedAmountOut = await tribeReserveStabilizer.getAmountOut(feiTokensExchange);
      await tribeReserveStabilizer.exchangeFei(feiTokensExchange);

      const userFeiBalanceAfter = toBN(await fei.balanceOf(deployAddress));
      const userTribeBalanceAfter = await tribe.balanceOf(deployAddress);

      expect(userTribeBalanceAfter.sub(toBN(expectedAmountOut))).to.be.equal(userTribeBalanceBefore);
      expect(userFeiBalanceAfter.eq(userFeiBalanceBefore.sub(feiTokensExchange))).to.be.true;
    });
  });
});
