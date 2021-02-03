const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockOracle = contract.fromArtifact('MockOracle');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');

const [ userAddress, secondUseraddress, beneficiaryAddress1, beneficiaryAddress2, governorAddress, genesisGroup, keeperAddress ] = accounts;

async function getCore() {
    let core = await Core.new({from: governorAddress});
    await core.setGenesisGroup(genesisGroup, {from: governorAddress});
    await core.completeGenesisGroup({from: genesisGroup});
    return core;
}

module.exports = {
    // utils
    BN,
    expectEvent,
    expectRevert,
    balance,
    time,
    expect,
    // addresses
    userAddress,
    secondUseraddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    // contracts
    MockEthPCVDeposit,
    Core,
    Fei,
    MockOracle, 
    EthBondingCurve,
    // functions
    getCore
}
