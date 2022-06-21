import { TemplatedProposalDescription } from '@custom-types/types';

const proposal: TemplatedProposalDescription = {
  title: 'Aura airdrop',
  commands: [
    {
      target: '',
      values: '',
      method: '',
      arguments: (addresses) => [],
      description: ''
    }
  ],
  description: `
  Filled the redirection form https://docs.google.com/forms/d/e/1FAIpQLSdyo0s2c_BIrGhj4atA82x8LVuRORWHySUHNjAMjVEIWjF2sQ/viewform
  
  Redirect 0xc4EAc760C2C631eE0b064E39888b89158ff808B2 (veBalDelegatorPCVDeposit, deployed by deployer.eswak.eth)
  13.94k AURA because holding 247.61k BAL
  
  Redirect 0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148 (eswak.eth)
  30.65k AURA because voted yes with 107.22k veBAL
  
  New receiving address : 0xc44902C03093D52213d20E5b06a0Bda4D9Ce6524 (proxy for VlAuraDelegatorPCVDeposit)
  
  Signature to link eswak.eth & deployer.eswak.eth: https://etherscan.io/verifySig/7230
    
`
};

export default proposal;
