import { TemplatedProposalDescription } from '@custom-types/types';

const MAX_BASIS_POINTS = '10000'; // 100% in basis points

const DAO_TIMELOCK_FOX_BALANCE = '15316691965631380244403204';
const DAO_TIMELOCK_LQTY_BALANCE = '1101298805118942906652299';

const tip_121c_pt2: TemplatedProposalDescription = {
  title: 'TIP_121c (cont.): Tribe Redemption',
  commands: [
    // Transfer PCV assets to TribeRedeemer for redemption
    // stETH
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatioERC20(address,address,address,uint256)',
      arguments: (addresses) => [
        addresses.ethLidoPCVDeposit,
        addresses.steth,
        addresses.tribeRedeemer,
        MAX_BASIS_POINTS
      ],
      description: 'Withdraw all 50.3k stETH from Lido deposit to the Tribe Redeemer'
    },
    // DAI
    {
      target: 'ratioPCVControllerV2',
      values: '0',
      method: 'withdrawRatio(address,address,uint256)',
      arguments: (addresses) => [addresses.daiHoldingPCVDeposit, addresses.tribeRedeemer, MAX_BASIS_POINTS],
      description: 'Withdraw all ~68M DAI from holding deposit to the Tribe Redeemer'
    },
    // FOX
    {
      target: 'fox',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, DAO_TIMELOCK_FOX_BALANCE],
      description: 'Send all 15.3M FOX to the Tribe Redeemer'
    },
    // LQTY
    {
      target: 'lqty',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.tribeRedeemer, DAO_TIMELOCK_LQTY_BALANCE],
      description: 'Send all 1.1M LQTY to the Tribe Redeemer'
    }
    // TODO: Need any lenses? Anything to deprecate?
  ],
  description: `
  TIP_121c (cont.): Tribe Redemption
  `
};

export default tip_121c_pt2;
