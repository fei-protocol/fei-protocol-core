import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const tip_vebalotc: TemplatedProposalDescription = {
  title: 'TIP-121c: vlAURA OTC',
  commands: [
    // 1. Handle vlAURA OTC
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.vlAuraDelegatorPCVDepositProxy, addresses.vlauraOtcHelper],
      description: 'Transfer proxy ownership of vlAuraDelegatorPCVDepositProxy to vlauraOtcHelper'
    }
  ],
  description: `
  TIP-121c: vlAURA OTC

  This proposal sets up the protocol to be able to transfer its 34,038 vlAURA to Fishy for OTC trade, in exchange of 94,000 DAI.
  `
};

export default tip_vebalotc;
