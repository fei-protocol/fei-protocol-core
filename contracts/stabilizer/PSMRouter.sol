pragma solidity ^0.8.4;

import "./IPSMRouter.sol";
import "./PegStabilityModule.sol";
import "../Constants.sol";

contract PSMRouter is IPSMRouter {

    address public immutable override psm;

    constructor(address _psm) {
        psm = _psm;
        IERC20(address(Constants.WETH)).approve(_psm, type(uint256).max);
    }

    // ---------- Public State-Changing API ----------

    /// @notice Default mint if no calldata supplied
    /// @dev we don't use fallback here because fallback is only called if the function selector doesn't exist,
    /// and we actually want to revert in case someone made a mistake. Note that receive() cannot return values.
    receive() external payable override {
        _mint(msg.sender, 0);
    }

    /// @notice Mints fei to the given address, with a minimum amount required
    /// @dev This wraps ETH and then calls into the PSM to mint the fei. We return the amount of fei minted.
    /// @param _to The address to mint fei to
    /// @param _minAmountOut The minimum amount of fei to mint
    function mint(address _to, uint256 _minAmountOut) public payable override returns (uint256) {
        return _mint(_to, _minAmountOut);
    }

    // ---------- Internal Methods ----------
    
    function _mint(address _to, uint256 _minAmountOut) internal returns (uint256) {
        Constants.WETH.deposit{value: msg.value}();
        return IPegStabilityModule(psm).mint(_to, msg.value, _minAmountOut);
    }
}