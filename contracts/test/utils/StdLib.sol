// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Vm.sol";

// Wrappers around Cheatcodes to avoid footguns
abstract contract StdLib {
    // we use a custom name that is unlikely to cause collisions so this contract
    // can be inherited easily
    Vm constant vm_std_cheats =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    // Skip forward or rewind time by the specified number of seconds
    function skip(uint256 time) public {
        vm_std_cheats.warp(block.timestamp + time);
    }

    function rewind(uint256 time) public {
        vm_std_cheats.warp(block.timestamp - time);
    }

    // Setup a prank from an address that has some ether
    function hoax(address who) public {
        vm_std_cheats.deal(who, 1 << 128);
        vm_std_cheats.prank(who);
    }

    function hoax(address who, uint256 give) public {
        vm_std_cheats.deal(who, give);
        vm_std_cheats.prank(who);
    }

    function hoax(address who, address origin) public {
        vm_std_cheats.deal(who, 1 << 128);
        vm_std_cheats.prank(who, who);
    }

    function hoax(
        address who,
        address origin,
        uint256 give
    ) public {
        vm_std_cheats.deal(who, give);
        vm_std_cheats.prank(who, who);
    }

    // Start perpetual prank from an address that has some ether
    function startHoax(address who) public {
        vm_std_cheats.deal(who, 1 << 128);
        vm_std_cheats.startPrank(who);
    }

    function startHoax(address who, uint256 give) public {
        vm_std_cheats.deal(who, give);
        vm_std_cheats.startPrank(who);
    }

    // Start perpetual prank from an address that has some ether
    // tx.origin is set to the origin parameter
    function startHoax(address who, address origin) public {
        vm_std_cheats.deal(who, 1 << 128);
        vm_std_cheats.startPrank(who, origin);
    }

    function startHoax(
        address who,
        address origin,
        uint256 give
    ) public {
        vm_std_cheats.deal(who, give);
        vm_std_cheats.startPrank(who, origin);
    }

    // Deploys a contract by fetching the contract bytecode from
    // the artifacts directory
    function deployCode(string memory what, bytes memory args)
        public
        returns (address addr)
    {
        bytes memory bytecode = abi.encodePacked(
            vm_std_cheats.getCode(what),
            args
        );
        assembly {
            addr := create(0, add(bytecode, 0x20), mload(bytecode))
        }
    }

    function deployCode(string memory what) public returns (address addr) {
        bytes memory bytecode = vm_std_cheats.getCode(what);
        assembly {
            addr := create(0, add(bytecode, 0x20), mload(bytecode))
        }
    }
}

library stdError {
    bytes public constant assertionError =
        abi.encodeWithSignature("Panic(uint256)", 0x01);
    bytes public constant arithmeticError =
        abi.encodeWithSignature("Panic(uint256)", 0x11);
    bytes public constant divisionError =
        abi.encodeWithSignature("Panic(uint256)", 0x12);
    bytes public constant enumConversionError =
        abi.encodeWithSignature("Panic(uint256)", 0x21);
    bytes public constant encodeStorageError =
        abi.encodeWithSignature("Panic(uint256)", 0x22);
    bytes public constant popError =
        abi.encodeWithSignature("Panic(uint256)", 0x31);
    bytes public constant indexOOBError =
        abi.encodeWithSignature("Panic(uint256)", 0x32);
    bytes public constant memOverflowError =
        abi.encodeWithSignature("Panic(uint256)", 0x41);
    bytes public constant zeroVarError =
        abi.encodeWithSignature("Panic(uint256)", 0x51);
}

struct StdStorage {
    mapping(address => mapping(bytes4 => mapping(bytes32 => uint256))) slots;
    mapping(address => mapping(bytes4 => mapping(bytes32 => bool))) finds;
    bytes32[] _keys;
    bytes4 _sig;
    uint256 _depth;
    address _target;
    bytes32 _set;
}

library stdStorage {
    error NotFound(bytes4);
    error NotStorage(bytes4);
    error PackedSlot(bytes32);

    event SlotFound(address who, bytes4 fsig, bytes32 keysHash, uint256 slot);
    event WARNING_UninitedSlot(address who, uint256 slot);

    Vm constant stdstore_vm =
        Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function sigs(string memory sigStr) internal pure returns (bytes4) {
        return bytes4(keccak256(bytes(sigStr)));
    }

    /// @notice find an arbitrary storage slot given a function sig, input data, address of the contract and a value to check against
    // slot complexity:
    //  if flat, will be bytes32(uint256(uint));
    //  if map, will be keccak256(abi.encode(key, uint(slot)));
    //  if deep map, will be keccak256(abi.encode(key1, keccak256(abi.encode(key0, uint(slot)))));
    //  if map struct, will be bytes32(uint256(keccak256(abi.encode(key1, keccak256(abi.encode(key0, uint(slot)))))) + structFieldDepth);
    function find(StdStorage storage self) internal returns (uint256) {
        address who = self._target;
        bytes4 fsig = self._sig;
        uint256 field_depth = self._depth;
        bytes32[] memory ins = self._keys;

        // calldata to test against
        if (
            self.finds[who][fsig][keccak256(abi.encodePacked(ins, field_depth))]
        ) {
            return
                self.slots[who][fsig][
                    keccak256(abi.encodePacked(ins, field_depth))
                ];
        }
        bytes memory cald = abi.encodePacked(fsig, flatten(ins));
        stdstore_vm.record();
        bytes32 fdat;
        {
            (, bytes memory rdat) = who.staticcall(cald);
            fdat = bytesToBytes32(rdat, 32 * field_depth);
        }

        (bytes32[] memory reads, ) = stdstore_vm.accesses(address(who));
        if (reads.length == 1) {
            bytes32 curr = stdstore_vm.load(who, reads[0]);
            if (curr == bytes32(0)) {
                emit WARNING_UninitedSlot(who, uint256(reads[0]));
            }
            if (fdat != curr) {
                revert PackedSlot(reads[0]);
            }
            emit SlotFound(
                who,
                fsig,
                keccak256(abi.encodePacked(ins, field_depth)),
                uint256(reads[0])
            );
            self.slots[who][fsig][
                keccak256(abi.encodePacked(ins, field_depth))
            ] = uint256(reads[0]);
            self.finds[who][fsig][
                keccak256(abi.encodePacked(ins, field_depth))
            ] = true;
        } else if (reads.length > 1) {
            for (uint256 i = 0; i < reads.length; i++) {
                bytes32 prev = stdstore_vm.load(who, reads[i]);
                if (prev == bytes32(0)) {
                    emit WARNING_UninitedSlot(who, uint256(reads[i]));
                }
                // store
                stdstore_vm.store(who, reads[i], bytes32(hex"1337"));
                {
                    (, bytes memory rdat) = who.staticcall(cald);
                    fdat = bytesToBytes32(rdat, 32 * field_depth);
                }

                if (fdat == bytes32(hex"1337")) {
                    // we found which of the slots is the actual one
                    emit SlotFound(
                        who,
                        fsig,
                        keccak256(abi.encodePacked(ins, field_depth)),
                        uint256(reads[i])
                    );
                    self.slots[who][fsig][
                        keccak256(abi.encodePacked(ins, field_depth))
                    ] = uint256(reads[i]);
                    self.finds[who][fsig][
                        keccak256(abi.encodePacked(ins, field_depth))
                    ] = true;
                    stdstore_vm.store(who, reads[i], prev);
                    break;
                }
                stdstore_vm.store(who, reads[i], prev);
            }
        } else {
            revert NotStorage(fsig);
        }

        if (
            !self.finds[who][fsig][
                keccak256(abi.encodePacked(ins, field_depth))
            ]
        ) revert NotFound(fsig);

        delete self._target;
        delete self._sig;
        delete self._keys;
        delete self._depth;

        return
            self.slots[who][fsig][
                keccak256(abi.encodePacked(ins, field_depth))
            ];
    }

    function target(StdStorage storage self, address _target)
        internal
        returns (StdStorage storage)
    {
        self._target = _target;
        return self;
    }

    function sig(StdStorage storage self, bytes4 _sig)
        internal
        returns (StdStorage storage)
    {
        self._sig = _sig;
        return self;
    }

    function sig(StdStorage storage self, string memory _sig)
        internal
        returns (StdStorage storage)
    {
        self._sig = sigs(_sig);
        return self;
    }

    function with_key(StdStorage storage self, address who)
        internal
        returns (StdStorage storage)
    {
        self._keys.push(bytes32(uint256(uint160(who))));
        return self;
    }

    function with_key(StdStorage storage self, uint256 amt)
        internal
        returns (StdStorage storage)
    {
        self._keys.push(bytes32(amt));
        return self;
    }

    function with_key(StdStorage storage self, bytes32 key)
        internal
        returns (StdStorage storage)
    {
        self._keys.push(key);
        return self;
    }

    function depth(StdStorage storage self, uint256 _depth)
        internal
        returns (StdStorage storage)
    {
        self._depth = _depth;
        return self;
    }

    function checked_write(StdStorage storage self, address who) internal {
        checked_write(self, bytes32(uint256(uint160(who))));
    }

    function checked_write(StdStorage storage self, uint256 amt) internal {
        checked_write(self, bytes32(amt));
    }

    function checked_write(StdStorage storage self, bytes32 set) internal {
        address who = self._target;
        bytes4 fsig = self._sig;
        uint256 field_depth = self._depth;
        bytes32[] memory ins = self._keys;

        bytes memory cald = abi.encodePacked(fsig, flatten(ins));
        if (
            !self.finds[who][fsig][
                keccak256(abi.encodePacked(ins, field_depth))
            ]
        ) {
            find(self);
        }
        bytes32 slot = bytes32(
            self.slots[who][fsig][keccak256(abi.encodePacked(ins, field_depth))]
        );

        bytes32 fdat;
        {
            (, bytes memory rdat) = who.staticcall(cald);
            fdat = bytesToBytes32(rdat, 32 * field_depth);
        }
        bytes32 curr = stdstore_vm.load(who, slot);

        if (fdat != curr) {
            revert PackedSlot(slot);
        }
        stdstore_vm.store(who, slot, set);
        delete self._target;
        delete self._sig;
        delete self._keys;
        delete self._depth;
    }

    function bytesToBytes32(bytes memory b, uint256 offset)
        public
        pure
        returns (bytes32)
    {
        bytes32 out;

        for (uint256 i = 0; i < 32; i++) {
            out |= bytes32(b[offset + i] & 0xFF) >> (i * 8);
        }
        return out;
    }

    function flatten(bytes32[] memory b) private pure returns (bytes memory) {
        bytes memory result = new bytes(b.length * 32);
        for (uint256 i = 0; i < b.length; i++) {
            bytes32 k = b[i];
            assembly {
                mstore(add(result, add(32, mul(32, i))), k)
            }
        }

        return result;
    }
}
