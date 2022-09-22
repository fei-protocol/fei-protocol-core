# reset the fork

npx ts-node scripts/shutdown/resetFork 15574148 true

# give 0xf39 some TRIBE

npx ts-node scripts/shutdown/setTokenBalance 0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 20000000000000000000000 true

# deploy the redeemer

deployOutput=$(npx ts-node scripts/shutdown/deployTribeRedeemer true true)

echo $deployOutput

redeemerAddress=$(echo "$deployOutput" | sed -e 's/[\t ]//g;/^$/d' | grep -Eo '0x[a-fA-F0-9]{40}' | tail -n 1)

# give the redeemer some TRIBE

npx ts-node scripts/shutdown/setTokenBalance 0x6B175474E89094C44Da98b954EedeAC495271d0F $redeemerAddress 56000000000000000000000000 true # DAI
npx ts-node scripts/shutdown/setTokenBalance 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84 $redeemerAddress 50000000000000000000000 true # stETH
npx ts-node scripts/shutdown/setTokenBalance 0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D $redeemerAddress 1500000000000000000000000 true # LQTY
npx ts-node scripts/shutdown/setTokenBalance 0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d $redeemerAddress 1000000000000000000000000 true # FOX
