// Each contrat will have a different subset of paused state. PSMs are different to normal

export const pauseStateConfig: PauseStateConfig = {
  ethPSM: {
    paused: true,
    redeemPaused: true
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
  daiFixedPricePSM: {
    paused: false,
    redeemPaused: false,
    mintPaused: false
  }
};

export type PauseState = {
  paused: boolean;
  redeemPaused?: boolean;
  mintPaused?: boolean;
};

export type PauseStateConfig = {
  [key: string]: PauseState;
};
