pragma solidity ^0.8.4;

import "./IPSMRouter.sol";
import "./PegStabilityModule.sol";
import "../Constants.sol";

contract PSMRouter is IPSMRouter {

    IPegStabilityModule public immutable psm;

    constructor(IPegStabilityModule _psm) {
        psm = _psm;
        /// allow the PSM to spend all of our WETH
        /// this contract should never have eth, but in case someone self destructs and sends us some eth
        /// to try and grief us, that will not matter as we do not reference the contract balance
        IERC20(address(Constants.WETH)).approve(address(_psm), type(uint256).max);
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "PSMRouter: order expired");
        _;
    }

    /// @notice fallback function so that users can just send this contract eth and receive Fei in return
    /// this function takes an address and minAmountOut as params from the calldata
    fallback(bytes calldata data) external payable returns (bytes memory) {
        (address to, uint256 minAmountOut) = abi.decode(data, (address, uint256));

        _depositWethAndMint(to, minAmountOut);
    }

    /// front running and back running is not possible so minAmountOut is set to msg.value
    /// this will work as long as the eth price is above, $1 which is a reasonable assumption
    receive() external payable {
        _depositWethAndMint(msg.sender, msg.value);
    }

    function swapExactETHForExactFei(address to, uint256 amountsOutMin, uint256 deadline) external override payable ensure(deadline) {
        _depositWethAndMint(to, amountsOutMin);
    }

    function _depositWethAndMint(address to, uint256 minAmountOut) internal {
        Constants.WETH.deposit{value: msg.value}();
        psm.mint(msg.sender, msg.value, minAmountOut);

        emit EthDepositedForFei(to, msg.value);
    }
}
