import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { expectApprox, getImpersonatedSigner, resetFork } from '@test/helpers';
import { abi as BoosterABI } from './abis/TurboBooster.sol/TurboBooster.json';
import { abi as SafeABI } from './abis/TurboSafe.sol/TurboSafe.json';
import { abi as MasterABI } from './abis/TurboMaster.sol/TurboMaster.json';
const { Contract } = ethers;

const toBN = ethers.BigNumber.from;

describe.only('Safe boost', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const turboAdminRoleAddress = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d';
  const turboBoosterAddress = '0xf6C7f4a90b10c9EaAF2A6676CE81fe8673453e72';
  const gOhmSafeAddress = '0xD919d318C957cd4684998A54Dc2c8ab9DB9E76Bf';
  const pool8Strategy = '0xf486608dbc7dd0eb80e4b9fa0fdb03e40f414030';
  const turboMasterAddress = '0xf2e513d3b4171bb115cb9ffc45555217fbbbd00c';
  const gOHMAddress = '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f';
  const turboAdminAddress = '';

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
    await resetFork();
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('should be able to boost gOHM vault', async () => {
    const turboAdminSigner = await getImpersonatedSigner(turboAdminRoleAddress);
    const turboBooster = new ethers.Contract(turboBoosterAddress, BoosterABI, turboAdminSigner);
    const gOHMSafe = new ethers.Contract(gOhmSafeAddress, SafeABI, turboAdminSigner);
    const turboMaster = new ethers.Contract(turboMasterAddress, MasterABI, turboAdminSigner);

    const boostAmount = ethers.utils.parseEther('3000');

    const canBoost = await turboMaster.onSafeBoost(gOHMAddress, pool8Strategy, boostAmount);
    console.log({ canBoost });
    await gOHMSafe.boost(pool8Strategy, boostAmount);
  });
});
