import { ethers } from 'hardhat';
import { expect } from 'chai';
import { TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../test/integration/setup/types';

const e18 = '000000000000000000';

const END_TIMESTAMP = '1647993600'; // 3-23-22
const TRIBE_PER_SECOND = '250000000000000000'; // .25 TRIBE/s

async function setup(addresses, oldContracts, contracts, logging) {
  console.log('Nothing to see here, move along.');
}

/*
 1. Mint 25M FEI to Aave FEI PCV Deposit
 2. Deposit Aave FEI PCV Deposit
 3. Transfer 4M TRIBE from dripper to incentives controller
 4. Upgrade proxy admin to default proxy admin
 5. Trigger reward rate for aFeiVariableBorrow
 6. Set distribution end
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { fei, aaveFeiPCVDeposit, erc20Dripper } = contracts;

  const { aaveTribeIncentivesControllerAddress, aFeiVariableDebtAddress, timelockAddress, proxyAdminAddress } =
    addresses;

  // 1.
  await fei.mint(aaveFeiPCVDeposit.address, `25000000${e18}`);

  // 2.
  await aaveFeiPCVDeposit.deposit();

  // 3.
  await erc20Dripper.withdraw(aaveTribeIncentivesControllerAddress, `4000000${e18}`);

  // 4.
  const incentivesControllerAbi = [
    'function setDistributionEnd(uint256 distributionEnd)',
    'function configureAssets(address[] assets, uint256[] emissionsPerSecond)',
    'function changeAdmin(address newAdmin)'
  ];
  const adminSigner = ethers.provider.getSigner(timelockAddress);
  const incentivesController = new ethers.Contract(
    aaveTribeIncentivesControllerAddress,
    incentivesControllerAbi,
    adminSigner
  );

  await incentivesController.changeAdmin(proxyAdminAddress);

  // 5.
  await incentivesController.configureAssets([aFeiVariableDebtAddress], [TRIBE_PER_SECOND]);

  // 6.
  await incentivesController.setDistributionEnd(END_TIMESTAMP);
}

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('Nothing to do in teardown function.');
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { tribe, aaveFeiPCVDeposit, proxyAdmin, fei, aFei, tribalChief } = contracts;

  const {
    aaveTribeIncentivesController: aaveTribeIncentivesControllerAddress,
    aFeiVariableDebt: aFeiVariableDebtAddress,
    timelock: timelockAddress,
    gUniFeiDaiLP: gUniFeiDaiLPAddress
  } = addresses;

  expect((await fei.balanceOf(aaveFeiPCVDeposit.address)).toString()).to.be.equal('0');
  expect((await aFei.balanceOf(aaveFeiPCVDeposit.address)).toString()).to.be.equal(`25000000${e18}`);
  expect((await aaveFeiPCVDeposit.balance()).toString()).to.be.equal(`25000000${e18}`);

  expect((await tribe.balanceOf(aaveTribeIncentivesControllerAddress)).toString()).to.be.equal(`4000000${e18}`);
  expect(await proxyAdmin.getProxyAdmin(aaveTribeIncentivesControllerAddress)).to.be.equal(proxyAdmin.address);

  // eslint-disable-next-line object-curly-newline, key-spacing, quote-props, quotes
  const incentivesControllerAbi = [
    {
      inputs: [
        { internalType: 'address', name: 'rewardToken', type: 'address' },
        { internalType: 'address', name: 'emissionManager', type: 'address' }
      ],
      stateMutability: 'nonpayable',
      type: 'constructor'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'asset', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'emission', type: 'uint256' }
      ],
      name: 'AssetConfigUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'asset', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }
      ],
      name: 'AssetIndexUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: true, internalType: 'address', name: 'claimer', type: 'address' }
      ],
      name: 'ClaimerSet',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [{ indexed: false, internalType: 'uint256', name: 'newDistributionEnd', type: 'uint256' }],
      name: 'DistributionEndUpdated',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'RewardsAccrued',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: true, internalType: 'address', name: 'to', type: 'address' },
        { indexed: true, internalType: 'address', name: 'claimer', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' }
      ],
      name: 'RewardsClaimed',
      type: 'event'
    },
    {
      anonymous: false,
      inputs: [
        { indexed: true, internalType: 'address', name: 'user', type: 'address' },
        { indexed: true, internalType: 'address', name: 'asset', type: 'address' },
        { indexed: false, internalType: 'uint256', name: 'index', type: 'uint256' }
      ],
      name: 'UserIndexUpdated',
      type: 'event'
    },
    {
      inputs: [],
      name: 'DISTRIBUTION_END',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'EMISSION_MANAGER',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'PRECISION',
      outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'REVISION',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'REWARD_TOKEN',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'TOKEN',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: '', type: 'address' }],
      name: 'assets',
      outputs: [
        { internalType: 'uint104', name: 'emissionPerSecond', type: 'uint104' },
        { internalType: 'uint104', name: 'index', type: 'uint104' },
        { internalType: 'uint40', name: 'lastUpdateTimestamp', type: 'uint40' }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address[]', name: 'assets', type: 'address[]' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'address', name: 'to', type: 'address' }
      ],
      name: 'claimRewards',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address[]', name: 'assets', type: 'address[]' },
        { internalType: 'uint256', name: 'amount', type: 'uint256' },
        { internalType: 'address', name: 'user', type: 'address' },
        { internalType: 'address', name: 'to', type: 'address' }
      ],
      name: 'claimRewardsOnBehalf',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address[]', name: 'assets', type: 'address[]' },
        { internalType: 'uint256[]', name: 'emissionsPerSecond', type: 'uint256[]' }
      ],
      name: 'configureAssets',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'asset', type: 'address' }],
      name: 'getAssetData',
      outputs: [
        { internalType: 'uint256', name: '', type: 'uint256' },
        { internalType: 'uint256', name: '', type: 'uint256' },
        { internalType: 'uint256', name: '', type: 'uint256' }
      ],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
      name: 'getClaimer',
      outputs: [{ internalType: 'address', name: '', type: 'address' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [],
      name: 'getDistributionEnd',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address[]', name: 'assets', type: 'address[]' },
        { internalType: 'address', name: 'user', type: 'address' }
      ],
      name: 'getRewardsBalance',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'user', type: 'address' },
        { internalType: 'address', name: 'asset', type: 'address' }
      ],
      name: 'getUserAssetData',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: '_user', type: 'address' }],
      name: 'getUserUnclaimedRewards',
      outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'user', type: 'address' },
        { internalType: 'uint256', name: 'totalSupply', type: 'uint256' },
        { internalType: 'uint256', name: 'userBalance', type: 'uint256' }
      ],
      name: 'handleAction',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'address', name: 'addressesProvider', type: 'address' }],
      name: 'initialize',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [
        { internalType: 'address', name: 'user', type: 'address' },
        { internalType: 'address', name: 'caller', type: 'address' }
      ],
      name: 'setClaimer',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    },
    {
      inputs: [{ internalType: 'uint256', name: 'distributionEnd', type: 'uint256' }],
      name: 'setDistributionEnd',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function'
    }
  ];

  const adminSigner = ethers.provider.getSigner(timelockAddress);
  const incentivesController = new ethers.Contract(
    aaveTribeIncentivesControllerAddress,
    incentivesControllerAbi,
    adminSigner
  );

  const end = await incentivesController.getDistributionEnd();
  expect(end.toString()).to.be.equal(END_TIMESTAMP);

  const config = await incentivesController.getAssetData(aFeiVariableDebtAddress);
  expect(config[1].toString()).to.be.equal(TRIBE_PER_SECOND);

  // FIP-25:
  expect((await tribalChief.totalAllocPoint()).toString()).to.be.equal('2100');
  expect((await tribalChief.numPools()).toString()).to.be.equal('3');
  expect(await tribalChief.stakedToken(2)).to.be.equal(gUniFeiDaiLPAddress);
};

module.exports = {
  setup,
  run,
  teardown,
  validate
};
