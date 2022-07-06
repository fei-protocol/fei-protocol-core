import { ethers } from 'hardhat';
import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'TIP-XYZ: Stake 10,000 ETH in RocketPool',
  commands: [
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'setSafeAddress(address)',
      arguments: (addresses) => [addresses.rocketPoolPCVDeposit],
      description: 'Add rocketPoolPCVDeposit to safe address list'
    },
    {
      target: 'pcvGuardian',
      values: '0',
      method: 'withdrawToSafeAddress(address,address,uint256,bool,bool)',
      arguments: (addresses) => [
        addresses.ethPSM,
        addresses.rocketPoolPCVDeposit,
        ethers.utils.parseEther('10000'),
        false,
        false
      ],
      description: 'Move 10,000 WETH to rocketPoolPCVDeposit'
    },
    {
      target: 'collateralizationOracle',
      values: '0',
      method: 'addDeposit(address)',
      arguments: (addresses) => [addresses.rocketPoolPCVDeposit],
      description: 'Add rocketPoolPCVDeposit to CR Oracle'
    }
  ],
  description: `TODO`
};

export default proposal;
