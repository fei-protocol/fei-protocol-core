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
    /// this function takes an address 
    fallback(bytes calldata) external payable returns (bytes memory) {
        address to;
        assembly {
            to := calldataload(0)
        }

        _depositWethAndMint(to);
    }

    receive() external payable {
        _depositWethAndMint(msg.sender);
    }

    function swapExactETHForFei(address to, uint256 deadline) external override payable ensure(deadline) {
        _depositWethAndMint(to);
    }

    function swapExactETHForExactFei(address to, uint256 amountsOutMin, uint256 deadline) external override payable ensure(deadline) {
        require(psm.getMintAmountOut(msg.value) >= amountsOutMin, "PSMRouter: insufficient output amount");
        _depositWethAndMint(to);
    }

    function swapExactFeiForExactTokens(
        address to,
        uint256 amountFeiIn,
        uint256 amountsOutMin,
        uint256 deadline
    ) external override payable ensure(deadline) {
        require(psm.getRedeemAmountOut(amountFeiIn) >= amountsOutMin, "PSMRouter: insufficient output amount");
        psm.redeem(to, amountFeiIn);
    }

    function _depositWethAndMint(address to) internal {
        Constants.WETH.deposit{value: msg.value}();
        psm.mint(msg.sender, msg.value);

        emit EthDepositedForFei(to, msg.value);
    }
}
