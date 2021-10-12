import hre, { ethers } from 'hardhat';

async function deploy(deployAddress, addresses, logging = false) {
  const { core, rariPool8Tribe, rariRewardsDistributorDelegator, tribalChief } = addresses;

  const tribalChiefIndex = 3;
  /// do not incentivize borrowing, instead incentivize supplying
  const isBorrowIncentivized = false;

  /// calculate the address of the RDA that has not been deployed, then pass that
  /// into the autorewards distributor constructor so no admin actions are needed to wire the contracts together
  const signer = await ethers.getSigner(deployAddress);
  const currentNonce = Number(
    await hre.network.provider.request({
      method: 'eth_getTransactionCount',
      params: [signer.address]
    })
  );
  const futureRDAAddress = ethers.utils.getContractAddress({ from: signer.address, nonce: currentNonce + 1 });

  const autoRewardsDistributorFactory = await ethers.getContractFactory('AutoRewardsDistributor');
  const autoRewardsDistributor = await autoRewardsDistributorFactory
    .connect(signer)
    .deploy(core, futureRDAAddress, tribalChief, tribalChiefIndex, rariPool8Tribe, isBorrowIncentivized);

  logging && console.log('AutoRewardsDistributor deployed to: ', autoRewardsDistributor.address);

  const rewardsDistributorAdminFactory = await ethers.getContractFactory('RewardsDistributorAdmin');
  const rewardsDistributorAdmin = await rewardsDistributorAdminFactory
    .connect(signer)
    .deploy(core, rariRewardsDistributorDelegator, [autoRewardsDistributor.address]);

  logging && console.log('RewardsDistributorAdmin deployed to: ', rewardsDistributorAdmin.address);

  return {
    autoRewardsDistributor,
    rewardsDistributorAdmin
  };
}

module.exports = { deploy };
