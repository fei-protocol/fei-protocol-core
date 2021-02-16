const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");

const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const BondingCurveOracle = contract.fromArtifact('BondingCurveOracle');
const Core = contract.fromArtifact('Core');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');
const Fei = contract.fromArtifact('Fei');
const ForceEth = contract.fromArtifact('ForceEth');
const GenesisGroup = contract.fromArtifact('GenesisGroup');
const IDO = contract.fromArtifact('IDO');
const TimelockedDelegator = contract.fromArtifact('TimelockedDelegator');
const Tribe = contract.fromArtifact('Tribe');
const UniswapOracle = contract.fromArtifact('UniswapOracle');

const MockBondingCurve = contract.fromArtifact('MockBondingCurve');
const MockBondingCurveOracle = contract.fromArtifact('MockBCO');
const MockCoreRef = contract.fromArtifact('MockCoreRef');
const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const MockIDO = contract.fromArtifact('MockIDO');
const MockOracle = contract.fromArtifact('MockOracle');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockPairTrade = contract.fromArtifact('MockUniswapV2PairTrade');
const MockPool = contract.fromArtifact('MockPool');
const MockRouter = contract.fromArtifact('MockRouter');
const MockTribe = contract.fromArtifact('MockTribe');


const [ userAddress, secondUserAddress, beneficiaryAddress1, beneficiaryAddress2, governorAddress, genesisGroup, keeperAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress ] = accounts;

async function getCore(complete) {
    let core = await Core.new({from: governorAddress});
    await core.setGenesisGroup(genesisGroup, {from: governorAddress});
    if (complete) {
        await core.completeGenesisGroup({from: genesisGroup});
    }

    await core.grantMinter(minterAddress, {from: governorAddress});
    await core.grantBurner(burnerAddress, {from: governorAddress});
    await core.grantPCVController(pcvControllerAddress, {from: governorAddress});
    await core.grantGuardian(guardianAddress, {from: governorAddress});

    return core;
}

async function forceEth(to, amount) {
    let forceEth = await ForceEth.new({value: amount});
    await forceEth.forceEth(to);
}

module.exports = {
    // utils
    ZERO_ADDRESS,
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
    guardianAddress,
    // contracts
    BondingCurveOracle,
    Core,
    EthBondingCurve,
    Fei,
    ForceEth,
    GenesisGroup,
    IDO,
    TimelockedDelegator,
    Tribe,
    UniswapOracle,
    // mock contracts
    MockBondingCurve,
    MockBondingCurveOracle,
    MockCoreRef,
    MockEthPCVDeposit,
    MockIDO,
    MockOracle, 
    MockPair,
    MockPairTrade,
    MockPool,
    MockRouter,
    MockTribe,
    // functions
    getCore,
    forceEth
}
