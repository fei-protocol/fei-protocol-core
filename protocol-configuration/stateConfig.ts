// Here, we configure important contract state so that any deviations will be caught in tests.
// Keys in this config can only be keys of MainnetContractsConfig, configured in mainnetAddresses.ts
// Values are sets of key-value pairs representing the state var / function call to check & the expected value.

import { BigNumber } from 'ethers';

export const StateConfig = {
  ethPSM: {
    paused: true,
    redeemPaused: true
  },
  daiFixedPricePSM: {
    paused: true,
    redeemPaused: true,
    mintPaused: true
  },
  simpleFeiDaiPSM: {
    paused: false,
    redeemPaused: false,
    mintPaused: false
  },
  lusdPSM: {
    paused: true,
    redeemPaused: true
  },
  raiPriceBoundPSM: {
    paused: true,
    redeemPaused: true,
    mintPaused: true
  },
  daiPCVDripController: {
    paused: true
  },
  daiFixedPricePSMFeiSkimmer: {
    paused: false
  },
  fei: {
    decimals: BigNumber.from(18),
    name: 'Fei USD'
  }
};

export type ProtocolStateConfig = typeof StateConfig;
export type StateConfigEntryName = keyof ProtocolStateConfig;
export const StateConfigEntryNames = Object.keys(StateConfig) as StateConfigEntryName[];
