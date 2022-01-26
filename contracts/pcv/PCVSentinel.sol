// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../refs/CoreRef.sol";
import "./IPCVSentinel.sol";
import "./IPCVDeposit.sol";
import "../libs/CoreRefPauseableLib.sol";

interface IGuard {
    function check() external view returns (bytes memory);
}

interface IUniV2Pair {
    function getReserves() external view returns (uint112, uint112, uint32);
}

interface IChainlinkPriceFeed {
    function latestAnswer() external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * This condition checks the spot price of ETH on Uniswap vs the
 * reported price of ETH on chainlink. If the deviation is greater than
 * 1%, it will allow the caller to pause the ETH PSM (and provide the calldata to do so)
 */
contract ETHPSMPriceGuard is IGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Hardcoded values here since each condition is approved on its own
    address immutable private chainlinkETHUSDPriceFeed = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address immutable private uniV2ETHUSDCPair = 0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc;
    uint256 immutable private allowedDeviationBips = 100; // 1%
    bytes private pauseETHPSMCalldata = "0xDEADBEEF";

    function check() external view override returns (bytes memory) {
        
        (uint112 reserveETH, uint112 reserveUSD,) = IUniV2Pair(uniV2ETHUSDCPair).getReserves();
        uint256 uniSpotPrice = (reserveUSD * 1e18) / reserveETH;

        uint8 decimals = IChainlinkPriceFeed(chainlinkETHUSDPriceFeed).decimals();
        uint256 chainlinkPrice = IChainlinkPriceFeed(chainlinkETHUSDPriceFeed).latestAnswer() * (10 ^ (17-decimals));

        uint256 deviationAmount = chainlinkPrice > uniSpotPrice ? chainlinkPrice - uniSpotPrice : uniSpotPrice - chainlinkPrice;
        uint256 deviationBips;
        
        if (chainlinkPrice >= uniSpotPrice) 
         (deviationAmount * 10000) / chainlinkPrice;

        if (deviationBips > allowedDeviationBips) {
            return (pauseETHPSMCalldata);
        }

        return ("");
    }
}

contract PCVSentinel is IPCVSentinel, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;

    event ContractProtected(address indexed protectedContract, address indexed guard);
    event ContractGuardAdded(address indexed protectedContract, address indexed guard);
    event ContractGuardRemoved(address indexed protectedContract, address indexed guard);

    // Each contract can have many guards
    // But each guard can guard only one contract
    EnumerableSet.AddressSet private guardedContracts;
    EnumerableSet.AddressSet private guards;

    // This mapping gives us the contract to which the supplied guard applies to
    mapping(address => address) public guardRegistry;

    // This mapping gives us all of the guards of the supplied contract
    mapping(address => EnumerableSet.AddressSet) private contractGuards;

    constructor(
        address _core
    ) CoreRef(_core) {
        _setContractAdminRole(keccak256("PCV_SENTINEL_ADMIN_ROLE"));
    }

    // ---------- Read-Only API ----------

    function getGuardedContracts() external view returns (address[] memory guarded) {
        guarded = new address[](guardedContracts.length());
        for (uint i = 0; i < guardedContracts.length(); i++) {
            guarded[i] = guardedContracts.at(i);
        }

        return guarded;
    }

    function getAllGuards() external view returns (address[] memory allGuards) {
        allGuards = new address[](guards.length());
        for (uint i = 0; i < guards.length(); i++) {
            allGuards[i] = guards.at(i);
        }

        return allGuards;
    }

    function getContractsAndGuards() external view returns (address[][] memory contractsAndGuards) {
        contractsAndGuards = new address[][](guardedContracts.length());
        for (uint i = 0; i < guardedContracts.length(); i++) {
            address guardedContract = guardedContracts.at(i);
            uint256 numGuards = contractGuards[guardedContract].length();

            address[] memory guardsForContract = new address[](numGuards);

            for (uint j = 0; j < numGuards; j++) {
                guardsForContract[j] = contractGuards[guardedContract].at(j);
            }

            contractsAndGuards[i] = guardsForContract;
        }

        return contractsAndGuards;
    }

    // ---------- Governor-or-Admin-Only State-Changing API ----------

    // ---------- Governor-or-Admin-Or-Guardian-Only State-Changing API ----------
    function knightTheWorthy(address squire, address guardedContract) external onlyGovernor {
        // .add on addressSet is a no-op if the address is already in the set
        guardedContracts.add(guardedContract);
        guards.add(squire);

        // Assign the newly appointed knight to his fief (contract)
        guardRegistry[squire] = guardedContract;

        // Let the fief know that it has a new guard
        contractGuards[guardedContract].add(squire);

        // Inform the kingdom of this glorious news
        emit ContractGuardAdded(guardedContract, squire);
    }

    function slayTraitor(address traitor) external isGovernorOrGuardianOrAdmin {
        /// Find out which address the traitor was guarding
        address guardedContract = guardRegistry[traitor];

        // Unassign the guard from the global registry
        guards.remove(traitor);

        // Unassign the guard from his contract
        guardRegistry[traitor] = address(0x0);
        
        // Remove the guard from the list of guards that his contract has
        contractGuards[guardedContract].remove(traitor);

        // Inform the kingdom of this sudden and inevitable betrayal
        emit ContractGuardRemoved(guardedContract, traitor);
    }

    // Public State-Changing API

    /**
     * @notice Activate all guards for a given contract
     * @param guardedContract the contract for which to activate its guards, if any
     * @return activated true if any guards took action
     */
    function protec(address guardedContract) external returns (bool activated) {
        require(guardedContracts.contains(guardedContract));

        for (uint i = 0; i < contractGuards[guardedContract].length(); i++) {
            bool thisGuardActivated = activateGuard(contractGuards[guardedContract].at(i));
            if (thisGuardActivated) {
                emit ContractProtected(guardedContract, contractGuards[guardedContract].at(i));
            }
            activated = activated || thisGuardActivated;
        }

        return activated;
    }

    /**
     * @notice Activate an individual guard by calling it directly
     * @param guardAddress the address of the guard to activate
     * @return true if the guard took any action
     */
    function activateGuard(address guardAddress) public returns (bool) {
        require(guards.contains(guardAddress));

        (bool activated,) = guardAddress.delegatecall(abi.encodeWithSignature("checkAndProtec()"));

        return activated;
    }

    /**
     * @notice Activate all guards
     * @return activated true if any guards took action
     * @return activatedGuards the addresses of guards that took action
     * @dev use this function with ethers.js staticCall() to get a list of activate-able guards
     */
    function activateAllGuards() external returns (bool activated, address[] memory activatedGuards) {
        activatedGuards = new address[](guards.length());
        uint numGuardsActivated = 0;

        for (uint i = 0; i < guards.length(); i++) {
            bool thisGuardActivated = activateGuard(guards.at(i));
            if (thisGuardActivated) {
                activatedGuards[numGuardsActivated] = guards.at(i);
                numGuardsActivated++;
                emit ContractProtected(guardRegistry[guards.at(i)], guards.at(i));
            }
            activated = activated || thisGuardActivated;
        }

        address[] memory activatedGuardsTruncated = new address[](numGuardsActivated);   

        // Copy the activated guards over to the truncated-size array
        // since you cant resize arrays and dynamic memory arrays dont exist
        for(uint i = 0; i < numGuardsActivated; i++) {
            activatedGuardsTruncated[i] = activatedGuards[i];
        }

        return (activated, activatedGuardsTruncated);
    }
}