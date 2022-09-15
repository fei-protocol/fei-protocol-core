# npx ts-node scripts/shutdown/createMerkleTree [dataJSONFilename] [outputPath] [debug] [additionalDataJSONFilename]
npx ts-node scripts/shutdown/createMerkleTrees.ts ./proposals/data/merkle_redemption/sample/balances.json ./proposals/data/merkle_redemption/sample/roots.json true ./proposals/data/merkle_redemption/sample/testBalances.json

# npx ts-node scripts/shutdown/deployMerkleRedeemer [ratesJSONFileName] [rootsJSONFileName] [forkMode] [debug]
npx ts-node scripts/shutdown/deployMerkleRedeemer.ts proposals/data/merkle_redemption/sample/rates.json proposals/data/merkle_redemption/sample/roots.json false true

# nice
echo "Congrats, you did it!";