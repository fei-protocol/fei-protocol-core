// Each contrat will have a different subset of paused state. PSMs are different to normal

export const pauseState: PauseStateConfig = {
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

export type PauseStatePSM = {
  paused: boolean;
  redeemPaused: boolean;
  mintPaused?: boolean;
};

export type PauseState = {
  paused: boolean;
};

export type PauseStateConfig = {
  [key: string]: PauseStatePSM | PauseState;
};
