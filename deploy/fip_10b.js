const StableSwapOperatorV1 = artifacts.require('StableSwapOperatorV1');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
  } = addresses;

  if (
    !coreAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const curveMetapoolDeposit = await StableSwapOperatorV1.new(
    coreAddress,
    '0x06cb22615ba53e60d67bf6c341a0fd5e718e1655', // FEI-3crv metapool
    '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7', // Curve 3pool
    '50', // 0.5% max slippage
    { from: deployAddress }
  );

  logging ? console.log('Curve Metapool Deposit deployed to: ', curveMetapoolDeposit.address) : undefined;

  return {
    curveMetapoolDeposit,
  };
}

module.exports = { deploy };
