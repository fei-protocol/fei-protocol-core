import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { expectApprox, getImpersonatedSigner, resetFork } from '@test/helpers';
import { abi as PCVDepositAbi } from '../../../artifacts/contracts/pcv/compound/ERC20CompoundPCVDeposit.sol/ERC20CompoundPCVDeposit.json';
import { forceEth } from '../setup/utils';
const { Contract } = ethers;

const toBN = ethers.BigNumber.from;

describe.only('Turbo PCV deposit', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;
  let turboFusePCVDeposit: any;
  const depositAmount = ethers.utils.parseEther('1000000');

  const laasMultisigAddress = '0xb230B535D2cf009Bdc9D7579782DE160b795d5E8';

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

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);

    const signer = (await ethers.getSigners())[0];
    turboFusePCVDeposit = new ethers.Contract(contractAddresses.turboFusePCVDepositAddress, PCVDepositAbi, signer);

    const laasMultisigSigner = await getImpersonatedSigner(laasMultisigAddress);

    // Transfer 1M Fei
    await forceEth(laasMultisigAddress);
    const fei = contracts.fei;
    await fei.connect(laasMultisigSigner).transfer(turboFusePCVDeposit.address, depositAmount);

    const balanceOfPCVDeposit = await fei.balanceOf(turboFusePCVDeposit.address);
    expect(balanceOfPCVDeposit).to.be.bignumber.equal(depositAmount);
  });

  it('should be able to deposit from Laas multisig', async () => {
    await turboFusePCVDeposit.deposit();
    expectApprox(await turboFusePCVDeposit.balance(), depositAmount, '100');
  });

  it('should be able to withdraw', async () => {
    await turboFusePCVDeposit.deposit();

    const withdrawAddress = '0xd1709e3B4e7f8854895770c7c97Cb8e8323C7D48';
    const governorSigner = await getImpersonatedSigner(contractAddresses.feiDAOTimelock);
    await turboFusePCVDeposit.connect(governorSigner).withdraw(withdrawAddress, depositAmount);

    const receivedBalance = await contracts.fei.balanceOf(withdrawAddress);
    expect(receivedBalance).to.equal(depositAmount);
  });
});
