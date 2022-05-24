import { FuseFixer__factory } from '@custom-types/contracts';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth, forceEthMultiple } from '@test/integration/setup/utils';
import { utils } from 'ethers';
import hre from 'hardhat';

/*
Withdraw FEI from Aave and Compound
*/

const fipNumber = 'repay_fuse_bad_debt'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const fuseFixerFactory = (await hre.ethers.getContractFactory('FuseFixer')) as FuseFixer__factory;
  const fuseFixer = await fuseFixerFactory.deploy(addresses.core);

  return { fuseFixer };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // acquire assets for repayment
  //
  // where to get (testing only):
  // amount     token     erc20 address                                 where to get
  // 6114       eth   --> 0x0000000000000000000000000000000000000000 // 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5 (ceth)
  // 20,325,623 fei   --> 0x956F47F50A910163D8BF957Cf5846D573E7f87CA // 0xbC9C084a12678ef5B516561df902fdc426d95483 (optimistic timelock)
  // 13,200,967 frax  --> 0x853d955aCEf822Db058eb8505911ED77F175b99e // 0xd632f22692fac7611d2aa1c0d552930d43caed3b (frax-3crv-f)
  // 31,688     rai   --> 0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919 // 0xc9BC48c72154ef3e5425641a3c747242112a46AF (arai)
  // 14,312,434 dai   --> 0x6B175474E89094C44Da98b954EedeAC495271d0F // 0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643 (cdai)
  // 10,073,986 usdc  --> 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 // 0x0A59649758aa4d66E25f08Dd01271e891fe52199 (psm-usdc-a)
  // 1,955,846  lusd  --> 0x5f98805A4E8be255a32880FDeC7F6728C6568bA0 // 0x66017d22b0f8556afdd19fc67041899eb65a21bb (liquidity stability pool)
  // 2,793,119  ustw  --> 0xa47c8bf37f92aBed4A126BDA807A7b7498661acD // 0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2 (ftx exchange)
  // 133,178    usdt  --> 0xdAC17F958D2ee523a2206206994597C13D831ec7 // 0x5754284f345afc66a98fbb0a0afe71e0f007b949 (tether treasury)

  // give eth to each of the signers
  await forceEthMultiple([
    '0xbC9C084a12678ef5B516561df902fdc426d95483',
    '0xd632f22692fac7611d2aa1c0d552930d43caed3b',
    '0xc9BC48c72154ef3e5425641a3c747242112a46AF',
    '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
    '0x0A59649758aa4d66E25f08Dd01271e891fe52199',
    '0x66017d22b0f8556afdd19fc67041899eb65a21bb',
    '0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2',
    '0x5754284f345afc66a98fbb0a0afe71e0f007b949'
  ]);

  const fei = await hre.ethers.getContractAt(
    'ERC20',
    '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
    await getImpersonatedSigner('0xbC9C084a12678ef5B516561df902fdc426d95483')
  );
  const frax = await hre.ethers.getContractAt(
    'ERC20',
    '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    await getImpersonatedSigner('0xd632f22692fac7611d2aa1c0d552930d43caed3b')
  );
  const rai = await hre.ethers.getContractAt(
    'ERC20',
    '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919',
    await getImpersonatedSigner('0xc9BC48c72154ef3e5425641a3c747242112a46AF')
  );
  const dai = await hre.ethers.getContractAt(
    'ERC20',
    '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    await getImpersonatedSigner('0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643')
  );
  const usdc = await hre.ethers.getContractAt(
    'ERC20',
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    await getImpersonatedSigner('0x0A59649758aa4d66E25f08Dd01271e891fe52199')
  );
  const lusd = await hre.ethers.getContractAt(
    'ERC20',
    '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
    await getImpersonatedSigner('0x66017d22b0f8556afdd19fc67041899eb65a21bb')
  );
  const ustw = await hre.ethers.getContractAt(
    'ERC20',
    '0xa47c8bf37f92aBed4A126BDA807A7b7498661acD',
    await getImpersonatedSigner('0x2faf487a4414fe77e2327f0bf4ae2a264a776ad2')
  );
  const usdt = await hre.ethers.getContractAt(
    'ERC20',
    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    await getImpersonatedSigner('0x5754284f345afc66a98fbb0a0afe71e0f007b949')
  );

  await fei.transfer(addresses.fuseFixer, utils.parseEther('21000000'));
  await frax.transfer(addresses.fuseFixer, utils.parseEther('14000000'));
  await rai.transfer(addresses.fuseFixer, utils.parseEther('32000'));
  await dai.transfer(addresses.fuseFixer, utils.parseEther('15000000'));
  await usdc.transfer(addresses.fuseFixer, utils.parseEther('11000000').div(1e12));
  await lusd.transfer(addresses.fuseFixer, utils.parseEther('2000000'));
  await ustw.transfer(addresses.fuseFixer, utils.parseEther('3000000'));
  await usdt.transfer(addresses.fuseFixer, utils.parseEther('150000').div(1e12));

  // contract should now have enough to repayBorrowBehalf everything
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in validate for fip${fipNumber}`);
};

export { deploy, setup, teardown, validate };
