npx ts-node scripts/shutdown/createMerkleTrees scripts/shutdown/data/prod/snapshot.json scripts/shutdown/data/prod/roots.json true;
npx ts-node scripts/shutdown/deployMerkleRedeemer scripts/shutdown/data/prod/rates.json scripts/shutdown/data/prod/roots.json false true;
forge flatten contracts/shutdown/fuse/RariMerkleRedeemer.sol > scripts/shutdown/data/prod/RariMerkleRedeemer_flattened.sol;
echo "Wrote flattened contract to scripts/shutdown/data/prod/RariMerkleRedeemer_flattened.sol";