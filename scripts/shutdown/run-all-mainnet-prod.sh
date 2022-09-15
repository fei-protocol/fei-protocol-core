# npx ts-node scripts/shutdown/createMerkleTree [dataJSONFilename] [outputPath] [debug] [additionalDataJSONFilename]
npx ts-node scripts/shutdown/createMerkleTrees.ts ./proposals/data/merkle_redemption/prod/balances.json ./proposals/data/merkle_redemption/prod/roots.json true ./proposals/data/merkle_redemption/prod/testBalances.json

# npx ts-node scripts/shutdown/deployMerkleRedeemer [ratesJSONFileName] [rootsJSONFileName] [forkMode] [debug]
npx ts-node scripts/shutdown/deployMerkleRedeemer.ts proposals/data/merkle_redemption/prod/rates.json proposals/data/merkle_redemption/prod/roots.json false true

# nice
echo "Congrats, you did it!";