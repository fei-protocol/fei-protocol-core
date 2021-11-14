// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity 0.8.4;

abstract contract SAFEEngineLike {
    function safes(bytes32, address) public view virtual returns (uint256, uint256);

    function approveSAFEModification(address) public virtual;

    function transferCollateral(
        bytes32,
        address,
        address,
        uint256
    ) public virtual;

    function transferInternalCoins(
        address,
        address,
        uint256
    ) public virtual;

    function modifySAFECollateralization(
        bytes32,
        address,
        address,
        address,
        int256,
        int256
    ) public virtual;

    function transferSAFECollateralAndDebt(
        bytes32,
        address,
        address,
        int256,
        int256
    ) public virtual;
}

abstract contract LiquidationEngineLike {
    function protectSAFE(
        bytes32,
        address,
        address
    ) external virtual;
}

contract SAFEHandler {
    constructor(address safeEngine) {
        SAFEEngineLike(safeEngine).approveSAFEModification(msg.sender);
    }
}

contract MockGebSafeManager {
    address public safeEngine;
    uint256 public safei; // Auto incremental
    mapping(uint256 => address) public safes; // SAFEId => SAFEHandler
    mapping(uint256 => List) public safeList; // SAFEId => Prev & Next SAFEIds (double linked list)
    mapping(uint256 => address) public ownsSAFE; // SAFEId => Owner
    mapping(uint256 => bytes32) public collateralTypes; // SAFEId => CollateralType

    mapping(address => uint256) public firstSAFEID; // Owner => First SAFEId
    mapping(address => uint256) public lastSAFEID; // Owner => Last SAFEId
    mapping(address => uint256) public safeCount; // Owner => Amount of SAFEs

    mapping(address => mapping(uint256 => mapping(address => uint256))) public safeCan; // Owner => SAFEId => Allowed Addr => True/False

    mapping(address => mapping(address => uint256)) public handlerCan; // SAFE handler => Allowed Addr => True/False

    struct List {
        uint256 prev;
        uint256 next;
    }

    // --- Events ---
    event AllowSAFE(address sender, uint256 safe, address usr, uint256 ok);
    event AllowHandler(address sender, address usr, uint256 ok);
    event TransferSAFEOwnership(address sender, uint256 safe, address dst);
    event OpenSAFE(address indexed sender, address indexed own, uint256 indexed safe);
    event ModifySAFECollateralization(address sender, uint256 safe, int256 deltaCollateral, int256 deltaDebt);
    event TransferCollateral(address sender, uint256 safe, address dst, uint256 wad);
    event TransferCollateral(address sender, bytes32 collateralType, uint256 safe, address dst, uint256 wad);
    event TransferInternalCoins(address sender, uint256 safe, address dst, uint256 rad);
    event QuitSystem(address sender, uint256 safe, address dst);
    event EnterSystem(address sender, address src, uint256 safe);
    event MoveSAFE(address sender, uint256 safeSrc, uint256 safeDst);
    event ProtectSAFE(address sender, uint256 safe, address liquidationEngine, address saviour);

    modifier safeAllowed(uint256 safe) {
        require(msg.sender == ownsSAFE[safe] || safeCan[ownsSAFE[safe]][safe][msg.sender] == 1, "safe-not-allowed");
        _;
    }

    modifier handlerAllowed(address handler) {
        require(msg.sender == handler || handlerCan[handler][msg.sender] == 1, "internal-system-safe-not-allowed");
        _;
    }

    constructor(address safeEngine_) {
        safeEngine = safeEngine_;
    }

    // --- Math ---
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x);
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x);
    }

    function toInt(uint256 x) internal pure returns (int256 y) {
        y = int256(x);
        require(y >= 0);
    }

    // --- SAFE Manipulation ---

    // Allow/disallow a usr address to manage the safe
    function allowSAFE(
        uint256 safe,
        address usr,
        uint256 ok
    ) public safeAllowed(safe) {
        safeCan[ownsSAFE[safe]][safe][usr] = ok;
        emit AllowSAFE(msg.sender, safe, usr, ok);
    }

    // Allow/disallow a usr address to quit to the sender handler
    function allowHandler(address usr, uint256 ok) public {
        handlerCan[msg.sender][usr] = ok;
        emit AllowHandler(msg.sender, usr, ok);
    }

    // Open a new safe for a given usr address.
    function openSAFE(bytes32 collateralType, address usr) public returns (uint256) {
        require(usr != address(0), "usr-address-0");

        safei = add(safei, 1);
        safes[safei] = address(new SAFEHandler(safeEngine));
        ownsSAFE[safei] = usr;
        collateralTypes[safei] = collateralType;

        // Add new SAFE to double linked list and pointers
        if (firstSAFEID[usr] == 0) {
            firstSAFEID[usr] = safei;
        }
        if (lastSAFEID[usr] != 0) {
            safeList[safei].prev = lastSAFEID[usr];
            safeList[lastSAFEID[usr]].next = safei;
        }
        lastSAFEID[usr] = safei;
        safeCount[usr] = add(safeCount[usr], 1);

        emit OpenSAFE(msg.sender, usr, safei);
        return safei;
    }

    // Give the safe ownership to a dst address.
    function transferSAFEOwnership(uint256 safe, address dst) public safeAllowed(safe) {
        require(dst != address(0), "dst-address-0");
        require(dst != ownsSAFE[safe], "dst-already-owner");

        // Remove transferred SAFE from double linked list of origin user and pointers
        if (safeList[safe].prev != 0) {
            safeList[safeList[safe].prev].next = safeList[safe].next; // Set the next pointer of the prev safe (if exists) to the next of the transferred one
        }
        if (safeList[safe].next != 0) {
            // If wasn't the last one
            safeList[safeList[safe].next].prev = safeList[safe].prev; // Set the prev pointer of the next safe to the prev of the transferred one
        } else {
            // If was the last one
            lastSAFEID[ownsSAFE[safe]] = safeList[safe].prev; // Update last pointer of the owner
        }
        if (firstSAFEID[ownsSAFE[safe]] == safe) {
            // If was the first one
            firstSAFEID[ownsSAFE[safe]] = safeList[safe].next; // Update first pointer of the owner
        }
        safeCount[ownsSAFE[safe]] = sub(safeCount[ownsSAFE[safe]], 1);

        // Transfer ownership
        ownsSAFE[safe] = dst;

        // Add transferred SAFE to double linked list of destiny user and pointers
        safeList[safe].prev = lastSAFEID[dst];
        safeList[safe].next = 0;
        if (lastSAFEID[dst] != 0) {
            safeList[lastSAFEID[dst]].next = safe;
        }
        if (firstSAFEID[dst] == 0) {
            firstSAFEID[dst] = safe;
        }
        lastSAFEID[dst] = safe;
        safeCount[dst] = add(safeCount[dst], 1);

        emit TransferSAFEOwnership(msg.sender, safe, dst);
    }

    // Modify a SAFE's collateralization ratio while keeping the generated COIN or collateral freed in the SAFE handler address.
    function modifySAFECollateralization(
        uint256 safe,
        int256 deltaCollateral,
        int256 deltaDebt
    ) public safeAllowed(safe) {
        address safeHandler = safes[safe];
        SAFEEngineLike(safeEngine).modifySAFECollateralization(
            collateralTypes[safe],
            safeHandler,
            safeHandler,
            safeHandler,
            deltaCollateral,
            deltaDebt
        );
        emit ModifySAFECollateralization(msg.sender, safe, deltaCollateral, deltaDebt);
    }

    // Transfer wad amount of safe collateral from the safe address to a dst address.
    function transferCollateral(
        uint256 safe,
        address dst,
        uint256 wad
    ) public safeAllowed(safe) {
        SAFEEngineLike(safeEngine).transferCollateral(collateralTypes[safe], safes[safe], dst, wad);
        emit TransferCollateral(msg.sender, safe, dst, wad);
    }

    // Transfer wad amount of any type of collateral (collateralType) from the safe address to a dst address.
    // This function has the purpose to take away collateral from the system that doesn't correspond to the safe but was sent there wrongly.
    function transferCollateral(
        bytes32 collateralType,
        uint256 safe,
        address dst,
        uint256 wad
    ) public safeAllowed(safe) {
        SAFEEngineLike(safeEngine).transferCollateral(collateralType, safes[safe], dst, wad);
        emit TransferCollateral(msg.sender, collateralType, safe, dst, wad);
    }

    // Transfer rad amount of COIN from the safe address to a dst address.
    function transferInternalCoins(
        uint256 safe,
        address dst,
        uint256 rad
    ) public safeAllowed(safe) {
        SAFEEngineLike(safeEngine).transferInternalCoins(safes[safe], dst, rad);
        emit TransferInternalCoins(msg.sender, safe, dst, rad);
    }

    // Quit the system, migrating the safe (lockedCollateral, generatedDebt) to a different dst handler
    function quitSystem(uint256 safe, address dst) public safeAllowed(safe) handlerAllowed(dst) {
        (uint256 lockedCollateral, uint256 generatedDebt) = SAFEEngineLike(safeEngine).safes(
            collateralTypes[safe],
            safes[safe]
        );
        int256 deltaCollateral = toInt(lockedCollateral);
        int256 deltaDebt = toInt(generatedDebt);
        SAFEEngineLike(safeEngine).transferSAFECollateralAndDebt(
            collateralTypes[safe],
            safes[safe],
            dst,
            deltaCollateral,
            deltaDebt
        );
        emit QuitSystem(msg.sender, safe, dst);
    }

    // Import a position from src handler to the handler owned by safe
    function enterSystem(address src, uint256 safe) public handlerAllowed(src) safeAllowed(safe) {
        (uint256 lockedCollateral, uint256 generatedDebt) = SAFEEngineLike(safeEngine).safes(
            collateralTypes[safe],
            src
        );
        int256 deltaCollateral = toInt(lockedCollateral);
        int256 deltaDebt = toInt(generatedDebt);
        SAFEEngineLike(safeEngine).transferSAFECollateralAndDebt(
            collateralTypes[safe],
            src,
            safes[safe],
            deltaCollateral,
            deltaDebt
        );
        emit EnterSystem(msg.sender, src, safe);
    }

    // Move a position from safeSrc handler to the safeDst handler
    function moveSAFE(uint256 safeSrc, uint256 safeDst) public safeAllowed(safeSrc) safeAllowed(safeDst) {
        require(collateralTypes[safeSrc] == collateralTypes[safeDst], "non-matching-safes");
        (uint256 lockedCollateral, uint256 generatedDebt) = SAFEEngineLike(safeEngine).safes(
            collateralTypes[safeSrc],
            safes[safeSrc]
        );
        int256 deltaCollateral = toInt(lockedCollateral);
        int256 deltaDebt = toInt(generatedDebt);
        SAFEEngineLike(safeEngine).transferSAFECollateralAndDebt(
            collateralTypes[safeSrc],
            safes[safeSrc],
            safes[safeDst],
            deltaCollateral,
            deltaDebt
        );
        emit MoveSAFE(msg.sender, safeSrc, safeDst);
    }

    // Choose a SAFE saviour inside LiquidationEngine for the SAFE with id 'safe'
    function protectSAFE(
        uint256 safe,
        address liquidationEngine,
        address saviour
    ) public safeAllowed(safe) {
        LiquidationEngineLike(liquidationEngine).protectSAFE(collateralTypes[safe], safes[safe], saviour);
        emit ProtectSAFE(msg.sender, safe, liquidationEngine, saviour);
    }
}
