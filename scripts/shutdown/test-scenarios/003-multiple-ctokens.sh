# reset the fork
npx ts-node scripts/shutdown/resetFork 15520164 true

# give 0xf39 (account 6) some pool-8-FEI and pool-8-ETH
npx ts-node scripts/shutdown/setTokenBalance 0xd8553552f8868c1ef160eedf031cf0bcf9686945 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 1000000000000 true
npx ts-node scripts/shutdown/setTokenBalance 0xbb025d470162cc5ea24daf7d4566064ee7f5f111 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 200000000000 true
npx ts-node scripts/shutdown/setTokenBalance 0xfa1057d02a0c1a4885851e3f4fd496ee7d38f56e 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 156000000000000000 true

# give 0x3c4
npx ts-node scripts/shutdown/setTokenBalance 0xbb025d470162cc5ea24daf7d4566064ee7f5f111 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 200000000 true

# create merkle trees and deploy redeemer contract
npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/test.json scripts/shutdown/data/sample/roots.json true scripts/shutdown/test-scenarios/003-multiple-ctokens.json

npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/sample/rates.json scripts/shutdown/data/sample/roots.json

# TODO

# redeemerAddress=$(echo $redeemerOutput | sed -e 's/[\t ]//g;/^$/d' | grep -Eo '0x[a-fA-F0-9]{40}' | tail -n 1)

# give the redeemer some FEI
# npx ts-node scripts/shutdown/setTokenBalance 0x956F47F50A910163D8BF957Cf5846D573E7f87CA $redeemerAddress 100000000000000000000 true

# copy the merged snapshot to the rari-hack-repayment repo
# cp scripts/shutdown/test-scenarios/003-multiple-ctokens.merged.json ../rari-hack-repayment/src/data/hackRepaymentSnapshot.json
