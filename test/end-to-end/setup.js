class TestEnvCoordinator {
  // Class to coordinate the setting up of a Test environment 
  // TODO: handle forking from latest block associated with an upgrade
  constructor(forkMainnet, version, validationMode) {
    this.forkMainnet = forkMainnet;

    let contracts;
    if (this.forkMainnet) {
      contracts = await this.loadMainnetContract(version)
    } else {
      contracts = await this.deployContracts() 
      await this.initialiseAccounts()
    }

    // checkout syncPool in deploy scripts

    if (validationMode) {
      // run various validation mode setup scripts

    }

    return { contracts }
  }
  
  async loadMainnetContract() {
    // read from address.json
    // 
  }

  async deployContracts() {
    const contractsToDeploy = [];

    for (const contract in contractsToDeploy) {
      await this.deployContract(contract);
    }
  }

  async deployContract() {
    // TODO
    console.log('forkMainnet: ', await this.forkMainnet);
  }

  async manipulateChainlinkOracleLocally() {

  }
}

module.exports = TestEnvCoordinator;
