import { ProposalDescription } from '@custom-types/types';

const fip_92: ProposalDescription = {
  title: 'FIP-90: Fuse-boosted FEI/DAI/LUSD Balancer Pool',
  commands: [
    {
      target: 'compoundDaiPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{feiDAOTimelock}', '10000000000000000000000000'],
      description: 'Send 10m DAI to the DAO Timelock'
    },
    {
      target: 'dai',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{erc4626VaultFuse8Dai}', '5000000000000000000000000'],
      description: 'Approve 5m DAI to the ERC4626 Vault'
    },
    {
      target: 'erc4626VaultFuse8Dai',
      values: '0',
      method: 'deposit(uint256,address)',
      arguments: ['5000000000000000000000000', '{feiDAOTimelock}'],
      description: 'Deposit 5m DAI in ERC4626 Vault'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: ['{feiDAOTimelock}', '10000000000000000000000000'],
      description: 'Mint 10m FEI to the DAO Timelock'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{erc4626VaultFuse8Fei}', '5000000000000000000000000'],
      description: 'Approve 5m FEI to the ERC4626 Vault'
    },
    {
      target: 'erc4626VaultFuse8Fei',
      values: '0',
      method: 'deposit(uint256,address)',
      arguments: ['5000000000000000000000000', '{feiDAOTimelock}'],
      description: 'Deposit 5m FEI in ERC4626 Vault'
    },
    {
      target: 'bammDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: ['{feiDAOTimelock}', '10000000000000000000000000'],
      description: 'Send 10m LUSD to the DAO Timelock'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{erc4626VaultFuse8Lusd}', '5000000000000000000000000'],
      description: 'Approve 5m LUSD to the ERC4626 Vault'
    },
    {
      target: 'erc4626VaultFuse8Lusd',
      values: '0',
      method: 'deposit(uint256,address)',
      arguments: ['5000000000000000000000000', '{feiDAOTimelock}'],
      description: 'Deposit 5m LUSD in ERC4626 Vault'
    },
    {
      target: 'fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m FEI to trade on Balancer'
    },
    {
      target: 'dai',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m DAI to trade on Balancer'
    },
    {
      target: 'lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m LUSD to trade on Balancer'
    },
    {
      target: 'erc4626VaultFuse8Fei',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m 4626-fFEI-8 to trade on Balancer'
    },
    {
      target: 'erc4626VaultFuse8Dai',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m 4626-fDAI-8 to trade on Balancer'
    },
    {
      target: 'erc4626VaultFuse8Lusd',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '5000000000000000000000000'],
      description: 'Approve 5m 4626-fLUSD-8 to trade on Balancer'
    }
    /*{
      target: 'balancerVault',
      values: '0',
      method: 'swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)',
      arguments: [
        [ // SingleSwap singleSwap
          '0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196', // bytes32 poolId bb-f-FEI
          '0', // SwapKind kind { GIVEN_IN, GIVEN_OUT }
          '{fei}', // IAsset assetIn = fei
          '{balancerBoostedFuseFeiLinearPool}', // IAsset assetOut = bb-f-fei
          '5000000000000000000000000', // uint256 amount = 5M
          '0x' // bytes userData
        ],
        [ // FundManagement funds
          '{feiDAOTimelock}', // address sender = feiDAOTimelock
          false, // bool fromInternalBalance
          '{feiDAOTimelock}', // address payable recipient = feiDAOTimelock
          false, // bool toInternalBalance
        ],
        '0', // uint256 limit
        '1700000000' // uint256 deadline
      ],
      description: 'Swap 5M FEI for bb-f-FEI on Balancer'
    },
    {
      target: 'balancerVault',
      values: '0',
      method: 'swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)',
      arguments: [
        [ // SingleSwap singleSwap
          '0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196', // bytes32 poolId bb-f-FEI
          '0', // SwapKind kind { GIVEN_IN, GIVEN_OUT }
          '{erc4626VaultFuse8Fei}', // IAsset assetIn = 4626-fFEI-8
          '{balancerBoostedFuseFeiLinearPool}', // IAsset assetOut = bb-f-fei
          '5000000000000000000000000', // uint256 amount = 5M
          '0x' // bytes userData
        ],
        [ // FundManagement funds
          '{feiDAOTimelock}', // address sender = feiDAOTimelock
          false, // bool fromInternalBalance
          '{feiDAOTimelock}', // address payable recipient = feiDAOTimelock
          false, // bool toInternalBalance
        ],
        '0', // uint256 limit
        '1700000000' // uint256 deadline
      ],
      description: 'Swap 5M 4626-fFEI-8 for bb-f-FEI on Balancer'
    },*/
    /*{
      target: 'balancerBoostedFuseFeiLinearPool',
      values: '0',
      method: 'approve(address,uint256)',
      arguments: ['{balancerVault}', '4000000000000000000000000'],
      description: 'Approve 4m bb-f-FEI to trade on Balancer'
    },
    {
      target: 'balancerVault',
      values: '0',
      method: 'swap((bytes32,uint8,address,address,uint256,bytes),(address,bool,address,bool),uint256,uint256)',
      arguments: [
        [ // SingleSwap singleSwap
          '0xd997f35c9b1281b82c8928039d14cddab5e13c2000000000000000000000019c', // bytes32 poolId bb-f-USD
          '0', // SwapKind kind { GIVEN_IN, GIVEN_OUT }
          '{balancerBoostedFuseFeiLinearPool}', // IAsset assetIn = bb-f-FEI
          '{balancerBoostedFuseUsdStablePool}', // IAsset assetOut = bb-f-USD
          '4000000000000000000000000', // uint256 amount = 4M
          '0x' // bytes userData
        ],
        [ // FundManagement funds
          '{feiDAOTimelock}', // address sender = feiDAOTimelock
          false, // bool fromInternalBalance
          '{feiDAOTimelock}', // address payable recipient = feiDAOTimelock
          false, // bool toInternalBalance
        ],
        '0', // uint256 limit = 5M
        '1700000000' // uint256 deadline
      ],
      description: 'Swap 5M bb-f-FEI for bb-f-USD on Balancer'
    }*/
    /*{
      target: 'balancerVault',
      values: '0',
      method: 'batchSwap(uint8,BatchSwapStep[],address[],FundManagement,int256[],uint256)',
      arguments: [
        '0', // enum SwapKind { GIVEN_IN, GIVEN_OUT },
        [ // BatchSwapStep[] swaps
          [
            // bytes32 poolId
            // int256 assetInIndex
            // uint256 assetOutIndex
            // uint256 amount
            // bytes userData
          ]
        ],
        [ // IAsset[] assets

        ],
        [ // FundManagement funds
          '0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c', // address sender = feiDAOTimelock
          false, // bool fromInternalBalance
          '0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c', // address payable recipient = feiDAOTimelock
          false, // bool toInternalBalance
        ],
        [ // int256[] limits

        ],
        // uint256 deadline
      ],
      description: 'Batch swap to get into Balancer pools'
    }*/
  ],
  description: `
Create a "bb-f-usd" Fuse-boosted USD pool on Balancer, containing FEI, DAI, and LUSD. Boosting will use FeiRari (fuse pool 8) to generate additional yield for liquidity providers.

Use 50M$ of stablecoins from the PCV (minted FEI, DAI pulled from Compound, LUSD pulled from B.AMM Liquity) to bootstrap the new bb-f-usd pool.

Forum discussion: https://tribe.fei.money/t/fip-90-fuse-boosted-usd-balancer-pool-bb-f-usd/4023
Snapshot: https://snapshot.org/#/fei.eth/proposal/0xbd8fd65f9b6cc2b44438746bf886d51ebb0f28b3be4fe58ece194d7f1d066ae4
`
};

export default fip_92;
