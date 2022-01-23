import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = '73';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const erc20wrapperFactory = await ethers.getContractFactory('ERC20PCVDepositWrapper');
  const wethDepositWrapper = await erc20wrapperFactory.deploy(addresses.feiDAOTimelock, addresses.weth, false);
  await wethDepositWrapper.deployed();
  logging && console.log('WETH PCV deposit wrapper deployed to: ', wethDepositWrapper.address);
  const dpiDepositWrapper = await erc20wrapperFactory.deploy(addresses.feiDAOTimelock, addresses.dpi, false);
  await dpiDepositWrapper.deployed();
  logging && console.log('DAI PCV deposit wrapper deployed to: ', dpiDepositWrapper.address);
  const raiDepositWrapper = await erc20wrapperFactory.deploy(addresses.feiDAOTimelock, addresses.rai, false);
  await raiDepositWrapper.deployed();
  logging && console.log('RAI PCV deposit wrapper deployed to: ', raiDepositWrapper.address);
  const agEurDepositWrapper = await erc20wrapperFactory.deploy(addresses.feiDAOTimelock, addresses.agEUR, false);
  await agEurDepositWrapper.deployed();
  logging && console.log('agEUR PCV deposit wrapper deployed to: ', agEurDepositWrapper.address);

  return {
    wethDepositWrapper,
    dpiDepositWrapper,
    raiDepositWrapper,
    agEurDepositWrapper
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Initial condition checks
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.d3poolCurvePCVDeposit)).to.be.false;
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.d3poolConvexPCVDeposit)).to.be.false;
  expect(await contracts.core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), contracts.optimisticTimelock.address))
    .to.be.false;
  expect(await contracts.ethPSM.reservesThreshold()).to.be.equal(ethers.constants.WeiPerEther.mul('250'));
  expect(await contracts.core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), contracts.opsOptimisticTimelock.address)).to
    .be.false;
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.d3poolCurvePCVDeposit)).to.be.true;
  expect(await contracts.pcvGuardian.isSafeAddress(addresses.d3poolConvexPCVDeposit)).to.be.true;
  expect(await contracts.core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), contracts.optimisticTimelock.address))
    .to.be.true;
  expect(await contracts.ethPSM.reservesThreshold()).to.be.equal(ethers.constants.WeiPerEther.mul('5000'));
  expect(await contracts.collateralizationOracle.depositToToken(contracts.wethDepositWrapper.address)).to.be.equal(
    contracts.weth.address
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.dpiDepositWrapper.address)).to.be.equal(
    contracts.dpi.address
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.raiDepositWrapper.address)).to.be.equal(
    contracts.rai.address
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.agEurDepositWrapper.address)).to.be.equal(
    contracts.agEUR.address
  );
  expect(await contracts.core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), contracts.opsOptimisticTimelock.address)).to
    .be.true;
};

export { deploy, setup, teardown, validate };
