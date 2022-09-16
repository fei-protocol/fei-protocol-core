import { TemplatedProposalDescription } from '@custom-types/types';

const MAX_BASIS_POINTS = '10000'; // 100% in basis points

const tip_121c_pt2: TemplatedProposalDescription = {
  title: 'TIP_121c (cont.): Tribe Redemption',
  commands: [
    // 1. Transfer PCV assets to TribeRedeemer for redemption
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
    }
    // FOX
    // {
    //   target: 'ratioPCVControllerV2',
    //   values: '0',
    //   method: 'withdraw(address,uint256)',
    //   arguments: (addresses) => [],
    //   description: 'Withdraw all ~ FOX to the Tribe Redeemer'
    // }
  ],
  description: `
  TIP_121c (cont.): Tribe Redemption
  `
};

export default tip_121c_pt2;
