# DAO Scripts
These scripts are used to mimic DAO behavior on locally forked mainnet. They are used to replicate the intended state of the chain post a successful DAO vote. These scripts should validate that the proposal steps complete and the contracts work as expected afterwards.

There are two approaches to mimic the proposal and subsequent state: directly executing the indended DAO proposal calldata, and manually running all proposal steps.

Mainnet fork script: `ganache-cli -e 10000000 -g 200000000 -l 8000000 -f https://eth-mainnet.alchemyapi.io/v2/$MAINNET_ALCHEMY_API_KEY@12468435 -i 5777 -p 7545 --unlock 0x639572471f2f318464dc01066a56867130e45E25 --unlock 0xB8f482539F2d3Ae2C9ea6076894df36D1f632775 --unlock 0xe0ac4559739bd36f0913fb0a3f5bfc19bcbacd52` replacing the $MAINNET_ALCHEMY_API_KEY and block number (after the @) with desired inputs. Use the most recent block number possible to accurately reflect mainnet state.

Before running any DAO scripts run `scripts/utils/sudo.js` to grant Governor access to the default account[0]

## Exec.js
This script does a full end-to-end DAO proposal, vote, queue, and execution on the exact calldata to be submitted to the DAO.

First make sure to have visibility into the calldata on your wallet. In Metamask this is 
in settings -> advanced -> show hex data. Upon Tx submission you will read this data.

To get the calldata, submit a proposal on https://www.withtally.com/governance/fei/proposal/new with the intended proposal commands, title and description. Click "Submit proposal" but **do not** confirm the Metamask transaction. Instead simply copy the calldata into the global `data` parameter in the script.

## Manual FIP script 
These follow the pattern of "fip_3.js", they import the contract addresses and trigger the appropriate governor functions with the intended inputs.