import { CToken, CTokenFuse, FuseFixer__factory, FuseFixer } from '@custom-types/contracts';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth, forceEthMultiple, forceSpecificEth } from '@test/integration/setup/utils';
import { BigNumber, utils } from 'ethers';
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
  await fuseFixer.deployTransaction.wait();

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
    '0xa693B19d2931d498c5B318dF961919BB4aee87a5',
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
  await ustw.transfer(addresses.fuseFixer, utils.parseEther('3000000').div(1e12));
  await usdt.transfer(addresses.fuseFixer, utils.parseEther('150000').div(1e12));

  await forceSpecificEth(addresses.fuseFixer, utils.parseEther('6500').toString());
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
  const debtor = '0x32075bAd9050d4767018084F0Cb87b3182D36C45';

  const ctokens = [
    '0xd8553552f8868C1Ef160eEdf031cF0BCf9686945', // Pool 8: FEI
    '0xbB025D470162CC5eA24daF7d4566064EE7f5F111', // Pool 8: ETH
    '0x7e9cE3CAa9910cc048590801e64174957Ed41d43', // Pool 8: DAI
    '0x7259eE19D6B5e755e7c65cECfd2466C09E251185', // Pool 8: wstETH
    '0x647A36d421183a0a9Fa62717a64B664a24E469C7', // Pool 8: LUSD
    '0xFA1057d02A0C1a4885851e3F4fD496Ee7D38F56e', // Pool 18: ETH
    '0x8E4E0257A4759559B4B1AC087fe8d80c63f20D19', // Pool 18: DAI
    '0x6f95d4d251053483f41c8718C30F4F3C404A8cf2', // Pool 18: USDC
    '0x3E5C122Ffa75A9Fe16ec0c69F7E9149203EA1A5d', // Pool 18: FRAX
    '0x17b1A2E012cC4C31f83B90FF11d3942857664efc', // Pool 18: FEI
    '0x51fF03410a0dA915082Af444274C381bD1b4cDB1', // Pool 18: RAI
    '0xB7FE5f277058b3f9eABf6e0655991f10924BFA54', // Pool 18: USTw
    '0x9de558FCE4F289b305E38ABe2169b75C626c114e', // Pool 27: FRAX
    '0xda396c927e3e6BEf77A98f372CE431b49EdEc43D', // Pool 27: FEI
    '0xF148cDEc066b94410d403aC5fe1bb17EC75c5851', // Pool 27: ETH
    '0x0C402F06C11c6e6A6616C98868A855448d4CfE65', // Pool 27: USTw
    '0x26267e41CeCa7C8E0f143554Af707336f27Fa051', // Pool 127: ETH
    '0xEbE0d1cb6A0b8569929e062d67bfbC07608f0A47', // Pool 127: USDC
    '0x4B68ef5AB32261082DF1A6C9C6a89FFD5eF168B1', // Pool 127: DAI
    '0xe097783483D1b7527152eF8B150B99B9B2700c8d', // Pool 127: USDT
    '0x0F0d710911FB37038b3AD88FC43DDAd4Edbe16A5', // Pool 127: USTw
    '0x8922C1147E141C055fdDfc0ED5a119f3378c8ef8', // Pool 127: FRAX
    '0x7DBC3aF9251756561Ce755fcC11c754184Af71F7', // Pool 144: ETH
    '0x3a2804ec0Ff521374aF654D8D0daA1d1aE1ee900', // Pool 144: FEI
    '0xA54c548d11792b3d26aD74F5f899e12CDfD64Fd6', // Pool 144: FRAX
    '0xA6C25548dF506d84Afd237225B5B34F2Feb1aa07', // Pool 144: DAI
    '0xfbD8Aaf46Ab3C2732FA930e5B343cd67cEA5054C', // Pool 146: ETH
    '0x49dA42a1EcA4AC6cA0C6943d9E5dc64e4641e0E3', // Pool 146: wstETH
    '0xe14c2e156A3f310d41240Ce8760eB3cb8a0dDBE3', // Pool 156: USTw
    '0x001E407f497e024B9fb1CB93ef841F43D645CA4F', // Pool 156: FEI
    '0x5CaDc2a04921213DE60B237688776e0F1A7155E6', // Pool 156: FRAX
    '0x9CD060A4855290bf0c5aeD266aBe119FF3b01966', // Pool 156: DAI
    '0x74897C0061ADeec84D292e8900c7BDD00b3388e4', // Pool 156: LUSD
    '0x88d3557eB6280CC084cA36e425d6BC52d0A04429', // Pool 156: USDC
    '0xe92a3db67e4b6AC86114149F522644b34264f858' // Pool 156: ETH
  ];

  // Verify that the borrowBalanceCurrent for the debtor is zero for each ctoken
  for (const ctokenAddress of ctokens) {
    const ctoken = await hre.ethers.getContractAt('CTokenFuse', ctokenAddress);
    const debt = await ctoken.callStatic.borrowBalanceCurrent(debtor);

    if (debt.gt(0)) {
      throw new Error(`Debt for ctoken ${ctokenAddress} is greater than 0: ${debt}`);
    }
  }

  const fuseFixer = contracts.fuseFixer as FuseFixer;

  // Copied from smart contract
  const underlyings = [
    '0x0000000000000000000000000000000000000000', // ETH
    '0x956F47F50A910163D8BF957Cf5846D573E7f87CA', // FEI
    '0x853d955aCEf822Db058eb8505911ED77F175b99e', // FRAX
    '0x03ab458634910AaD20eF5f1C8ee96F1D6ac54919', // RAI
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0', // LUSD
    '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0', // wstETH
    '0xa693B19d2931d498c5B318dF961919BB4aee87a5', // USTw
    '0xdAC17F958D2ee523a2206206994597C13D831ec7' // USDT
  ];

  for (const underlying of underlyings) {
    const debt = await fuseFixer.callStatic.getTotalDebt(underlying);
    if (!debt.eq(BigNumber.from(0))) {
      throw new Error('Debt for ' + underlying + ' is not zero: ' + debt.toString());
    }
  }
};

export { deploy, setup, teardown, validate };
