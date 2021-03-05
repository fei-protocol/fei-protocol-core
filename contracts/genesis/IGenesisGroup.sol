pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../external/Decimal.sol";

/// @title Genesis Group interface
/// @author Fei Protocol
interface IGenesisGroup {
    // ----------- Events -----------

    event Purchase(address indexed _to, uint256 _value);

    event Redeem(
        address indexed _to,
        uint256 _amountIn,
        uint256 _amountFei,
        uint256 _amountTribe
    );

    event Commit(address indexed _from, address indexed _to, uint256 _amount);

    event Launch(uint256 _timestamp);

    // ----------- Governor-only state changing API -----------
    
    function initGenesis() external;

    // ----------- State changing API -----------

    function purchase(address to, uint256 value) external payable;

    function redeem(address to) external;

    function commit(
        address from,
        address to,
        uint256 amount
    ) external;

    function launch() external;

    function emergencyExit(address from, address payable to) external;

    // ----------- Getters -----------

    function getAmountOut(uint256 amountIn, bool inclusive)
        external
        view
        returns (uint256 feiAmount, uint256 tribeAmount);

    function getAmountsToRedeem(address to)
        external
        view
        returns (
            uint256 feiAmount,
            uint256 genesisTribe,
            uint256 idoTribe
        );

    function committedFGEN(address account) external view returns (uint256);

    function totalCommittedFGEN() external view returns (uint256);

    function totalCommittedTribe() external view returns (uint256);

    function launchBlock() external view returns (uint256);
}
