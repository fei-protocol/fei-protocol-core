const OtcEscrow = artifacts.require('OtcEscrow');

const e18 = '000000000000000000';
const e15 =    '000000000000000';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    feiAddress,
    wethAddress,
    tribeAddress,
    indexAddress,
    defiPulseOTCAddress,
    timelockAddress
  } = addresses;

  if (
    !wethAddress || !feiAddress || !tribeAddress || !indexAddress || !defiPulseOTCAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const ethOTCEscrow = await OtcEscrow.new(
    defiPulseOTCAddress,
    timelockAddress,
    indexAddress,
    wethAddress,
    `50000${e18}`, // 50k INDEX
    `633150${e15}`, // 633.150 ETH
    { from: deployAddress }
  );
  logging ? console.log('ETH OTC Escrow deployed to: ', ethOTCEscrow.address) : undefined;
  
  const tribeOTCEscrow = await OtcEscrow.new(
    defiPulseOTCAddress,
    timelockAddress,
    indexAddress,
    tribeAddress,
    `25000${e18}`, // 25k INDEX
    `1235325922${e15}`, // 1235325.922 TRIBE
    { from: deployAddress }
  );
  logging ? console.log('TRIBE OTC Escrow deployed to: ', tribeOTCEscrow.address) : undefined;

  const feiOTCEscrow = await OtcEscrow.new(
    defiPulseOTCAddress,
    timelockAddress,
    indexAddress,
    feiAddress,
    `25000${e18}`, // 25k INDEX
    `991512900${e15}`, // 991512.900 FEI
    { from: deployAddress }
  );
  logging ? console.log('FEI OTC Escrow deployed to: ', feiOTCEscrow.address) : undefined;
  
  return {
    ethOTCEscrow,
    tribeOTCEscrow,
    feiOTCEscrow
  };
}

module.exports = { deploy };
