import constructProposal from './constructProposal';

const { web3 } = require('hardhat');
require('dotenv').config();

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function getProposalCalldata() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }
  const proposal = await constructProposal(proposalName);

  const calldata = await web3.eth.abi.encodeFunctionCall(
    {
      name: 'propose',
      type: 'function',
      inputs: [
        {
          type: 'address[]',
          name: 'targets'
        },
        {
          type: 'uint256[]',
          name: 'values'
        },
        {
          type: 'string[]',
          name: 'signatures'
        },
        {
          type: 'bytes[]',
          name: 'calldatas'
        },
        {
          type: 'string',
          name: 'description'
        }
      ]
    },
    [proposal.targets, proposal.values, proposal.signatures, proposal.calldatas, proposal.description]
  );

  console.log(calldata);
}

getProposalCalldata()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
