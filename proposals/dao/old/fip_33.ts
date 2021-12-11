import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { IERC20, OtcEscrow } from '@custom-types/contracts';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

const BAL_HALF_AMOUNT = ethers.constants.WeiPerEther.mul(100_000); // 100k BAL
const TRIBE_AMOUNT = ethers.constants.WeiPerEther.mul(2_598_000); // 2.598M TRIBE @ 25.98 BAL/TRIBE
const FEI_AMOUNT = ethers.constants.WeiPerEther.mul(2_454_000); // 2.454M FEI @ 24.54 BAL/FEI

const balancerMultisig = '0xb618F903ad1d00d6F7b92f5b0954DcdC056fC533';

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const { fei, tribe, feiDAOTimelock, bal } = addresses;

  if (!tribe || !fei || !feiDAOTimelock || !bal) {
    throw new Error('An environment variable contract address is not set');
  }

  const factory = await ethers.getContractFactory('OtcEscrow');
  const tribeBalOtcEscrow = await factory.deploy(
    balancerMultisig,
    feiDAOTimelock,
    bal,
    tribe,
    BAL_HALF_AMOUNT,
    TRIBE_AMOUNT
  );

  await tribeBalOtcEscrow.deployed();

  logging && console.log('TRIBE/BAL OTC deployed to: ', tribeBalOtcEscrow.address);

  const feiBalOtcEscrow = await factory.deploy(balancerMultisig, feiDAOTimelock, bal, fei, BAL_HALF_AMOUNT, FEI_AMOUNT);

  logging && console.log('FEI/BAL OTC deployed to: ', feiBalOtcEscrow.address);

  return { tribeBalOtcEscrow, feiBalOtcEscrow };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup for FIP-33');

  const bal: IERC20 = contracts.bal as IERC20;

  const signer = await getImpersonatedSigner(balancerMultisig);
  await forceEth(balancerMultisig);

  await bal.connect(signer).approve(addresses.tribeBalOtcEscrow, BAL_HALF_AMOUNT);
  await bal.connect(signer).approve(addresses.feiBalOtcEscrow, BAL_HALF_AMOUNT);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-33');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const feiBalOtcEscrow: OtcEscrow = contracts.feiBalOtcEscrow as OtcEscrow;
  const tribeBalOtcEscrow: OtcEscrow = contracts.tribeBalOtcEscrow as OtcEscrow;

  const fei: IERC20 = contracts.fei as IERC20;
  const tribe: IERC20 = contracts.tribe as IERC20;
  const bal: IERC20 = contracts.bal as IERC20;

  expect(await feiBalOtcEscrow.beneficiary()).to.be.equal(balancerMultisig);
  expect(await feiBalOtcEscrow.recipient()).to.be.equal(addresses.feiDAOTimelock);

  expect(await tribeBalOtcEscrow.beneficiary()).to.be.equal(balancerMultisig);
  expect(await tribeBalOtcEscrow.recipient()).to.be.equal(addresses.feiDAOTimelock);

  expect(await fei.balanceOf(balancerMultisig)).to.be.bignumber.equal(FEI_AMOUNT);
  expect(await tribe.balanceOf(balancerMultisig)).to.be.bignumber.equal(TRIBE_AMOUNT);
  expect(await bal.balanceOf(addresses.feiDAOTimelock)).to.be.bignumber.equal(BAL_HALF_AMOUNT.mul(2));
};
