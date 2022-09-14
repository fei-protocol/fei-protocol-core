import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';

/*

TIP_121a(pt. 3): Technical cleanup, minor role revokation and La Tribu clawback

*/

// Minimum amount of FEI that should have been clawed back
const MIN_LA_TRIBU_FEI_RECOVERED = ethers.constants.WeiPerEther.mul(700_000);

// Minimum expected DAI to be gained from swapping LUSD on Curve
const MIN_DAI_GAIN_LUSD_SWAP = ethers.constants.WeiPerEther.mul(90_000);

// Deprecated Rari Infra FEI timelock, FEI available for release to DAO timelock
const MIN_RARI_FEI_TIMELOCK_RELEASE = '525023021308980213089802'; // ~500k

let initialPSMFeiBalance: BigNumber;
let initialTreasuryTribeBalance: BigNumber;
let initialDaiHoldingDepositBalance: BigNumber;

const fipNumber = 'tip_121a_cleanup';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialPSMFeiBalance = await contracts.fei.balanceOf(addresses.daiFixedPricePSM);
  initialTreasuryTribeBalance = await contracts.tribe.balanceOf(addresses.core);
  initialDaiHoldingDepositBalance = await contracts.dai.balanceOf(addresses.daiHoldingPCVDeposit);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. No verification of revoked Tribe roles - there are seperate e2e tests for that

  // 2. Clawback of La Tribu FEI and TRIBE timelocks worked
  // Verify no funds on timelocks
  expect(await contracts.fei.balanceOf(addresses.laTribuFeiTimelock)).to.equal(0);
  expect(await contracts.tribe.balanceOf(addresses.laTribuTribeTimelock)).to.equal(0);

  // Verify Core Treasury received TRIBE
  const daoTribeGain = (await contracts.tribe.balanceOf(addresses.core)).sub(initialTreasuryTribeBalance);
  expect(daoTribeGain).to.equal(ethers.constants.WeiPerEther.mul(1_000_000));

  // Verify FEI moved to DAI PSM
  const psmFeiBalanceDiff = (await contracts.fei.balanceOf(addresses.daiFixedPricePSM)).sub(initialPSMFeiBalance);
  console.log('FEI clawed back [M]: ', Number(psmFeiBalanceDiff) / 1e24);
  expect(psmFeiBalanceDiff).to.be.bignumber.greaterThan(MIN_LA_TRIBU_FEI_RECOVERED.add(MIN_RARI_FEI_TIMELOCK_RELEASE));

  // 3. Verify admin accepted on deprecated Rari timelocks
  expect(await contracts.rariInfraFeiTimelock.beneficiary()).to.equal(addresses.feiDAOTimelock);
  expect(await contracts.rariInfraTribeTimelock.beneficiary()).to.equal(addresses.feiDAOTimelock);

  // 4. Verify Aave/Compound PCV Sentinel guard removed
  expect(await contracts.pcvSentinel.isGuard(addresses.maxFeiWithdrawalGuard)).to.be.false;

  // 5. Sold last LUSD
  expect(await contracts.lusd.balanceOf(addresses.lusdHoldingPCVDeposit)).to.equal(0);

  const daiGain = (await contracts.dai.balanceOf(addresses.daiHoldingPCVDeposit)).sub(initialDaiHoldingDepositBalance);
  expect(daiGain).to.be.bignumber.greaterThan(MIN_DAI_GAIN_LUSD_SWAP);

  // 6. Verify ratioPCVControllerV2 has no FEI approval
  expect(await contracts.fei.allowance(addresses.feiDAOTimelock, addresses.ratioPCVControllerV2)).to.equal(0);
};

export { deploy, setup, teardown, validate };
