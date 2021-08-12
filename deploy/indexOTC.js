import { formatBytes32String } from '@ethersproject/strings';

const OtcEscrow = artifacts.require('OtcEscrow');
const SnapshotDelegatorPCVDeposit = artifacts.require('SnapshotDelegatorPCVDeposit');

const e18 = '000000000000000000';
const e15 =    '000000000000000';
const indexSpaceId = formatBytes32String('index-coop.eth');
const indexDelegate = '0xe0ac4559739bD36f0913FB0A3f5bFC19BCBaCD52';

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    wethAddress,
    tribeAddress,
    indexAddress,
    defiPulseOTCAddress,
    timelockAddress
  } = addresses;

  if (
    !coreAddress || !wethAddress || !feiAddress || !tribeAddress || !indexAddress || !defiPulseOTCAddress
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
  
  const indexDelegator = await SnapshotDelegatorPCVDeposit.new(
    coreAddress,
    indexAddress,
    indexSpaceId,
    indexDelegate
  );

  logging ? console.log('Index Delegator deployed to: ', indexDelegator.address) : undefined;
  
  return {
    ethOTCEscrow,
    tribeOTCEscrow,
    feiOTCEscrow,
    indexDelegator
  };
}

module.exports = { deploy };
