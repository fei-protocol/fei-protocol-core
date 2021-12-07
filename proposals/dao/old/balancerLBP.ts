import { ethers } from 'hardhat';
import { time, expectApprox } from '@test/helpers';
import { expect } from 'chai';

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

// The DAO steps for creating a balancer LBP swapper + manager
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    core,
    fei,
    tribe,
    chainlinkTribeEthOracleWrapper,
    chainlinkTribeUsdCompositeOracle,
    balancerVault,
    balancerLBPSwapper
  } = contracts;

  const accounts = await ethers.getSigners();
  const { timelockAddress } = addresses;

  const role = await balancerLBPSwapper.CONTRACT_ADMIN_ROLE();

  // 1. Create Balancer admin role
  await core.createRole(role, await core.GOVERN_ROLE());

  // 2. Grant Balancer admin role to LBP swapper
  await core.grantRole(role, balancerLBPSwapper.address);

  await core.grantRole(role, timelockAddress);

  await fei.mint(balancerLBPSwapper.address, `10000${e18}`);
  await core.allocateTribe(balancerLBPSwapper.address, `130${e18}`);

  await time.increase('100');

  await balancerLBPSwapper.swap();
  const pid = await balancerLBPSwapper.pid();

  await core.allocateTribe(accounts[0], `100000${1e18}`);
  await tribe.approve(balancerVault.address, `1000000${e18}`, { from: accounts[0] });
  await balancerVault.swap(
    {
      poolId: pid,
      kind: 0,
      assetIn: tribe.address,
      assetOut: fei.address,
      amount: `30${e18}`,
      userData: '0x'
    },
    {
      sender: accounts[0],
      fromInternalBalance: false,
      recipient: accounts[0],
      toInternalBalance: false
    },
    0,
    '10000000000000000000000'
  );

  await time.increase('100');
  await balancerLBPSwapper.swap();
}

async function teardown(addresses, oldContractAddresses, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const { coreAddress, timelockAddress } = addresses;

  const { core, tribe, balancerLBPSwapper } = contracts;

  expect(await balancerLBPSwapper.isContractAdmin(balancerLBPSwapper.address)).to.be.true;
  expect(await balancerLBPSwapper.isContractAdmin(timelockAddress)).to.be.true;

  expect(await balancerLBPSwapper.CONTRACT_ADMIN_ROLE()).to.be.not.equal(await core.GOVERN_ROLE());

  expectApprox(await tribe.balanceOf(timelockAddress), `30${e18}`, '10');
}

export default {
  setup,
  run,
  teardown,
  validate
};
