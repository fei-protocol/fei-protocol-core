import hre from 'hardhat';
import { forceEth } from '@test/integration/setup/utils';
import { getAddress } from 'ethers/lib/utils';
import { BigNumber, constants } from 'ethers';

const debtorContractAddress = '0x32075bad9050d4767018084f0cb87b3182d36c45';

const underlyings = {
  '0x0000000000000000000000000000000000000000': 'ETH',
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca': 'FEI',
  '0x853d955acef822db058eb8505911ed77f175b99e': 'FRAX',
  '0x03ab458634910aad20ef5f1c8ee96f1d6ac54919': 'RAI',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
  '0x5f98805a4e8be255a32880fdec7f6728c6568ba0': 'LUSD',
  '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0': 'wstETH',
  '0xa693b19d2931d498c5b318df961919bb4aee87a5': 'USTw',
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT'
};

const ctokens = {
  '0xd8553552f8868c1ef160eedf031cf0bcf9686945': 'Pool 8: FEI',
  '0xbb025d470162cc5ea24daf7d4566064ee7f5f111': 'Pool 8: ETH',
  '0x7e9ce3caa9910cc048590801e64174957ed41d43': 'Pool 8: DAI',
  '0x7259ee19d6b5e755e7c65cecfd2466c09e251185': 'Pool 8: wstETH',
  '0x647a36d421183a0a9fa62717a64b664a24e469c7': 'Pool 8: LUSD',
  '0xfa1057d02a0c1a4885851e3f4fd496ee7d38f56e': 'Pool 18: ETH',
  '0x8e4e0257a4759559b4b1ac087fe8d80c63f20d19': 'Pool 18: DAI',
  '0x6f95d4d251053483f41c8718c30f4f3c404a8cf2': 'Pool 18: USDC',
  '0x3e5c122ffa75a9fe16ec0c69f7e9149203ea1a5d': 'Pool 18: FRAX',
  '0x17b1a2e012cc4c31f83b90ff11d3942857664efc': 'Pool 18: FEI',
  '0x51ff03410a0da915082af444274c381bd1b4cdb1': 'Pool 18: RAI',
  '0xb7fe5f277058b3f9eabf6e0655991f10924bfa54': 'Pool 18: USTw',
  '0x9de558fce4f289b305e38abe2169b75c626c114e': 'Pool 27: FRAX',
  '0xda396c927e3e6bef77a98f372ce431b49edec43d': 'Pool 27: FEI',
  '0xf148cdec066b94410d403ac5fe1bb17ec75c5851': 'Pool 27: ETH',
  '0x0c402f06c11c6e6a6616c98868a855448d4cfe65': 'Pool 27: USTw',
  '0x26267e41ceca7c8e0f143554af707336f27fa051': 'Pool 127: ETH',
  '0xebe0d1cb6a0b8569929e062d67bfbc07608f0a47': 'Pool 127: USDC',
  '0x4b68ef5ab32261082df1a6c9c6a89ffd5ef168b1': 'Pool 127: DAI',
  '0xe097783483d1b7527152ef8b150b99b9b2700c8d': 'Pool 127: USDT',
  '0x0f0d710911fb37038b3ad88fc43ddad4edbe16a5': 'Pool 127: USTw',
  '0x8922c1147e141c055fddfc0ed5a119f3378c8ef8': 'Pool 127: FRAX',
  '0x7dbc3af9251756561ce755fcc11c754184af71f7': 'Pool 144: ETH',
  '0x3a2804ec0ff521374af654d8d0daa1d1ae1ee900': 'Pool 144: FEI',
  '0xa54c548d11792b3d26ad74f5f899e12cdfd64fd6': 'Pool 144: FRAX',
  '0xa6c25548df506d84afd237225b5b34f2feb1aa07': 'Pool 144: DAI',
  '0xfbd8aaf46ab3c2732fa930e5b343cd67cea5054c': 'Pool 146: ETH',
  '0x49da42a1eca4ac6ca0c6943d9e5dc64e4641e0e3': 'Pool 146: wstETH',
  '0xe14c2e156a3f310d41240ce8760eb3cb8a0ddbe3': 'Pool 156: USTw',
  '0x001e407f497e024b9fb1cb93ef841f43d645ca4f': 'Pool 156: FEI',
  '0x5cadc2a04921213de60b237688776e0f1a7155e6': 'Pool 156: FRAX',
  '0x9cd060a4855290bf0c5aed266abe119ff3b01966': 'Pool 156: DAI',
  '0x74897c0061adeec84d292e8900c7bdd00b3388e4': 'Pool 156: LUSD',
  '0x88d3557eb6280cc084ca36e425d6bc52d0a04429': 'Pool 156: USDC',
  '0xe92a3db67e4b6ac86114149f522644b34264f858': 'Pool 156: ETH'
};

async function getFuseBadDebt() {
  // fork mainnet so that we can call borrowBalanceCurrent
  //
  // lol
  // lmao
  //
  // (this also allows us to get historical debt amounts by changing the fork block)

  const debt = {
    ETH: BigNumber.from(0),
    FEI: BigNumber.from(0),
    FRAX: BigNumber.from(0),
    RAI: BigNumber.from(0),
    DAI: BigNumber.from(0),
    USDC: BigNumber.from(0),
    LUSD: BigNumber.from(0),
    USTw: BigNumber.from(0),
    USDT: BigNumber.from(0),
    WETH: BigNumber.from(0),
    wstETH: BigNumber.from(0)
  };

  const signer = (await hre.ethers.getSigners())[0];
  await forceEth(signer.address);

  for (const ctokenAddress of Object.keys(ctokens)) {
    const ctoken = await hre.ethers.getContractAt('CTokenFuse', ctokenAddress, signer);
    const underlyingAddress = (await ctoken.underlying()).toLowerCase();
    const debtAmount = await ctoken.callStatic.borrowBalanceCurrent(getAddress(debtorContractAddress));
    if (!debtAmount.isZero()) {
      const collateralName = underlyings[underlyingAddress];
      debt[collateralName] = debt[collateralName].add(debtAmount);
      console.log(`Added ${collateralName} debt of ${debtAmount} from ${ctokens[ctokenAddress]}`);
    }
  }

  debt.ETH = debt.ETH.div(constants.WeiPerEther);
  debt.FEI = debt.FEI.div(constants.WeiPerEther);
  debt.FRAX = debt.FRAX.div(constants.WeiPerEther);
  debt.RAI = debt.RAI.div(constants.WeiPerEther);
  debt.DAI = debt.DAI.div(constants.WeiPerEther);
  debt.USDC = debt.USDC.div(1e6);
  debt.LUSD = debt.LUSD.div(constants.WeiPerEther);
  debt.USTw = debt.USTw.div(1e6);
  debt.USDT = debt.USDT.div(1e6);

  console.log(`\nTotal debt as of block ${hre.ethers.provider.blockNumber} for address ${debtorContractAddress}`);
  console.log(`--------------------------`);
  for (const key of Object.keys(debt)) {
    if (!debt[key].isZero()) {
      console.log(`${key}: ${Number(debt[key].toString()).toLocaleString()}`);
    }
  }
}

getFuseBadDebt()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
