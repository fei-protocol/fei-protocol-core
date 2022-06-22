// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../fei/IIncentive.sol";
import "../refs/CoreRef.sol";

contract MockIncentive is IIncentive, CoreRef {
    constructor(address core) CoreRef(core) {}

    uint256 private constant INCENTIVE = 100;
    bool public isMint = true;
    bool public incentivizeRecipient;

    function incentivize(
        address sender,
        address recipient,
        address,
        uint256
    ) public virtual override {
        if (isMint) {
            address target = incentivizeRecipient ? recipient : sender;
            fei().mint(target, INCENTIVE);
        } else {
            fei().burnFrom(recipient, INCENTIVE);
        }
    }

    function setIsMint(bool _isMint) public {
        isMint = _isMint;
    }

    function setIncentivizeRecipient(bool _incentivizeRecipient) public {
        incentivizeRecipient = _incentivizeRecipient;
    }
}
