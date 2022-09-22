export FEI_PSM=0x5FbDB2315678afecb367f032d93F642f64180aa3

echo "-------------------------------------------------------------";
echo "Set DAO timelock ETH balance to 10 ETH";
export USER=0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c
export BALANCE=10000000000000000000
cast rpc --rpc-url http://127.0.0.1:8545 anvil_setBalance $USER $BALANCE

echo "-------------------------------------------------------------";
echo "Send 5M DAI to Simple FEI PSM contract"
export TOKEN=0x6B175474E89094C44Da98b954EedeAC495271d0F
export FROM=0x5777d92f208679db4b9778590fa3cab3ac9e2168
export TO=$FEI_PSM
export AMOUNT=5000000000000000000000000
cast call --rpc-url http://127.0.0.1:8545 $TOKEN "balanceOf(address)(uint256)" $FROM
cast call --rpc-url http://127.0.0.1:8545 $TOKEN "balanceOf(address)(uint256)" $TO
cast rpc --rpc-url http://127.0.0.1:8545 anvil_setBalance $FROM 10000000000000000000
cast rpc --rpc-url http://127.0.0.1:8545 anvil_impersonateAccount $FROM
cast send --rpc-url http://127.0.0.1:8545 $TOKEN \
--from $FROM \
  "transfer(address,uint256)(bool)" \
  $TO \
  $AMOUNT
cast call --rpc-url http://127.0.0.1:8545 $TOKEN "balanceOf(address)(uint256)" $FROM
cast call --rpc-url http://127.0.0.1:8545 $TOKEN "balanceOf(address)(uint256)" $TO

echo "-------------------------------------------------------------";
echo "Grant MINTER_ROLE to PSM"
export FROM=0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c
export CORE=0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9
export MINTER_ROLE=0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
cast rpc --rpc-url http://127.0.0.1:8545 anvil_impersonateAccount $FROM
cast send --rpc-url http://127.0.0.1:8545 $CORE \
--from $FROM \
  "grantRole(bytes32,address)" \
  $MINTER_ROLE \
  $FEI_PSM
