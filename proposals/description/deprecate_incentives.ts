import { ethers } from 'ethers';
import { TemplatedProposalDescription } from '@custom-types/types';

const deprecate_incentives: TemplatedProposalDescription = {
  title: 'TIP-114: Deprecate TRIBE Incentives system',
  commands: [
    // Withdraw excess TRIBE from reward system
    {
      target: 'erc20Dripper',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '2508838570600494412126519'],
      description: 'Withdraw 2.5M TRIBE from the ERC20 Dripper to the Core Treasury'
    },
    {
      target: 'votiumBriber3Crvpool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '1725076846586787179639648'],
      description: `
      Withdraw all TRIBE from 3CRV Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 200k TRIBE pre-existing on this contract and then an additional 1.5M TRIBE 
      that was harvested from the stakingTokenWrapperBribe3Crvpool.
      `
    },
    {
      target: 'votiumBriberD3pool',
      values: '0',
      method: 'withdrawERC20(address,address,uint256)',
      arguments: (addresses) => [addresses.tribe, addresses.core, '232096077769383622085234'],
      description: `
      Withdraw all TRIBE from D3 Votium briber contract to the Core Treasury. 
      
      Withdraw is made up of 230k TRIBE that was harvested from the stakingTokenWrapperBribeD3pool.
      `
    },
    {
      target: 'rewardsDistributorAdmin',
      values: '0',
      method: '_grantComp(address,uint256)',
      arguments: (addresses) => [addresses.core, '150000000000000000000000'],
      description: `Withdraw excess 164k TRIBE from Rari delegator contract`
    },
    {
      target: 'tribalChief',
      values: '0',
      method: 'governorWithdrawTribe(uint256)',
      arguments: (addresses) => ['26833947775112516867325654'],
      description: `
      Withdraw remaining TRIBE from the Tribal Chief to the Core Treasury. 
      
      Withdrawal amount = 
      (Tribal Chief balance before harvest 
            - (pending rewards, Uniswap-v2 FEI/TRIBE LP + Curve 3crv-FEI metapool LP + G-UNI DAI/FEI 0.05% fee tier)
      
      Withdrawal amount = 27.4M - 0.565M = 26.8M
      `
    },

    ////  Revoke roles from contracts that interacted with Tribal Chief and rewards system
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from OptimisticTimelock'
    },
    {
      target: 'core',
      values: '0',
      method: 'revokeRole(bytes32,address)',
      arguments: (addresses) => [ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock],
      description: ' Revoke TRIBAL_CHIEF_ADMIN_ROLE from Tribal Council timelock'
    },

    //// Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'changeProxyAdmin(address,address)',
      arguments: (addresses) => [addresses.aaveTribeIncentivesController, addresses.aaveLendingPoolAddressesProvider],
      description: `
      Transfer the admin of the Aave Tribe Incentives Controller Proxy to Aave governance, specifically 
      the LendingPoolAddressesProvider.
      `
    },

    //// AURA Airdrop claim & lock
    {
      target: 'proxyAdmin',
      values: '0',
      method: 'upgrade(address,address)',
      arguments: (addresses) => [
        addresses.vlAuraDelegatorPCVDeposit,
        addresses.vlAuraDelegatorPCVDepositImplementation
      ],
      description: `Upgrade implementation of the vlAuraDelegatorPCVDeposit`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'initialize(address,address,address)',
      arguments: (addresses) => [addresses.aura, addresses.vlAura, addresses.auraMerkleDrop],
      description: `Initialize state of vlAuraDelegatorPCVDeposit`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'claimAirdropAndLock(bytes32[],uint256)',
      arguments: (addresses) => [
        [
          // merkle proof
          '0x7a976f1aaae92306705a851e21eca3a2b94e5f13b70ab392ab43de0772ebeec7',
          '0x5f45f18cae24e95af94aeb735804f6fa3c71737f9bb628a47aa1d10338c8f108',
          '0x048081e369fa24baee1b7a0cce66539341a6a3e82abe5f1de21a5c34c62c7059',
          '0xd161606724ac7215eb1d8401a9652d5cd674dcb87b358142e8a1c0606638a155',
          '0x95c5cd035c6d6b3d680c7f44f39762cd520ae00bb22a97b720c7a5e9f8343bb1',
          '0xe21283def28f3d19b0ca2e7d5dbc658b36ff156452caccd8b1bec0a3f8e1888d',
          '0xc0594f46556af78da13a3a6927537d3797d06d1a840809d5a1fe652104558796',
          '0x1ef501ed5c0808c30fe72e31488aedbb87cc47b6ad57d4f698834a8980828e96',
          '0x96093189d23ab1dcbc52c1ce8e66c26458fd343bf71e992a3dcddab33732f4e6',
          '0x343102ed4002e53b89598f5ef4117d269b3ac98666da0b018d37d12c3ccd3e5f',
          '0x14737b2e4f69768d546edf1c090e03113a5f4dad097fd7e618519c56405a4dc0',
          '0xc3d849f7a9528b1c7a94b37fa96daddd882b85442a136fd1a2a89b9785392b03',
          '0x885f3b9b64e16f0a6490c275896092c04f932fd1a484ba7049c7ae632e301a23'
        ],
        '23438420626218725374201' // amount
      ],
      description: `Claim AURA airdrop and lock`
    },
    {
      target: 'vlAuraDelegatorPCVDeposit',
      values: '0',
      method: 'setDelegate(address)',
      arguments: (addresses) => [addresses.eswak],
      description: `Set vlAURA delegatee`
    }
  ],
  description: `
  TIP-114: Deprecate TRIBE Incentives system

  Deprecates the TRIBE incentives system according to proposal: 

  Specifically it:
  - Withdraws remaining TRIBE from the TribalChief, leaving enough behind to fully fund existing commitments
  - Withdraws all TRIBE from 3Crv and D3 Votium briber contracts
  - Withdraws remaining TRIBE from ERC20 Dripper
  - Revokes no longer needed TRIBAL_CHIEF_ADMIN_ROLE roles
  - Transfers the admin of the Aave Fei Incentives Controller Proxy to Aave Governance
  `
};

export default deprecate_incentives;
