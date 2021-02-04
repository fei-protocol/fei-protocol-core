const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const Core = contract.fromArtifact('Core');
const Fei = contract.fromArtifact('Fei');
const MockOracle = contract.fromArtifact('MockOracle');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');
const MockCoreRef = contract.fromArtifact('MockCoreRef');
const Tribe = contract.fromArtifact('Tribe');
const MockTribe = contract.fromArtifact('MockTribe');
const TimelockedDelegator = contract.fromArtifact('TimelockedDelegator');
const MockIDO = contract.fromArtifact('MockIDO');
const ForceEth = contract.fromArtifact('ForceEth');
const MockBondingCurve = contract.fromArtifact('MockBondingCurve');
const GenesisGroup = contract.fromArtifact('GenesisGroup');
const MockBondingCurveOracle = contract.fromArtifact('MockBCO');
const MockPool = contract.fromArtifact('MockPool');

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

async function forceEth(to, amount) {
    let forceEth = await ForceEth.new({value: amount});
    await forceEth.forceEth(to);
}

module.exports = {
    // utils
    web3,
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
    MockTribe,
    TimelockedDelegator,
    MockIDO,
    ForceEth,
    MockBondingCurve,
    GenesisGroup,
    MockBondingCurveOracle,
    MockPool,
    // functions
    getCore,
    forceEth
}
