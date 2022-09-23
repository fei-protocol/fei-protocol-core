# How to use :
# Start a mainnet fork with :
# $ anvil --fork-url $ETH_RPC_URL --block-time 10
# Then, run this script
# $ sh scripts/shutdown/redeemerSetup.sh
# Then, point frontend to the anvil RPC and run your tests
export RPC="--rpc-url http://127.0.0.1:8545"
export TEST_ADDRESS=0xE171fd6E2c0c6B9dD7e91e1f0f7d5b88faC87Db7
export TRIBE_HOLDER=0x3A24fea1509e1BaeB2D2A7C819A191AA441825ea
export TRIBE_AMOUNT=1000000000000000000000000
export REDEEM_BASE=458964340000000000000000000
export TRIBE=0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B
export STETH=0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
export STETH_HOLDER=0x1982b2f5814301d4e9a8b0201555376e62f82428
export STETH_AMOUNT=50296523674661485703301
export LQTY=0x6DEA81C8171D0bA574754EF6F8b412F2Ed88c54D
export LQTY_HOLDER=0x4f9fbb3f1e99b56e0fe2892e623ed36a76fc605d
export LQTY_AMOUNT=1101298805118942906652299
export FOX=0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d
export FOX_HOLDER=0xa4fc358455febe425536fd1878be67ffdbdec59a
export FOX_AMOUNT=15316691965631380244403204
export DAI=0x6B175474E89094C44Da98b954EedeAC495271d0F
export DAI_HOLDER=0x5777d92f208679db4b9778590fa3cab3ac9e2168
export DAI_AMOUNT=51450791000000000000000000

echo "-------------------------------------------------------------";
echo "Seed test address with ETH"
cast rpc $RPC anvil_setBalance $TEST_ADDRESS 10000000000000000000
cast rpc $RPC anvil_setBalance $TRIBE_HOLDER 10000000000000000000

echo "-------------------------------------------------------------";
echo "Send 1M TRIBE to test address"
cast call $RPC $TRIBE "balanceOf(address)(uint256)" $TRIBE_HOLDER
cast call $RPC $TRIBE "balanceOf(address)(uint256)" $TEST_ADDRESS
cast rpc $RPC anvil_impersonateAccount $TRIBE_HOLDER
cast send $RPC $TRIBE \
--from $TRIBE_HOLDER \
  "transfer(address,uint256)(bool)" \
  $TEST_ADDRESS \
  $TRIBE_AMOUNT
cast call $RPC $TRIBE "balanceOf(address)(uint256)" $TRIBE_HOLDER
cast call $RPC $TRIBE "balanceOf(address)(uint256)" $TEST_ADDRESS

echo "-------------------------------------------------------------";
echo "Deploy the TribeRedeemer"
cast rpc $RPC anvil_impersonateAccount $TEST_ADDRESS
TRIBE_REDEEMER=$(forge create $RPC --constructor-args $TRIBE [$STETH,$LQTY,$FOX,$DAI] $REDEEM_BASE --unlocked --from $TEST_ADDRESS TribeRedeemer | grep 'Deployed to:' | awk '{print $NF}')
echo "TRIBE_REDEEMER=$TRIBE_REDEEMER"

echo "-------------------------------------------------------------";
echo "Seed TribeRedeemer with tokens"
echo "Transfer stETH"
cast rpc $RPC anvil_setBalance $STETH_HOLDER 10000000000000000000
cast rpc $RPC anvil_impersonateAccount $STETH_HOLDER
cast send $RPC $STETH --from $STETH_HOLDER "transfer(address,uint256)(bool)" $TRIBE_REDEEMER $STETH_AMOUNT
echo "Transfer LQTY"
cast rpc $RPC anvil_setBalance $LQTY_HOLDER 10000000000000000000
cast rpc $RPC anvil_impersonateAccount $LQTY_HOLDER
cast send $RPC $LQTY --from $LQTY_HOLDER "transfer(address,uint256)(bool)" $TRIBE_REDEEMER $LQTY_AMOUNT
echo "Transfer FOX"
cast rpc $RPC anvil_setBalance $FOX_HOLDER 10000000000000000000
cast rpc $RPC anvil_impersonateAccount $FOX_HOLDER
cast send $RPC $FOX --from $FOX_HOLDER "transfer(address,uint256)(bool)" $TRIBE_REDEEMER $FOX_AMOUNT
echo "Transfer DAI"
cast rpc $RPC anvil_setBalance $DAI_HOLDER 10000000000000000000
cast rpc $RPC anvil_impersonateAccount $DAI_HOLDER
cast send $RPC $DAI --from $DAI_HOLDER "transfer(address,uint256)(bool)" $TRIBE_REDEEMER $DAI_AMOUNT