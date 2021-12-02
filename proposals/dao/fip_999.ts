import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';
import { expectApprox, getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  if (!addresses.core) {
    console.log(`core: ${addresses.core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create Chainlink Oracle Wrapper for BAL/USD feed
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkBalEthOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    addresses.chainlinkBalEthOracle
  );
  await chainlinkBalEthOracleWrapper.deployTransaction.wait();

  logging && console.log('Chainlink BALETH Oracle Wrapper:', chainlinkBalEthOracleWrapper.address);

  // Create a composite oracle from BAL/ETH and ETH/USD to get BAL/USD
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const compositeOracleBalUsd = await compositeOracleFactory.deploy(
    addresses.core,
    chainlinkBalEthOracleWrapper.address,
    addresses.chainlinkEthUsdOracleWrapper
  );
  await compositeOracleBalUsd.deployTransaction.wait();

  logging && console.log('Chainlink BALUSD Composite Oracle Wrapper:', compositeOracleBalUsd.address);

  // Create a new Balancer deposit for the BAL/WETH pool
  const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
  const balancerDepositBalWeth = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
    '300', // max 3% slippage
    '0xba100000625a3754423978a60c9317c58a424e3D', // BAL token
    [compositeOracleBalUsd.address, addresses.chainlinkEthUsdOracleWrapper]
  );
  await balancerDepositBalWeth.deployTransaction.wait();

  logging && console.log('Balancer BAL/WETH deposit:', balancerDepositBalWeth.address);

  // Create a new Balancer deposit for the wstETH/WETH pool
  const balancerDepositStablePoolFactory = await ethers.getContractFactory('BalancerPCVDepositStablePool');
  const balancerDepositWstethWeth = await balancerDepositStablePoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080', // poolId
    '10000', // max 100% slippage
    addresses.weth // WETH token
  );
  await balancerDepositWstethWeth.deployTransaction.wait();

  logging && console.log('Balancer wstETH/WETH deposit:', balancerDepositWstethWeth.address);

  // Create a new wstETH deposit for stETH wrap/unwrap
  const wstEthLidoPCVDepositFactory = await ethers.getContractFactory('WstEthLidoPCVDeposit');
  const wstEthLidoPCVDeposit = await wstEthLidoPCVDepositFactory.deploy(
    addresses.core,
    addresses.steth,
    addresses.wsteth
  );
  await wstEthLidoPCVDeposit.deployTransaction.wait();

  logging && console.log('Balancer wstETH/WETH deposit:', balancerDepositWstethWeth.address);

  return {
    chainlinkBalEthOracleWrapper,
    compositeOracleBalUsd,
    wstEthLidoPCVDeposit,
    balancerDepositWstethWeth,
    balancerDepositBalWeth
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-999');

  const signer = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await forceEth(addresses.feiDAOTimelock);

  console.log('1. Withdraw 230 WETH from Aave to the BAL/WETH PCVDeposit');
  await contracts.aaveEthPCVDeposit.connect(signer).withdraw(addresses.balancerDepositBalWeth, '230000000000000000000');
  console.log('2. Move 200k BAL from Timelock to the deposit');
  await contracts.bal.connect(signer).transfer(addresses.balancerDepositBalWeth, '200000000000000000000000');
  console.log('3. Deposit BAL and WETH in the Balancer pool');
  await contracts.balancerDepositBalWeth.connect(signer).deposit();
  console.log('4. Set BAL oracle in CR oracle');
  await contracts.collateralizationOracle.connect(signer).setOracle(addresses.bal, addresses.compositeOracleBalUsd);
  console.log('5. Add BAL deposit to CR Oracle');
  await contracts.collateralizationOracle.connect(signer).addDeposit(addresses.balancerDepositBalWeth);
  console.log('6. Move all (~24,542) stETH to wstETH deposit');
  await contracts.ratioPCVController.connect(signer).withdrawRatioERC20(
    addresses.ethLidoPCVDeposit,
    addresses.steth,
    addresses.wstEthLidoPCVDeposit,
    '10000' // 100%
  );
  console.log(
    '   ',
    'steth.balanceOf(wstEthLidoPCVDeposit)',
    (await contracts.steth.balanceOf(contracts.wstEthLidoPCVDeposit.address)) / 1e18
  );
  console.log('7. Wrap all stETH to wstETH');
  await contracts.wstEthLidoPCVDeposit.connect(signer).deposit();
  console.log(
    '   ',
    'steth.balanceOf(wstEthLidoPCVDeposit)',
    (await contracts.steth.balanceOf(contracts.wstEthLidoPCVDeposit.address)) / 1e18
  );
  console.log(
    '   ',
    'wsteth.balanceOf(wstEthLidoPCVDeposit)',
    (await contracts.wsteth.balanceOf(contracts.wstEthLidoPCVDeposit.address)) / 1e18
  );
  console.log('9. Move all (~23,391) wstETH to Balancer wstETH/WETH pool deposit');
  await contracts.ratioPCVController.connect(signer).withdrawRatioERC20(
    addresses.wstEthLidoPCVDeposit,
    addresses.wsteth,
    addresses.balancerDepositWstethWeth,
    '10000' // 100%
  );
  console.log(
    '   ',
    'wsteth.balanceOf(wstEthLidoPCVDeposit)',
    (await contracts.wsteth.balanceOf(addresses.wstEthLidoPCVDeposit)) / 1e18
  );
  console.log(
    '   ',
    'wsteth.balanceOf(balancerDepositWstethWeth)',
    (await contracts.wsteth.balanceOf(addresses.balancerDepositWstethWeth)) / 1e18
  );
  console.log('10. Move 24,000 ETH from Compound to Balancer wstETH/WETH pool deposit');
  console.log(
    '   ',
    'compoundEthPCVDeposit.balance() before',
    (await contracts.compoundEthPCVDeposit.balance()) / 1e18
  );
  await contracts.compoundEthPCVDeposit
    .connect(signer)
    .withdraw(addresses.balancerDepositWstethWeth, '24000000000000000000000');
  console.log('   ', 'compoundEthPCVDeposit.balance() after', (await contracts.compoundEthPCVDeposit.balance()) / 1e18);
  console.log('11. Wrap ETH to WETH');
  await contracts.balancerDepositWstethWeth.connect(signer).wrapETH();
  console.log('12. Deposit ~48,000 ETH in the balancer pool');
  console.log(
    '   ',
    'weth.balanceOf(balancerDepositWstethWeth) before',
    (await contracts.wethERC20.balanceOf(addresses.balancerDepositWstethWeth)) / 1e18
  );
  console.log(
    '   ',
    'wsteth.balanceOf(balancerDepositWstethWeth) before',
    (await contracts.wsteth.balanceOf(addresses.balancerDepositWstethWeth)) / 1e18
  );
  console.log(
    '   ',
    'balancerDepositWstethWeth.balance() before',
    (await contracts.balancerDepositWstethWeth.balance()) / 1e18
  );
  await contracts.balancerDepositWstethWeth.connect(signer).deposit();
  console.log(
    '   ',
    'balancerDepositWstethWeth.balance() after',
    (await contracts.balancerDepositWstethWeth.balance()) / 1e18
  );
  console.log('setup done');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-999');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // No more BAL on the timelock
  expect(await contracts.bal.balanceOf(contracts.feiDAOTimelock.address)).to.be.equal('0');

  // Expect BAL to be moved to the new deposit.
  // The amount accounts for the ETH deposited in addition to the BAL
  // Should be between [240k, 260k].
  expectApprox(await contracts.balancerDepositBalWeth.balance(), '250000000000000000000000', '10000000000000000000000');

  // CR Oracle updates
  expect(await contracts.collateralizationOracle.tokenToOracle(addresses.bal)).to.be.equal(
    contracts.compositeOracleBalUsd.address
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.balancerDepositBalWeth.address)).to.be.equal(
    addresses.bal
  );
  // Note : we do not add the wstETH deposit to the CR oracle, because it is meant
  // as a transitory deposit, it is not supposed to h

  // Dummy script to test other functions on a local fork
  console.log('done validate, doing some more things to test');
  console.log('-----------------------------------------------------------------');
  console.log('  BALETH oracle value', (await contracts.chainlinkBalEthOracleWrapper.read())[0] / 1e18);
  console.log('  BALUSD oracle value', (await contracts.compositeOracleBalUsd.read())[0] / 1e18);

  console.log('-----------------------------------------------------------------');
  console.log('  feiDAOTimelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  BAL/WETH balance() ?', (await contracts.balancerDepositBalWeth.balance()) / 1e18);
  console.log('  BAL/WETH withdraw(10000) BAL to Timelock');
  await contracts.balancerDepositBalWeth.withdraw(addresses.feiDAOTimelock, '10000000000000000000000');
  console.log('  feiDAOTimelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  BAL/WETH balance() ?', (await contracts.balancerDepositBalWeth.balance()) / 1e18);
  console.log('  BAL/WETH exitPool(addresses.feiDAOTimelock)');
  await contracts.balancerDepositBalWeth.exitPool(addresses.feiDAOTimelock);
  console.log('  BAL/WETH balance() ?', (await contracts.balancerDepositBalWeth.balance()) / 1e18);
  console.log('  feiDAOTimelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  feiDAOTimelock WETH balance', (await contracts.wethERC20.balanceOf(addresses.feiDAOTimelock)) / 1e18);

  console.log('-----------------------------------------------------------------');
  console.log('  feiDAOTimelock wstETH balance', (await contracts.wsteth.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  feiDAOTimelock WETH balance', (await contracts.wethERC20.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  wstETH/WETH balance() ?', (await contracts.balancerDepositWstethWeth.balance()) / 1e18);
  console.log('  wstETH/WETH withdraw(10000) WETH to Timelock');
  await contracts.balancerDepositWstethWeth.withdraw(addresses.feiDAOTimelock, '10000000000000000000000');
  console.log('  feiDAOTimelock wstETH balance', (await contracts.wsteth.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  feiDAOTimelock WETH balance', (await contracts.wethERC20.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  wstETH/WETH balance() ?', (await contracts.balancerDepositWstethWeth.balance()) / 1e18);
  console.log('  wstETH/WETH exitPool(addresses.feiDAOTimelock)');
  await contracts.balancerDepositWstethWeth.exitPool(addresses.feiDAOTimelock);
  console.log('  wstETH/WETH balance() ?', (await contracts.balancerDepositWstethWeth.balance()) / 1e18);
  console.log('  feiDAOTimelock wstETH balance', (await contracts.wsteth.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  feiDAOTimelock WETH balance', (await contracts.wethERC20.balanceOf(addresses.feiDAOTimelock)) / 1e18);
};
