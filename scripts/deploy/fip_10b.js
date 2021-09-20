const StableSwapOperatorV1 = artifacts.require('StableSwapOperatorV1');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    curve3poolAddress,
    curveMetapoolAddress,
  } = addresses;

  if (
    !coreAddress || !curve3poolAddress || !curveMetapoolAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const curveMetapoolDeposit = await StableSwapOperatorV1.new(
    coreAddress,
    curveMetapoolAddress, // FEI-3crv metapool
    curve3poolAddress, // Curve 3pool
    '50', // 0.5% max slippage
    { from: deployAddress }
  );

  logging ? console.log('Curve Metapool Deposit deployed to: ', curveMetapoolDeposit.address) : undefined;

  return {
    curveMetapoolDeposit,
  };
}

module.exports = { deploy };
