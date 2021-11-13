pragma solidity ^0.8.4;

import "./IPSMRouter.sol";
import "./PegStabilityModule.sol";
import "../Constants.sol";

contract PSMRouter is IPSMRouter {

    IPegStabilityModule public immutable override psm;

    constructor(IPegStabilityModule _psm) {
        psm = _psm;
        IERC20(address(Constants.WETH)).approve(address(_psm), type(uint256).max);
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "PSMRouter: order expired");
        _;
    }

    // ---------- Public State-Changing API ----------

    /// @notice Mints fei to the given address, with a minimum amount required
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param to The address to mint fei to
    /// @param minAmountOut The minimum amount of fei to mint
    function mint(address to, uint256 minAmountOut) external payable override returns (uint256) {
        return _mint(to, minAmountOut);
    }

    /// @notice Mints fei to the given address, with a minimum amount required and a deadline
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param to The address to mint fei to
    /// @param minAmountOut The minimum amount of fei to mint
    /// @param deadline The minimum amount of fei to mint
    function mint(address to, uint256 minAmountOut, uint256 deadline) external payable ensure(deadline) returns (uint256) {
        return _mint(to, minAmountOut);
    }

    // ---------- Internal Methods ----------
    
    function _mint(address _to, uint256 _minAmountOut) internal returns (uint256) {
        Constants.WETH.deposit{value: msg.value}();
        return psm.mint(_to, msg.value, _minAmountOut);
    }
}