import {ERC20} from "../external/solmate/tokens/ERC20.sol";
import {ERC4626} from "../external/solmate/mixins/ERC4626.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Constants} from "../Constants.sol";

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

library IBFeiConfig {
    address internal constant CORE_ADDRESS =
        address(0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9);
    address internal constant FEI_ADDRESS =
        address(0x956F47F50A910163D8BF957Cf5846D573E7f87CA);
    string internal constant IB_TOKEN_NAME = "ibFei";
    string internal constant IB_TOKEN_SYMBOL = "ibFei";
}

contract IBFei is ERC4626, CoreRef {
    constructor()
        ERC4626(
            ERC20(IBFeiConfig.FEI_ADDRESS),
            IBFeiConfig.IB_TOKEN_NAME,
            IBFeiConfig.IB_TOKEN_SYMBOL
        )
        CoreRef(IBFeiConfig.CORE_ADDRESS)
    {}

    function totalAssets() public pure override returns (uint256) {
        return 0;
    }
}
