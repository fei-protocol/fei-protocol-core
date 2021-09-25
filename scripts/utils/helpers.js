require('dotenv').config();

function check(flag, message) {
  if (flag) {
    console.log(`PASS: ${message}`);
  } else {
    throw Error(`FAIL: ${message}`);
  }
}

// The current version of the contracts in the repo uses readOracle as the api
// The old api was peg(), so the currently deployed contracts need manual calling until the upgrade
async function readOracle(oracleRef, web3) {
  const data = await web3.eth.call({ to: oracleRef.address, data: web3.eth.abi.encodeFunctionSignature('peg()') });
  return web3.eth.abi.decodeParameter({ Decimal: { value: 'uint256' } }, data)[0];
}

module.exports = {
  check,
  readOracle
};
