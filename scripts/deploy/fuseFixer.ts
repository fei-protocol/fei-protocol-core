import { DeployUpgradeFunc } from '@custom-types/types';
import { ethers } from 'hardhat';

export const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const core = '0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9';

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  const fuseFixerFactory = await ethers.getContractFactory('FuseFixer');
  const fuseFixer = await fuseFixerFactory.deploy(core);
  await fuseFixer.deployTransaction.wait();

  console.log('FuseFixer deployed to: ', fuseFixer.address);

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
    console.log(`Total debt for ${underlying} is ${debt.toString()}`);
  }

  return { fuseFixer };
};

deploy('', {}, true);
