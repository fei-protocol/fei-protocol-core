const GenesisGroup = artifacts.require("GenesisGroup");
const CoreOrchestrator = artifacts.require("CoreOrchestrator");


module.exports = async function(callback) {
  let co = await CoreOrchestrator.deployed();
  const genesis = await GenesisGroup.at(await co.genesisGroup());

  console.log("Genesis Group address:", genesis.address)

  let accounts = await web3.eth.getAccounts();

  let nullAddress = "0x0000000000000000000000000000000000000000";
  let seven = "7000000000000000000";
  let five = "5000000000000000000";
  let one = "1000000000000000000";
  let half = "500000000000000000";

  // Purchase 5 FGEN (account 0)
  await genesis.purchase(accounts[0], five, {
    from: accounts[0],
    value: five
  });

  // Purchase 5 FGEN (account 1)
  await genesis.purchase(accounts[1], five, {
    from: accounts[1],
    value: five,
  });

  // Burn 0.5 FGEN (account 1)
  await genesis.burn(half, {
    from: accounts[1],
  });

  // Transfer 0.5 FGEN  (account 1)
  await genesis.transfer(accounts[2], half, {
    from: accounts[1],
  });

  // Purchase and Redeem FGEN (account 2)
  await genesis.purchase(accounts[2], seven, {
    from: accounts[2],
    value: seven,
  });
//   await genesis.redeem(accounts[2], {
//     from: accounts[2],
//   });

  callback();

}
