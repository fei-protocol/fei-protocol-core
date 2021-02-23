const GenesisGroup = artifacts.require("GenesisGroup");
const CoreOrchestrator = artifacts.require("CoreOrchestrator");


module.exports = async function(callback) {
  let co = await CoreOrchestrator.deployed();
  const genesis = await GenesisGroup.at(await co.genesisGroup());

  console.log("Genesis Group address:", genesis.address)

  let accounts = await web3.eth.getAccounts();

  let five = "5000000000000000000";
  let tenThousand = "10000000000000000000000";

  // Purchase 5 FGEN (account 0)
  await genesis.purchase(accounts[0], tenThousand, {
    from: accounts[0],
    value: tenThousand
  });

  // Purchase 5 FGEN (account 1)
  await genesis.purchase(accounts[1], five, {
    from: accounts[1],
    value: five,
  });

  callback();

}
