const StableSwapOperatorV1 = artifacts.readArtifactSync('StableSwapOperatorV1');

const e18 = '000000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const { coreAddress, curve3poolAddress, curveMetapoolAddress } = addresses;

  if (!coreAddress || !curve3poolAddress || !curveMetapoolAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const curveMetapoolDeposit = await StableSwapOperatorV1.new(
    coreAddress,
    curveMetapoolAddress, // FEI-3crv metapool
    curve3poolAddress, // Curve 3pool
    '50', // 0.5% max slippage
    '100000000000000000', // minimum 1:99 FEI in pool
    `10${e18}`, // maximum 99:1 FEI in pool
    { from: deployAddress }
  );

  logging ? console.log('Curve Metapool Deposit deployed to: ', curveMetapoolDeposit.address) : undefined;

  return {
    curveMetapoolDeposit
  };
}

module.exports = { deploy };
