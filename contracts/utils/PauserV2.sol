// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (security/Pausable.sol)
pragma solidity ^0.8.4;

/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract PauserV2 {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event SecondaryPaused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event SecondaryUnpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function secondaryPaused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotSecondaryPaused() {
        require(!secondaryPaused(), "PauserV2: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenSecondaryPaused() {
        require(secondaryPaused(), "PauserV2: not paused");
        _;
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _secondaryPause() internal virtual whenNotSecondaryPaused {
        _paused = true;
        emit SecondaryPaused(msg.sender);
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _secondaryUnpause() internal virtual whenSecondaryPaused {
        _paused = false;
        emit SecondaryUnpaused(msg.sender);
    }
}
