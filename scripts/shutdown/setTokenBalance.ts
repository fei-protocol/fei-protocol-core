import * as dotenv from 'dotenv';
import { BigNumber, ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { IERC20, IERC20__factory } from '../../types/contracts';

dotenv.config();

const feiHolder = '0x19C549357034d10DB8D75ed812b45bE1Dd8A7218'.toLowerCase();
const feiAddress = '0x956F47F50A910163D8BF957Cf5846D573E7f87CA';

// token address : { topHolder : tokenAmount }
const tokenHolders = {
  '0xd8553552f8868c1ef160eedf031cf0bcf9686945': [
    '0x37349d9cc523d28e6abfc03fc5f44879bc8bffd9',
    '10985155688905568046898444'
  ],
  '0xbb025d470162cc5ea24daf7d4566064ee7f5f111': ['0x78041341e79693953ab49f5040d3ac8ca8cd2397', '338082618388258835526'],
  '0x7e9ce3caa9910cc048590801e64174957ed41d43': [
    '0x9cc46ab5a714f7cd24c59f33c5769039b5872491',
    '2937743814887386132100523'
  ],
  '0x647a36d421183a0a9fa62717a64b664a24e469c7': [
    '0xf846ee6e8ee9a6fbf51c7c65105cabc041c048ad',
    '9758075848365439347827724'
  ],
  '0xfa1057d02a0c1a4885851e3f4fd496ee7d38f56e': ['0x69db2c89974f74b4a16e54eb75884465a55f3980', '97859470371666448477'],
  '0x8e4e0257a4759559b4b1ac087fe8d80c63f20d19': [
    '0x061c8610a784b8a1599de5b1157631e35180d818',
    '9060164702778291785626922'
  ],
  '0x6f95d4d251053483f41c8718c30f4f3c404a8cf2': ['0x66f4856f1bbd1eb09e1c8d9d646f5a3a193da569', '1670178907345'],
  '0x3e5c122ffa75a9fe16ec0c69f7e9149203ea1a5d': [
    '0x96665d63c1b53f8335e3c9287ee255f306c93c45',
    '3180817495522415648434098'
  ],
  '0x51ff03410a0da915082af444274c381bd1b4cdb1': [
    '0x7189b2ea41d406c5044865685fedb615626f9afd',
    '34519307029013765771202'
  ],
  '0xb7fe5f277058b3f9eabf6e0655991f10924bfa54': ['0x9538d438d506fc426db37fb83dac2a0752a02757', '12500000000000'],
  '0x9de558fce4f289b305e38abe2169b75c626c114e': [
    '0x96665d63c1b53f8335e3c9287ee255f306c93c45',
    '2752643169448372736828134'
  ],
  '0xda396c927e3e6bef77a98f372ce431b49edec43d': [
    '0x91f50e3183a8cc30d2a981c3afa85a2bf6691c67',
    '1000000000000000000000000'
  ],
  '0xf148cdec066b94410d403ac5fe1bb17ec75c5851': ['0x82b8b659a4a98f69cb7899e1a07089ea3b90a894', '15135415069713089990'],
  '0x0c402f06c11c6e6a6616c98868a855448d4cfe65': ['0x9538d438d506fc426db37fb83dac2a0752a02757', '6250000000000'],
  '0x26267e41ceca7c8e0f143554af707336f27fa051': [
    '0x66b870ddf78c975af5cd8edc6de25eca81791de1',
    '3759929116760149574446'
  ],
  '0xebe0d1cb6a0b8569929e062d67bfbc07608f0a47': ['0x66b870ddf78c975af5cd8edc6de25eca81791de1', '8551629174016'],
  '0xe097783483d1b7527152ef8b150b99b9b2700c8d': ['0x82e8936b187d83fd6eb2b7dab5b19556e9deff1c', '935894176948'],
  '0x8922c1147e141c055fddfc0ed5a119f3378c8ef8': [
    '0x96665d63c1b53f8335e3c9287ee255f306c93c45',
    '10547551798004181955188852'
  ],
  '0x7dbc3af9251756561ce755fcc11c754184af71f7': [
    '0xbf2647e5319cfbbe840ad0fafbe5e073e89b40f0',
    '2500000000000000000000'
  ],
  '0x3a2804ec0ff521374af654d8d0daa1d1ae1ee900': [
    '0x11b1f3c622b129212d257d603d312244820cc367',
    '3486298653412255041116763'
  ],
  '0xa54c548d11792b3d26ad74f5f899e12cdfd64fd6': [
    '0x69b9a89083e2324079922e01557cafb87cd90b09',
    '3993531603381679285712741'
  ],
  '0xa6c25548df506d84afd237225b5b34f2feb1aa07': [
    '0x2d160210011a992966221f428f63326f76066ba9',
    '4253125418166470353171372'
  ],
  '0xfbd8aaf46ab3c2732fa930e5b343cd67cea5054c': [
    '0xc68412b72e68c30d4e6c0854b439cbbe957146e4',
    '11960303655355917097801'
  ],
  '0x001e407f497e024b9fb1cb93ef841f43d645ca4f': [
    '0x525ea5983a2e02aba8aa0be7d15cd73150812379',
    '33609562056018421713210980'
  ],
  '0x5cadc2a04921213de60b237688776e0f1a7155e6': [
    '0x96665d63c1b53f8335e3c9287ee255f306c93c45',
    '28499508944344457687075380'
  ],
  '0x88d3557eb6280cc084ca36e425d6bc52d0a04429': ['0x88958f23e4fb3c4e47cc21f7aa02b5d8fddfce11', '87918304210'],
  '0xc7283b66eb1eb5fb86327f08e1b5816b0720212b': [
    '0xfa4fc4ec2f81a4897743c5b4f45907c02ce06199',
    '16856213429620138601579623'
  ],
  '0xe92a3db67e4b6ac86114149f522644b34264f858': ['0x108e4f1486bb38b60629ab570d82bf5420181217', '6000000000000000000'],
  '0x6b175474e89094c44da98b954eedeac495271d0f': [
    '0x075e72a5edf65f0a5f44699c7654c1a76941ddc8',
    '278915974736877714909963561'
  ],
  '0xae7ab96520de3a18e5e111b5eaab095312d7fe84': [
    '0x41318419cfa25396b47a94896ffa2c77c6434040',
    '41361117342485101798009'
  ],
  '0x6dea81c8171d0ba574754ef6f8b412f2ed88c54d': [
    '0x32c761138ad9ff95d8595aa9a79208f19b01d8e7',
    '9843750000000000000000000'
  ],
  '0xc770eefad204b5180df6a14ee197d99d808ee52d': [
    '0x8a72a41af2f1edaf02cfd423ec4edfa35ed82f53',
    '11463962301028748844772178'
  ]
};

async function main() {
  if (process.argv[2] === 'help') {
    console.log(`
      Usage: 
        npx ts-node scripts/shutdown/setTokenBalance tokenAddress giveToAddress [amount] [debug]
      
      Args:
        tokenAddress = string (default: undefined) (must be one of the 27 cTokens or Fei or TRIBE or DAI or stETH or LQTY or FOX)
        giveToAddress = string (default: undefined)
        amount = string (default: "1000000000000000000")
        debug = true|false (default: false)

      Examples: 
        npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0x11e52c75998fe2E7928B191bfc5B25937Ca16741
        npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0x11e52c75998fe2E7928B191bfc5B25937Ca16741 1000 true
    `);
    return;
  }

  let cTokenAddress: string;
  let giveToAddress: string;
  let amount = '1000000000000000000';
  let debug = false;

  if (process.argv[2] !== undefined) {
    cTokenAddress = process.argv[2];
    if (
      !Object.keys(tokenHolders).some((t) => t.toLowerCase() === cTokenAddress.toLowerCase()) &&
      cTokenAddress != feiAddress
    )
      throw new Error(`Invalid token address: ${cTokenAddress}`);
  } else throw new Error("Must provide cToken address. Run with single param 'help' for usage.");

  if (process.argv[3] !== undefined) {
    giveToAddress = process.argv[3];
  } else throw new Error("Must provide address to give tokens to. Run with single param 'help' for usage.");

  if (process.argv[4] !== undefined) {
    amount = process.argv[4];
  }

  if (process.argv[4] !== undefined) {
    debug = process.argv[4] === 'true';
  }

  if (debug) console.log(`Will give ${amount} of token ${cTokenAddress} to ${giveToAddress}`);

  if (debug) console.log('Connecting to nodeinator...');

  if (!process.env.ANVIL_NODE_URL) throw new Error('Must provide ANVIL_NODE_URL in env or export as env var');
  const provider = new ethers.providers.JsonRpcProvider(process.env.ANVIL_NODE_URL);
  await provider.ready;

  if (debug) console.log('Node connected.');

  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  await provider.send('anvil_setBalance', [wallet.address, parseEther('10').toHexString()]);

  // check the ctokens to make sure the data looks good, adjust for up to date network conditions
  if (debug) {
    for (const cTokenAddress of Object.keys(tokenHolders)) {
      const cTokenContract = new ethers.Contract(cTokenAddress, IERC20__factory.createInterface(), wallet) as IERC20;
      const topHolder = tokenHolders[cTokenAddress as keyof typeof tokenHolders][0];
      const topHolderActualBalance = await cTokenContract.balanceOf(topHolder);
      const topHolderRecordedBalance = BigNumber.from(tokenHolders[cTokenAddress as keyof typeof tokenHolders][1]);
      if (topHolderActualBalance.lt(BigNumber.from('100000'))) {
        throw new Error(
          `Error: Top holder balance for cToken ${cTokenAddress} too low for testing: ${topHolderActualBalance.toNumber()}`
        );
      }

      if (
        topHolderActualBalance
          .sub(topHolderRecordedBalance)
          .abs()
          .gt(topHolderRecordedBalance.div(BigNumber.from(10)))
      ) {
        console.warn(
          `Warning: Address ${topHolder} balance of cToken ${cTokenAddress} has diverged > 10% since we recorded their balance (9/1/2022, AM PST)`
        );
      }
    }

    console.log(`All cToken balances accumulated, testing shall proceed.`);
  }

  const topHolder =
    cTokenAddress.toLowerCase() === feiAddress.toLowerCase()
      ? feiHolder
      : tokenHolders[cTokenAddress.toLowerCase() as keyof typeof tokenHolders][0];
  await provider.send('anvil_setBalance', [topHolder, parseEther('10').toHexString()]);

  if (debug) console.log(`Top holder: ${topHolder}`);

  const cTokenContract = new ethers.Contract(cTokenAddress, IERC20__factory.createInterface(), provider) as IERC20;
  const topHolderActualBalance = await cTokenContract.balanceOf(topHolder);

  if (topHolderActualBalance.lt(amount))
    throw new Error(
      `Requested ${amount.toString()} of token ${cTokenAddress}, but top holder only has ${topHolderActualBalance.toString()}`
    );

  await provider.send('anvil_impersonateAccount', [topHolder]);

  const unsignedTx = await cTokenContract.populateTransaction.transfer(giveToAddress, amount);
  unsignedTx.from = topHolder;
  const oldBalance = await cTokenContract.balanceOf(wallet.address);
  await provider.send('eth_sendUnsignedTransaction', [unsignedTx]);
  const newBalance = await cTokenContract.balanceOf(wallet.address);

  await provider.send('anvil_stopImpersonatingAccount', [topHolder]);

  console.log(`Transfer complete.`);
  if (debug) console.log(`Old token balance: ${oldBalance.toString()}`);
  if (debug) console.log(`New token balance: ${newBalance.toString()}`);
}

main();
