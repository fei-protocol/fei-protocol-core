## `stdStorage`






### `sigs(string sigStr) → bytes4` (internal)





### `find(struct StdStorage self) → uint256` (internal)

find an arbitrary storage slot given a function sig, input data, address of the contract and a value to check against



### `target(struct StdStorage self, address _target) → struct StdStorage` (internal)





### `sig(struct StdStorage self, bytes4 _sig) → struct StdStorage` (internal)





### `sig(struct StdStorage self, string _sig) → struct StdStorage` (internal)





### `with_key(struct StdStorage self, address who) → struct StdStorage` (internal)





### `with_key(struct StdStorage self, uint256 amt) → struct StdStorage` (internal)





### `with_key(struct StdStorage self, bytes32 key) → struct StdStorage` (internal)





### `depth(struct StdStorage self, uint256 _depth) → struct StdStorage` (internal)





### `checked_write(struct StdStorage self, address who)` (internal)





### `checked_write(struct StdStorage self, uint256 amt)` (internal)





### `checked_write(struct StdStorage self, bytes32 set)` (internal)





### `bytesToBytes32(bytes b, uint256 offset) → bytes32` (public)






### `SlotFound(address who, bytes4 fsig, bytes32 keysHash, uint256 slot)`





### `WARNING_UninitedSlot(address who, uint256 slot)`







