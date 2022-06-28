import { ethers } from 'hardhat';
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
import { BigNumber } from 'ethers';

/*

Tribal Council proposal TIP_118

- Deploy ERC20Holding PCV Deposits for remaining PCV assets
- Deprecate LUSD, RAI and ETH PSMs
- Pause PCV Drip Controllers

*/

const toBN = BigNumber.from;

const fipNumber = 'tip_118';

let initialDAIPSMFeiBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ////// Deploy empty PCV deposits for remaining PCV assets
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
  initialDAIPSMFeiBalance = await contracts.fei.balanceOf(addresses.daiFixedPricePSM);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  ////////// Validate empty PCV deposit deployments
  const core = contracts.core;
  const ethPSM = contracts.ethPSM;
  const lusdPSM = contracts.lusdPSM;
  const raiPSM = contracts.raiPriceBoundPSM;

  const fei = contracts.fei;
  const lusd = contracts.lusd;
  const weth = contracts.weth;

  const wethHoldingDeposit = contracts.wethHoldingDeposit;
  const lusdHoldingDeposit = contracts.lusdHoldingDeposit;
  const voltHoldingDeposit = contracts.voltHoldingDeposit;
  const daiHoldingDeposit = contracts.daiHoldingDeposit;

  const pcvGuardian = contracts.pcvGuardianNew;

  const EXPECTED_WETH_TRANSFER = toBN('23129630802267046361289');
  const EXPECTED_LUSD_TRANSFER = toBN('17765325999630072368537481');
  const SANITY_CHECK_DAI_TRANSFER = ethers.constants.WeiPerEther.mul(2_000_000);

  // 1. Validate all holding PCV Deposits configured correctly
  expect(await wethHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.weth);
  expect(await lusdHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.lusd);
  expect(await voltHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.volt);
  expect(await daiHoldingDeposit.balanceReportedIn()).to.be.equal(addresses.dai);

  // 2. Validate can drop funds on a PCV Deposit and then withdraw with the guardian
  const wethWhale = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  await forceEth(wethWhale);
  const wethWhaleSigner = await getImpersonatedSigner(wethWhale);

  // Transfer to the holding PCV deposit. Validate that the balance reads correctly, then withdraw
  const initialWethDepositBalance = await wethHoldingDeposit.balance();
  const transferAmount = ethers.constants.WeiPerEther.mul(100);
  await contracts.weth.connect(wethWhaleSigner).transfer(wethHoldingDeposit.address, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(transferAmount.add(initialWethDepositBalance));
  expect(await contracts.weth.balanceOf(wethHoldingDeposit.address)).to.be.equal(
    transferAmount.add(initialWethDepositBalance)
  );

  const resistantBalanceAndFei = await wethHoldingDeposit.resistantBalanceAndFei();
  expect(resistantBalanceAndFei[0]).to.be.equal(transferAmount.add(initialWethDepositBalance));
  expect(resistantBalanceAndFei[1]).to.be.equal(0);

  // Withdraw ERC20
  const receiver = '0xFc312F21E1D56D8dab5475FB5aaEFfB18B892a85';
  const guardianSigner = await getImpersonatedSigner(addresses.pcvGuardianNew);
  await forceEth(addresses.pcvGuardianNew);
  await wethHoldingDeposit.connect(guardianSigner).withdrawERC20(addresses.weth, receiver, transferAmount);

  expect(await wethHoldingDeposit.balance()).to.be.equal(initialWethDepositBalance);
  expect(await contracts.weth.balanceOf(receiver)).to.be.equal(transferAmount);

  // 3. Validate deprecated PSMs have no assets
  expect(await fei.balanceOf(ethPSM.address)).to.be.equal(0);
  expect(await weth.balanceOf(ethPSM.address)).to.be.equal(0);

  expect(await fei.balanceOf(lusdPSM.address)).to.be.equal(0);
  expect(await lusd.balanceOf(lusdPSM.address)).to.be.equal(0);

  // 4. Validate transferred assets were received

  // These deposits started off empty
  // Minting currently enabled on ETH PSM, so WETH balance may increase
  expect(await weth.balanceOf(wethHoldingDeposit.address)).to.be.at.least(EXPECTED_WETH_TRANSFER);
  expect(await lusd.balanceOf(lusdHoldingDeposit.address)).to.be.equal(EXPECTED_LUSD_TRANSFER);

  // 5. Validate deprecated PSMs have no MINTER_ROLE
  const MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
  expect(await core.hasRole(MINTER_ROLE, addresses.ethPSM)).to.be.false;
  expect(await core.hasRole(MINTER_ROLE, addresses.raiPriceBoundPSM)).to.be.false;
  expect(await core.hasRole(MINTER_ROLE, addresses.lusdPSM)).to.be.false;

  // 6. Validate deprecated PSMs fully paused
  expect(await ethPSM.redeemPaused()).to.be.true;
  expect(await ethPSM.paused()).to.be.true;

  expect(await lusdPSM.redeemPaused()).to.be.true;
  expect(await lusdPSM.paused()).to.be.true;

  expect(await raiPSM.redeemPaused()).to.be.true;
  expect(await raiPSM.mintPaused()).to.be.true;
  expect(await raiPSM.paused()).to.be.true;

  // 7. Validate PSMs are no longer safe addresses
  expect(await pcvGuardian.isSafeAddress(ethPSM.address)).to.be.false;
  expect(await pcvGuardian.isSafeAddress(lusdPSM.address)).to.be.false;
  expect(await pcvGuardian.isSafeAddress(raiPSM.address)).to.be.false;

  // 8. New ERC20 holding deposits are safe addresses
  expect(await pcvGuardian.isSafeAddress(wethHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(lusdHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(voltHoldingDeposit.address)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(daiHoldingDeposit.address)).to.be.true;

  // 9. Skimmers are deprecated - paused and do not have PCV_CONTROLLER_ROLE
  const PCV_CONTROLLER_ROLE = ethers.utils.id('PCV_CONTROLLER_ROLE');
  expect(await contracts.ethPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.ethPSMFeiSkimmer)).to.be.false;

  expect(await contracts.lusdPSMFeiSkimmer.paused()).to.be.true;
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.lusdPSMFeiSkimmer)).to.be.false;

  // 10. daiFixedPricePSMFeiSkimmer granted PCV_CONTROLLER_ROLE and burns Fei
  expect(await core.hasRole(PCV_CONTROLLER_ROLE, addresses.daiFixedPricePSMFeiSkimmer)).to.be.true;
  expect(await fei.balanceOf(addresses.daiFixedPricePSM)).to.be.equal(ethers.constants.WeiPerEther.mul(20_000_000));
};

export { deploy, setup, teardown, validate };
