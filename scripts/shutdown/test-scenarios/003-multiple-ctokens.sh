# reset the fork
npx ts-node scripts/shutdown/resetFork 15536388 true

# give 0xf39 (account 6) some pool-8-FEI and pool-8-ETH
npx ts-node scripts/shutdown/setTokenBalance 0x001e407f497e024b9fb1cb93ef841f43d645ca4f 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 1000000000000 true
npx ts-node scripts/shutdown/setTokenBalance 0x26267e41ceca7c8e0f143554af707336f27fa051 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 200000000000 true
npx ts-node scripts/shutdown/setTokenBalance 0x3e5c122ffa75a9fe16ec0c69f7e9149203ea1a5d 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 156000000000000000 true

# create merkle trees and deploy redeemer contract
npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/test.json scripts/shutdown/data/roots.json true scripts/shutdown/test-scenarios/003-multiple-ctokens.json

deployOutput=$(npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/rates.json scripts/shutdown/data/roots.json)

echo $deployOutput

redeemerAddress=$(echo "$deployOutput" | sed -e 's/[\t ]//g;/^$/d' | grep -Eo '0x[a-fA-F0-9]{40}' | tail -n 1)

# give the redeemer some FEI
echo "Sending 10000 FEI to redeemer at $redeemerAddress"

npx ts-node scripts/shutdown/setTokenBalance 0x956F47F50A910163D8BF957Cf5846D573E7f87CA $redeemerAddress 10000000000000000000000 true

# copy the merged snapshot to the merkle-redemption repo
cp scripts/shutdown/test-scenarios/003-multiple-ctokens.merged.json ../rari-hack-repayment/src/data/hackRepaymentSnapshot.json