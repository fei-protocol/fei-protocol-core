import hre, { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

/*
FIP-79
DEPLOY ACTIONS:

1. OTCEscrow

*/

const tribeAmount = '3747957360000000000000000';
const ohmAmount = '577180000000000000000';

const ohmTreasury = '0x9A315BdF513367C0377FB36545857d12e85813Ef';

const gOHM = '0x0ab87046fBb341D058F17CBC4c1133F25a20a52f';

// for setup
const gOHMWhale = '0x59Bd6774C22486D9F4FAb2D448dCe4F892a9Ae25';

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { tribe, feiDAOTimelock } = addresses;

  // 1. Deploy otc escrow
  const ohmEscrow = await (
    await ethers.getContractFactory('OtcEscrow')
  ).deploy(
    feiDAOTimelock, // beneficiary_,
    ohmTreasury, // recipient_,
    tribe, // receivedToken_,
    gOHM, // sentToken_,
    tribeAmount, // receivedAmount_,
    ohmAmount // sentAmount_
  );

  logging && console.log('escrow: ', ohmEscrow.address);

  return {
    ohmEscrow
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup');

  const gohmERC20 = await ethers.getContractAt('IERC20', gOHM);
  const signer = await getImpersonatedSigner(gOHMWhale);
  await forceEth(gOHMWhale);

  await gohmERC20.connect(signer).transfer(addresses.ohmEscrow, ohmAmount);
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { tribe } = contracts;

  const gohmERC20 = await ethers.getContractAt('IERC20', gOHM);
  expect(await tribe.balanceOf(ohmTreasury)).to.be.equal(tribeAmount);
  expect(await gohmERC20.balanceOf(addresses.feiDAOTimelock)).to.be.equal(ohmAmount);
};
