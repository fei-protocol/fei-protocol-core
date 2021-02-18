const { ZERO_ADDRESS, MAX_UINT256 } = require("@openzeppelin/test-helpers/src/constants");

const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, ether, balance, time } = require('@openzeppelin/test-helpers');

var chai = require('chai');

//use default BigNumber
chai.use(require('chai-bn')(BN));

const { expect } = chai;

const BondingCurveOracle = contract.fromArtifact('BondingCurveOracle');
const Core = contract.fromArtifact('Core');
const EthBondingCurve = contract.fromArtifact('EthBondingCurve');
const EthUniswapPCVController = contract.fromArtifact('EthUniswapPCVController');
const EthUniswapPCVDeposit = contract.fromArtifact('EthUniswapPCVDeposit');
const Fei = contract.fromArtifact('Fei');
const FeiRouter = contract.fromArtifact('FeiRouter');
const ForceEth = contract.fromArtifact('ForceEth');
const GenesisGroup = contract.fromArtifact('GenesisGroup');
const IDO = contract.fromArtifact('IDO');
const Roots = contract.fromArtifact('RootsWrapper');
const TimelockedDelegator = contract.fromArtifact('TimelockedDelegator');
const Tribe = contract.fromArtifact('Tribe');
const UniswapIncentive = contract.fromArtifact('UniswapIncentive');
const UniswapOracle = contract.fromArtifact('UniswapOracle');


const MockBondingCurve = contract.fromArtifact('MockBondingCurve');
const MockBondingCurveOracle = contract.fromArtifact('MockBCO');
const MockCoreRef = contract.fromArtifact('MockCoreRef');
const MockERC20 = contract.fromArtifact('MockERC20');
const MockEthPCVDeposit = contract.fromArtifact('MockEthPCVDeposit');
const MockIDO = contract.fromArtifact('MockIDO');
const MockIncentive = contract.fromArtifact('MockUniswapIncentive');
const MockOracle = contract.fromArtifact('MockOracle');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockPairTrade = contract.fromArtifact('MockUniswapV2PairTrade');
const MockPCVDeposit = contract.fromArtifact('MockEthUniswapPCVDeposit');
const MockPool = contract.fromArtifact('MockPool');
const MockRouter = contract.fromArtifact('MockRouter');
const MockTribe = contract.fromArtifact('MockTribe');
const MockUniswapIncentive = contract.fromArtifact('MockUniswapIncentive');
const MockWeth = contract.fromArtifact('MockWeth');

const [ userAddress, secondUserAddress, beneficiaryAddress1, beneficiaryAddress2, governorAddress, genesisGroup, keeperAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress, incentivizedAddress, operatorAddress ] = accounts;

async function getCore(complete) {
    let core = await Core.new({from: governorAddress});
    await core.init({from: governorAddress});

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

async function expectApprox(actual, expected) {
    let delta = expected.div(new BN('1000'));
    expect(actual).to.be.bignumber.closeTo(expected, delta);
}

module.exports = {
    // utils
    ZERO_ADDRESS,
    MAX_UINT256,
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
    incentivizedAddress,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress,
    operatorAddress,
    // contracts
    BondingCurveOracle,
    Core,
    EthBondingCurve,
    EthUniswapPCVController,
    EthUniswapPCVDeposit,
    Fei,
    FeiRouter,
    ForceEth,
    GenesisGroup,
    Roots,
    IDO,
    TimelockedDelegator,
    Tribe,
    UniswapIncentive,
    UniswapOracle,
    // mock contracts
    MockBondingCurve,
    MockBondingCurveOracle,
    MockCoreRef,
    MockEthPCVDeposit,
    MockERC20,
    MockIDO,
    MockIncentive,
    MockOracle, 
    MockPair,
    MockPairTrade,
    MockPCVDeposit,
    MockPool,
    MockRouter,
    MockTribe,
    MockUniswapIncentive,
    MockWeth,
    // functions
    getCore,
    forceEth,
    expectApprox,
    ether
}
