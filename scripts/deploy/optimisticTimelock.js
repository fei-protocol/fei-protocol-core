const OptimisticTimelock = artifacts.require('OptimisticTimelock');

const fourDays = 4 * 24 * 60 * 60;

async function deploy(deployAddress, addresses, logging = false) {
  const {
    tribalChiefOptimisticMultisigAddress,
    coreAddress
  } = addresses;

  if (
    !tribalChiefOptimisticMultisigAddress || !coreAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const optimisticTimelock = await OptimisticTimelock.new(
    coreAddress,
    fourDays,
    [tribalChiefOptimisticMultisigAddress],
    [tribalChiefOptimisticMultisigAddress]
  );

  return {
    optimisticTimelock
  };
}

module.exports = { deploy };
