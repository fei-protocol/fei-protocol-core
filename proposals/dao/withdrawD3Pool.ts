import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const fipNumber = 'withdraw_from_d3Pool';

let convexResistantBalanceBefore: ethers.BigNumber;
let convexFeiBalanceBefore: ethers.BigNumber;
let curveResistantBalanceBefore: ethers.BigNumber;
let curveFeiBalanceBefore: ethers.BigNumber;
let daiInitialPSMFeiBalance: ethers.BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const skimThreshold = ethers.constants.WeiPerEther.mul(10_000_000);
  // 1. Deploy a Fei Skimmer for the DAI PSM
  const daiPSMFeiSkimmerFactory = await ethers.getContractFactory('FeiSkimmer');
  const daiPSMFeiSkimmer = await daiPSMFeiSkimmerFactory.deploy(
    addresses.core,
    addresses.daiFixedPricePSM,
    skimThreshold
  );
  await daiPSMFeiSkimmer.deployed();
  logging && console.log('DAI PSM Fei Skimmer deployed at', daiPSMFeiSkimmer.address);
  return {
    daiPSMFeiSkimmer
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const convexPCVDeposit = contracts.d3poolConvexPCVDeposit;
  const curvePCVdeposit = contracts.d3poolCurvePCVDeposit;
  const daiFixedPricePSM = contracts.daiFixedPricePSM;

  [convexResistantBalanceBefore, convexFeiBalanceBefore] = await convexPCVDeposit.resistantBalanceAndFei();
  [curveResistantBalanceBefore, curveFeiBalanceBefore] = await curvePCVdeposit.resistantBalanceAndFei();

  daiInitialPSMFeiBalance = await daiFixedPricePSM.feiBalance();
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const convexPCVDeposit = contracts.d3poolConvexPCVDeposit;
  const curvePCVDeposit = contracts.d3poolCurvePCVDeposit;
  const core = contracts.core;
  const daiPSMFeiSkimmer = contracts.daiPSMFeiSkimmer;

  const feiWithdrawAmount = ethers.constants.WeiPerEther.mul(10_000_000);

  // 1. Validate DAI PSM FEI skimmer
  expect(await daiPSMFeiSkimmer.threshold()).to.be.equal(feiWithdrawAmount);
  expect(await daiPSMFeiSkimmer.source()).to.be.equal(addresses.daiFixedPricePSM);
  // TODO: Need DAO vote to give out PCV_CONTROLLER role
  // expect(await core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), daiPSMFeiSkimmer.address)).to.be.true;

  // 2. Validate withdraw convexPCVDeposit
  const [convexResistantBalanceAfter, convexFeiBalanceAfter] = await convexPCVDeposit.resistantBalanceAndFei();
  const [curveResistantBalanceAfter, curveFeiBalanceAfter] = await curvePCVDeposit.resistantBalanceAndFei();

  console.log(
    convexResistantBalanceBefore.toString(),
    convexResistantBalanceAfter.toString(),
    convexFeiBalanceBefore.toString(),
    convexFeiBalanceAfter.toString()
  );

  // 3. Validate withdraw of Fei from D3 Pool
  const daiPSMFeiBalance = await daiPSMFeiSkimmer.feiBalance();
  expect(daiPSMFeiBalance).to.be.equal(daiInitialPSMFeiBalance.add(feiWithdrawAmount));
};

export { deploy, setup, teardown, validate };
