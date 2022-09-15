import { TemplatedProposalDescription } from '@custom-types/types';
import { parseEther } from 'ethers/lib/utils';

/*  Day Before runbook */
// 1. Freeze balances and merkle roots
// 2. Update total FEI minted (here and /dao)
// 3. Update contract FEI balances
// 4. Run contract integration test and manually review FEI balances

/* Configuration Constants */

const total = parseEther('12545744'); // 12.545M Fei total
const dripperFeiAmount = parseEther('9000000'); // 9m Fei initially in dripper
const initialFeiAmount = total.sub(dripperFeiAmount); // Remaining Fei for merkle redeemer (3.545m Fei)

//// Smart contract addresses
const BABYLON_ADDRESS = '0x97FcC2Ae862D03143b393e9fA73A32b563d57A6e';
const FRAX_ADDRESS = '0xB1748C79709f4Ba2Dd82834B8c82D4a505003f27';
const OLYMPUS_ADDRESS = '0x245cc372C84B3645Bf0Ffe6538620B04a217988B';
const VESPER_ADDRESS = '0x9520b477Aa81180E6DdC006Fc09Fb6d3eb4e807A';
const RARI_DAI_AGGREGATOR_ADDRESS = '0xafd2aade64e6ea690173f6de59fc09f5c9190d74';
const GNOSIS_SAFE_ADDRESS = '0x7189b2ea41d406c5044865685fedb615626f9afd';
const FUJI_CONTRACT_ADDRESS = '0x1868cBADc11D3f4A12eAaf4Ab668e8aA9a76d790';
const CONTRACT_1_ADDRESS = '0x07197a25bf7297c2c41dd09a79160d05b6232bcf';
const ALOE_ADDRESS_1 = '0x0b76abb170519c292da41404fdc30bb5bef308fc';
const ALOE_ADDRESS_2 = '0x8bc7c34009965ccb8c0c2eb3d4db5a231ecc856c';
const CONTRACT_2_ADDRESS = '0x5495f41144ecef9233f15ac3e4283f5f653fc96c';
const BALANCER_ADDRESS = '0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f';
const CONTRACT_3_ADDRESS = '0xeef86c2e49e11345f1a693675df9a38f7d880c8f';
const CONTRACT_4_ADDRESS = '0xa10fca31a2cb432c9ac976779dc947cfdb003ef0';
const RARI_FOR_ARBITRUM_ADDRESS = '0xa731585ab05fC9f83555cf9Bff8F58ee94e18F85';

// TODO update amounts to be final
//// Smart contract address amounts
const BABYLON_ADDRESS_AMOUNT = '257976130600662761472';
const FRAX_ADDRESS_AMOUNT = '12578161595888433572610048';
const OLYMPUS_ADDRESS_AMOUNT = '9683443928469978549846016';
const VESPER_ADDRESS_AMOUNT = '601072718698082467840000';
const RARI_DAI_AGGREGATOR_ADDRESS_AMOUNT = '420030516070480340844544';
const GNOSIS_SAFE_ADDRESS_AMOUNT = '362039106118678189441024';
const FUJI_CONTRACT_ADDRESS_AMOUNT = '2010865343614417895424';
const CONTRACT_1_ADDRESS_AMOUNT = '417690248180299792384';
const ALOE_ADDRESS_1_AMOUNT = '131398154543181185024';
const ALOE_ADDRESS_2_AMOUNT = '59837970162146975744';
const CONTRACT_2_ADDRESS_AMOUNT = '34458225066045444096';
const BALANCER_ADDRESS_AMOUNT = '15130880917462759424';
const CONTRACT_3_ADDRESS_AMOUNT = '14657785972526270464';
const CONTRACT_4_ADDRESS_AMOUNT = '11465258169975218176';
const RARI_FOR_ARBITRUM_ADDRESS_AMOUNT = parseEther('280000');
/* DAO Vote Commands */

const tip_121b: TemplatedProposalDescription = {
  title: 'Part 2: RariFuse Hack Repayment',
  commands: [
    // 1. Mint FEI directly to redeemer
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.rariMerkleRedeemer, initialFeiAmount],
      description: 'Mint initial Fei amount to the RariMerkleRedeemer'
    },
    {
      target: 'fei',
      values: '0',
      method: 'mint(address,uint256)',
      arguments: (addresses) => [addresses.merkleRedeemerDripper, dripperFeiAmount],
      description: 'Mint remainder of Fei to the MerkleRedeemerDripper'
    },
    // 2. Transfer DAI to the respective affected smart contracts and DAOs
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [FRAX_ADDRESS, FRAX_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to FRAX'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [BABYLON_ADDRESS, BABYLON_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to BABYLON'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [OLYMPUS_ADDRESS, OLYMPUS_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to OLYMPUS'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [VESPER_ADDRESS, VESPER_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to VESPER'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [BALANCER_ADDRESS, BALANCER_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to BALANCER'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [ALOE_ADDRESS_1, ALOE_ADDRESS_1_AMOUNT],
      description: 'Withdraw DAI to ALOE 1'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [ALOE_ADDRESS_2, ALOE_ADDRESS_2_AMOUNT],
      description: 'Withdraw DAI to ALOE 2'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [FUJI_CONTRACT_ADDRESS, FUJI_CONTRACT_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to FUJI'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [GNOSIS_SAFE_ADDRESS, GNOSIS_SAFE_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to GNOSIS_SAFE'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [RARI_DAI_AGGREGATOR_ADDRESS, RARI_DAI_AGGREGATOR_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to RARI AGGREGATOR'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [CONTRACT_1_ADDRESS, CONTRACT_1_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to Contract 1'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [CONTRACT_2_ADDRESS, CONTRACT_2_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to Contract 2'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [CONTRACT_3_ADDRESS, CONTRACT_3_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to Contract 3'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [CONTRACT_4_ADDRESS, CONTRACT_4_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to Contract 4'
    },
    {
      target: 'daiHoldingPCVDeposit',
      values: '0',
      method: 'withdraw(address,uint256)',
      arguments: (addresses) => [RARI_FOR_ARBITRUM_ADDRESS, RARI_FOR_ARBITRUM_ADDRESS_AMOUNT],
      description: 'Withdraw DAI to Rari for Arbitrum'
    },

    // 3. Remove liquidity limits on fuse withdraw guard
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [addresses.rariPool8FeiPCVDeposit, [addresses.daiFixedPricePSM, addresses.fei, '0']],
      description: 'Update Fuse Withdrawal Guard'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [addresses.rariPool8DaiPCVDeposit, [addresses.daiFixedPricePSM, addresses.dai, '0']],
      description: 'Update Fuse Withdrawal Guard'
    },
    {
      target: 'fuseWithdrawalGuard',
      values: '0',
      method: 'setWithdrawInfo(address,(address,address,uint96))',
      arguments: (addresses) => [
        addresses.rariPool8LusdPCVDeposit,
        [addresses.lusdHoldingPCVDeposit, addresses.lusd, '0']
      ],
      description: 'Update Fuse Withdrawal Guard'
    }
  ],
  description: `
  [Part 2: RariFuse Hack Repayment] /n/n
  [<does stuff>] \n\n
  ` // @todo - add description
};

export default tip_121b;
