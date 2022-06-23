import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc,
  PcvStats
} from '@custom-types/types';
import { getImpersonatedSigner, overwriteChainlinkAggregator, time, expectRevert } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, Contract } from 'ethers';

let pcvStatsBefore: PcvStats;
let ethPrice8Decimals: string;

const fipNumber = 'cr_oracle_cleanup';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy composite VOLT*1 oracle
  // This is needed because the VOLT OraclePassthrough does not have a paused() method
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const voltOracle = await compositeOracleFactory.deploy(
    addresses.core,
    addresses.oneConstantOracle,
    addresses.voltOraclePassthrough,
    false
  );
  await voltOracle.deployed();
  logging && console.log(`voltOracle: ${voltOracle.address}`);

  ////// Deploy empty PCV deposits for remaining PCV assets
  // Deploy empty PCV deposits for ERC20 assets
  const ERC20HoldingPCVDepositFactory = await ethers.getContractFactory('ERC20HoldingPCVDeposit');
  const wethHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.weth);
  await wethHoldingDeposit.deployTransaction.wait();
  logging && console.log('WETH holding deposit deployed to: ', wethHoldingDeposit.address);

  const lusdHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.lusd);
  await lusdHoldingDeposit.deployTransaction.wait();
  logging && console.log('LUSD holding deposit deployed to: ', lusdHoldingDeposit.address);

  const voltHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.volt);
  await voltHoldingDeposit.deployTransaction.wait();
  logging && console.log('VOLT holding deposit deployed to: ', voltHoldingDeposit.address);

  const daiHoldingDeposit = await ERC20HoldingPCVDepositFactory.deploy(addresses.core, addresses.dai);
  await daiHoldingDeposit.deployTransaction.wait();
  logging && console.log('DAI holding deposit deployed to: ', daiHoldingDeposit.address);

  return {
    voltOracle,
    wethHoldingDeposit,
    lusdHoldingDeposit,
    voltHoldingDeposit,
    daiHoldingDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  ethPrice8Decimals = Math.round((await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10).toString();
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, ethPrice8Decimals, '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // impersonate the rollover signer, and make the Tokemak pool go to next cycle
  const TOKEMAK_MANAGER_ROLLOVER_ADDRESS = '0x90b6C61B102eA260131aB48377E143D6EB3A9d4B'; // has the rollover role
  const TOKEMAK_MANAGER_ADDRESS = '0xa86e412109f77c45a3bc1c5870b880492fb86a14'; // tokemak manager
  const IPFS_JSON_FILE_HASH = 'QmP4Vzg45jExr3mcNsx9xxV1fNft95uVzgZGeLtkBXgpkx';
  await forceEth(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
  const tokemakRolloverSigner: SignerWithAddress = await getImpersonatedSigner(TOKEMAK_MANAGER_ROLLOVER_ADDRESS);
  const tokemakManagerAbi: string[] = [
    'function nextCycleStartTime() view returns (uint256)',
    'function completeRollover(string calldata rewardsIpfsHash)'
  ];
  const tokemakManager: Contract = new ethers.Contract(
    TOKEMAK_MANAGER_ADDRESS,
    tokemakManagerAbi,
    tokemakRolloverSigner
  );
  const cycleEnd: BigNumber = await tokemakManager.nextCycleStartTime();
  await time.increaseTo(cycleEnd.add(1));
  await tokemakManager.completeRollover(IPFS_JSON_FILE_HASH);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', Number(pcvStatsBefore.protocolControlledValue) / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', Number(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', Number(pcvStatsBefore.protocolEquity) / 1e24);
  const pcvStatsAfter: PcvStats = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', Number(pcvStatsAfter.protocolControlledValue) / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', Number(pcvStatsAfter.userCirculatingFei) / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', Number(pcvStatsAfter.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff: BigNumber = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff: BigNumber = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff: BigNumber = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  // check the updated references
  expect(await contracts.pcvEquityMinter.collateralizationOracle()).to.be.equal(addresses.collateralizationOracle);
  expect(await contracts.tribeReserveStabilizer.collateralizationOracle()).to.be.equal(
    addresses.collateralizationOracle
  );

  // check the pcv equity minter value with new CR oracle
  // 65M$ equity at 20% APR is 250k$ per week
  const mintAmount: BigNumber = await contracts.pcvEquityMinter.mintAmount();
  expect(mintAmount).to.be.at.least(ethers.constants.WeiPerEther.mul('50000'));
  expect(mintAmount).to.be.at.most(ethers.constants.WeiPerEther.mul('500000'));

  // mock a very low ETH price to check activation of the TRIBE reserve stabilizer
  // 50$ / ETH
  expect(await contracts.tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.false;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '5000000000', '8');
  // also mock TRIBE price to be 0.125$ (it's a composite oracle between ETH/USD and TRIBE/ETH)
  await overwriteChainlinkAggregator(addresses.chainlinkTribeEthOracle, '2500000000000000', '18');
  expect(await contracts.tribeReserveStabilizer.isCollateralizationBelowThreshold()).to.be.true;
  expect(await contracts.tribeReserveStabilizer.isTimeStarted()).to.be.false;
  await contracts.tribeReserveStabilizer.startOracleDelayCountdown();
  await time.increase(await contracts.tribeReserveStabilizer.duration());

  const pcvStatsLowEth: PcvStats = await contracts.collateralizationOracle.pcvStats();
  expect(pcvStatsLowEth.protocolEquity).to.be.at.most('0');

  // check the pcv equity minter when FEI is undercollateralized
  await expectRevert(contracts.pcvEquityMinter.mintAmount(), 'PCVEquityMinter: Equity is nonpositive');

  // simulate a tribe reserve stabilizer trigger
  const amountFei: BigNumber = ethers.constants.WeiPerEther.mul('40000000'); // redeem 40M FEI
  const feiHolderSigner: SignerWithAddress = await getImpersonatedSigner(addresses.feiTribePair);
  await forceEth(addresses.feiTribePair);
  await contracts.fei.connect(feiHolderSigner).approve(addresses.tribeReserveStabilizer, amountFei);
  await contracts.tribeReserveStabilizer.connect(feiHolderSigner).exchangeFei(amountFei);

  // back in positive equity
  const pcvStatsLowEth2: PcvStats = await contracts.collateralizationOracle.pcvStats();
  expect(pcvStatsLowEth2.protocolEquity).to.be.at.least('0');

  // restore ETH price
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, ethPrice8Decimals, '8');

  // unpause pcv equity minter and mint a buyback cycle
  const daoSigner: SignerWithAddress = await getImpersonatedSigner(contracts.feiDAOTimelock.address);
  await forceEth(contracts.feiDAOTimelock.address);
  await contracts.pcvEquityMinter.connect(daoSigner).unpause();
  await contracts.pcvEquityMinter.mint(); // no revert = ok, auction started
  // fast-forward time so that e2e tests are not bricked
  await time.increase(await contracts.tribeReserveStabilizer.duration());
  await contracts.tribeReserveStabilizer.resetOracleDelayCountdown();

  //////  Ops optimistic timelock deprecation validation /////////
  expect(await contracts.core.hasRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.opsOptimisticTimelock)).to
    .be.false;
  expect(await contracts.core.hasRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.opsOptimisticTimelock))
    .to.be.false;
  expect(await contracts.core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.opsOptimisticTimelock)).to.be
    .false;

  ////////// Validate empty PCV deposit deployments

  const wethHoldingDeposit = contracts.wethHoldingDeposit;
  const lusdHoldingDeposit = contracts.lusdHoldingDeposit;
  const voltHoldingDeposit = contracts.voltHoldingDeposit;
  const daiHoldingDeposit = contracts.daiHoldingDeposit;

  // 1. Validate all holding PCV Deposits configured correctly
  expect(await wethHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.weth);
  expect(await lusdHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.lusd);
  expect(await voltHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.volt);
  expect(await daiHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.dai);

  // 2. Validate can drop funds on a PCV Deposit and then withdraw with the guardian
  const wethWhale = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  await forceEth(wethWhale);
  const wethWhaleSigner = await getImpersonatedSigner(wethWhale);

  // Transfer to the empty PCV deposit. Validate that the balance reads correctly, then withdraw
  const transferAmount = ethers.constants.WeiPerEther.mul(100);
  await contracts.weth.connect(wethWhaleSigner).transfer(wethHoldingDeposit.address, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(transferAmount);
  expect(await contracts.weth.balanceOf(wethHoldingDeposit.address)).to.be.equal(transferAmount);

  const resistantBalanceAndFei = await wethHoldingDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.equal(transferAmount);
  expect(resistantBalanceAndFei[1]).to.be.equal(0);

  // Withdraw ERC20
  const receiver = '0xFc312F21E1D56D8dab5475FB5aaEFfB18B892a85';
  const guardianSigner = await getImpersonatedSigner(addresses.pcvGuardianNew);
  await forceEth(addresses.pcvGuardianNew);
  await wethHoldingDeposit.connect(guardianSigner).withdrawERC20(addresses.weth, receiver, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(0);
  expect(await contracts.weth.balanceOf(receiver)).to.be.equal(transferAmount);
};

export { deploy, setup, teardown, validate };
