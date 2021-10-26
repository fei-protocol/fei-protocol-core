pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "../Constants.sol";

contract PSMEthRouter {

    IPegStabilityModule public immutable psm;

    event EthDepositedForFei(address to, uint256 amount);

    constructor(IPegStabilityModule _psm) {
        psm = _psm;
        /// allow the PSM to spend all of our WETH
        /// this contract should never have eth, but in case someone self destructs and sends us some eth
        /// to try and grief us, that will not matter as we do not reference the contract balance
        IERC20(address(Constants.WETH)).approve(address(_psm), type(uint256).max);
    }

    /// @notice fallback function so that users can just send this contract eth and receive Fei in return
    /// this function takes an address 
    fallback(bytes calldata) external payable returns (bytes memory) {
        address to;
        assembly {
            to := calldataload(0)
        }

        _depositWethAndMint(to);
    }

    function mint(address to) external payable {
        _depositWethAndMint(to);
    }

    function _depositWethAndMint(address to) internal {
        Constants.WETH.deposit{value: msg.value}();
        psm.mint(msg.sender, msg.value);

        emit EthDepositedForFei(to, msg.value);
    }
}
