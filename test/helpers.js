const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockOracle = contract.fromArtifact('MockOracle');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');
const MockCoreRef = contract.fromArtifact('MockCoreRef');
const Tribe = contract.fromArtifact('Tribe');

const [ userAddress, secondUserAddress, beneficiaryAddress1, beneficiaryAddress2, governorAddress, genesisGroup, keeperAddress, pcvControllerAddress, minterAddress, burnerAddress, revokeAddress ] = accounts;

async function getCore(complete) {
    let core = await Core.new({from: governorAddress});
    await core.setGenesisGroup(genesisGroup, {from: governorAddress});
    if (complete) {
        await core.completeGenesisGroup({from: genesisGroup});
    }

    await core.grantMinter(minterAddress, {from: governorAddress});
    await core.grantBurner(burnerAddress, {from: governorAddress});
    await core.grantPCVController(pcvControllerAddress, {from: governorAddress});
    await core.grantRevoker(revokeAddress, {from: governorAddress});

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
    secondUserAddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    revokeAddress,
    // contracts
    MockEthPCVDeposit,
    Core,
    Fei,
    MockOracle, 
    EthBondingCurve,
    MockCoreRef,
    Tribe,
    // functions
    getCore
}
