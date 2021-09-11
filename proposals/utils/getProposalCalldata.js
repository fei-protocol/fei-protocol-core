const { web3 } = require('hardhat');

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */ 
export default async function getProposalCalldata(proposal, logging = false) {
  const calldata = await web3.eth.abi.encodeFunctionCall({
    name: 'propose',
    type: 'function',
    inputs: [{
      type: 'address[]',
      name: 'targets'
    }, {
      type: 'uint256[]',
      name: 'values'
    }, {
      type: 'string[]',
      name: 'signatures'
    }, {
      type: 'bytes[]',
      name: 'calldatas'
    }, {
      type: 'string',
      name: 'description'
    }]
  }, [proposal.targets, proposal.values, proposal.signatures, proposal.calldatas, proposal.description]);
  
  logging && console.log(`Calldata: ${calldata}`);
  return calldata;
}
