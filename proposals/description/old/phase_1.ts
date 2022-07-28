import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

// Minimum amount of FEI to be redeemed from Uniswap when liquidity removed
const MIN_FEI_OUT = ethers.constants.WeiPerEther.mul(20_000_000);

// Minimum amount of TRIBE to be redeemed from Uniswap when liquidity removed
const MIN_TRIBE_OUT = ethers.constants.WeiPerEther.mul(120_000_000);

const phase_1: TemplatedProposalDescription = {
  title: 'TIP-120: Return Unvested Tokens',
  commands: [
    // 1. Accept the beneficiary of Fei Labs vesting TRIBE timelock contract as the DAO timelock
    {
      target: 'feiLabsVestingTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary on Fei Labs vesting contract as the DAO timelock'
    },

    // 2. Prepare for liquidity removal by accepting timelock beneficiary
    {
      target: 'uniswapFeiTribeLiquidityTimelock',
      values: '0',
      method: 'acceptBeneficiary()',
      arguments: (addresses) => [],
      description: 'Accept beneficiary for Fei Labs Uniswap Fei-Tribe Timelock (Uni-LP)'
    },

    // Unlock the LP tokens held by the Uniswap Fei Tribe timelock and transfer to DAO timelock
    {
      target: 'uniswapFeiTribeLiquidityTimelock',
      values: '0',
      method: 'unlockLiquidity()',
      arguments: (addresses) => [],
      description: 'Release all Fei-Tribe LP tokens to the Tribe DAO timelock'
    },
    // Send the Investor LP tokens that are to be re-locked to their new timelock
    {
      target: 'feiTribePair',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.investorUniswapFeiTribeTimelock, '23996686013920804984559112'],
      description: `
      Transfer unlocked investor FEI-TRIBE LP tokens to the new linear vesting timelock.
      `
    },
    // Transfer remaining not-yet-vested LP tokens (not including the newly relocked investor tokens)
    {
      target: 'feiTribePair',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.uniswapLiquidityRemover, '132453262024125114893965413'],
      description: `
      Send Fei Labs yet-to-be-vested LP tokens to the Uniswap liquidity removal contract.
      This is to allow the liquidity to be removed from Uniswap and returned to the DAO.
      `
    },
    {
      target: 'uniswapLiquidityRemover',
      values: '0',
      method: 'redeemLiquidity(uint256,uint256)',
      arguments: (addresses) => [MIN_FEI_OUT, MIN_TRIBE_OUT],
      description: `
      Remove liquidity from the Uniswap V2 pool by redeeming the LP tokens for FEI and TRIBE.
      
      As part of the contract call, all redeemed FEI is burned and all redeemed TRIBE is sent to Core.
      `
    },
    // 3. Revoke the TRIBE approval given to the Tribal Council timelock
    {
      target: 'tribe',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: (addresses) => [addresses.tribalCouncilTimelock, '0'],
      description: 'Revoke the TRIBE approval given to the Tribal Council timelock'
    },
    // 4. Send DAO Timelock TRIBE to Core
    {
      target: 'tribe',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.core, '16928757542558284368284929'],
      description: 'Send the DAO timelock ~17M TRIBE to the Core Treasury'
    }
  ],
  description: `
  TIP-120: Return Unvested Tokens

  Fei Labs will stop participating in the Tribe DAO upon completion of the TIP-121 proposal here https://tribe.fei.money/t/tip-121-proposal-for-the-future-of-the-tribe-dao/4475. This DAO vote will only transfer any unvested Fei Labs tokens to the DAO and move TRIBE from the DAO timelock to the treasury, with no actions related to TIP-121.

  There are two timelocks of such unvested tokens of note, the TRIBE timelock which has 88909000000000000000000000 (~88.9M) unvested TRIBE and the FEI-TRIBE LP Timelock which has 132453262024125114893965413 (~132.4M) unvested LP tokens. The end date for the vesting used is July 1, 2022. All of these tokens will be returned to the DAO by granting ownership of the timelocks to the DAO. The DAO could claim the tokens from the timelocks as needed or simply account for them as not in circulation.

  Note the LP Timelock includes a portion 23996686013920804984559112 (~24M) LP tokens which are locked for Fei Labs early supporters. These will be transferred to a new timelock and remain as liquidity, after returning the team’s unvested LP tokens to the DAO.

  The FEI-TRIBE LP Tokens which return to the DAO would be broken up into FEI, which would be burned, and TRIBE, which would be sent to the treasury. The benefit of breaking up these LP tokens is having certainty on the number of TRIBE in the treasury and FEI removed from circulation for accounting purposes. 
  `
};

export default phase_1;
