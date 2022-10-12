import { TemplatedProposalDescription } from '@custom-types/types';

const fip_x: TemplatedProposalDescription = {
  title: 'Verify Rari deprecation proposal',
  commands: [
    // await controller.methods.setFundRebalancer("0x8ace03fc45139fddba944c6a4082b604041d19fc")
    // 0x66f4856F1BBD1eb09e1C8d9D646f5A3a193dA569
    {
      target: 'rariUSDCPoolControllerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => ['0x8ace03fc45139fddba944c6a4082b604041d19fc'],
      description: ''
    },
    // await controller.methods.setFundRebalancer("0x8ace03fc45139fddba944c6a4082b604041d19fc")
    // 0xaFD2AaDE64E6Ea690173F6DE59Fc09F5C9190d74
    {
      target: 'rariDAIPoolControllerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => ['0x8ace03fc45139fddba944c6a4082b604041d19fc'],
      description: ''
    },
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => ['0x8ace03fc45139fddba944c6a4082b604041d19fc'],
      description: ''
    },
    // await manager.methods.depositFees()
    // 0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'setFundRebalancer(address)',
      arguments: (addresses) => ['0x8ace03fc45139fddba944c6a4082b604041d19fc'],
      description: ''
    },
    // await manager.methods.depositFees()
    // 0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'depositFees()',
      arguments: (addresses) => [],
      description: ''
    },
    // await manager.methods.depositFees()
    // 0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'depositFees()',
      arguments: (addresses) => [],
      description: ''
    },
    // await manager.methods.withdraw("USDC", "134818277836212805900127")
    // 0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a
    {
      target: 'rariRSPTFundManagerProxy',
      values: '0',
      method: 'withdraw(string,uint256)',
      arguments: (addresses) => ['USDC', '134818277836212805900127'],
      description: ''
    },
    // await manager.methods.withdraw("DAI", "159312000000000000000000")
    // 0xB465BAF04C087Ce3ed1C266F96CA43f4847D9635
    {
      target: 'rariDAIPoolManagerProxy',
      values: '0',
      method: 'withdraw(string,uint256)',
      arguments: (addresses) => ['DAI', '159312000000000000000000'],
      description: ''
    },

    // await erc20.methods.transfer("0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F", "336235000000")
    // 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    {
      target: 'usdc',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.fuseMultisig, '336235000000'],
      description: ''
    },

    // await erc20.methods.transfer("0x5eA4A9a7592683bF0Bc187d6Da706c6c4770976F", "94218000000000000000000")
    // 0x6B175474E89094C44Da98b954EedeAC495271d0F
    {
      target: 'dai',
      values: '0',
      method: 'transfer(address,uint256)',
      arguments: (addresses) => [addresses.fuseMultisig, '94218000000000000000000'],
      description: ''
    },

    // await timelock.methods.setPendingAdmin("0x6F6580285a63f1e886548458f427f8695BA1a563")
    // 0x8ace03fc45139fddba944c6a4082b604041d19fc
    {
      target: 'rariTimelock',
      values: '0',
      method: 'setPendingAdmin(address)',
      arguments: (addresses) => [addresses.daoTimelockBurner],
      description: ''
    },
    {
      target: 'daoTimelockBurner',
      values: '0',
      method: 'acceptRariDAOTimelockAdmin()',
      arguments: (addresses) => [],
      description: ''
    }
  ],
  description: `
  Verify Rari deprecation proposal
  `
};

export default fip_x;
