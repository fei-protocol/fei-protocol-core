pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "./IDOInterface.sol";
import "../utils/LinearTokenTimelock.sol";
import "../refs/UniRef.sol";

/// @title an initial DeFi offering for the TRIBE token
/// @author Fei Protocol
contract IDO is IDOInterface, UniRef, LinearTokenTimelock {
    /// @notice IDO constructor
    /// @param _core Fei Core address to reference
    /// @param _beneficiary the beneficiary to vest LP shares
    /// @param _duration the duration of LP share vesting
    /// @param _pair the Uniswap pair contract of the IDO
    /// @param _router the Uniswap router contract
    constructor(
        address _core,
        address _beneficiary,
        uint256 _duration,
        address _pair,
        address _router
    )
        public
        UniRef(_core, _pair, _router, address(0)) // no oracle needed
        LinearTokenTimelock(_beneficiary, _duration, _pair)
    {}

    /// @notice deploys all held TRIBE on Uniswap at the given ratio
    /// @param feiRatio the exchange rate for FEI/TRIBE
    /// @dev the contract will mint any FEI necessary to do the listing. Assumes no existing LP
    function deploy(Decimal.D256 calldata feiRatio)
        external
        override
        onlyGenesisGroup
    {
        uint256 tribeAmount = tribeBalance();

        // calculate and mint amount of FEI for IDO
        uint256 feiAmount = feiRatio.mul(tribeAmount).asUint256();
        _mintFei(feiAmount);

        // deposit liquidity
        uint256 endOfTime = uint256(-1);
        router.addLiquidity(
            address(tribe()),
            address(fei()),
            tribeAmount,
            feiAmount,
            tribeAmount,
            feiAmount,
            address(this),
            endOfTime
        );

        emit Deploy(feiAmount, tribeAmount);
    }

    /// @notice swaps Genesis Group FEI on Uniswap For TRIBE
    /// @param amountFei the amount of FEI to swap
    /// @return uint amount of TRIBE sent to Genesis Group
    function swapFei(uint256 amountFei)
        external
        override
        onlyGenesisGroup
        returns (uint256)
    {
        (uint256 feiReserves, uint256 tribeReserves) = getReserves();

        uint256 amountOut =
            UniswapV2Library.getAmountOut(
                amountFei,
                feiReserves,
                tribeReserves
            );

        fei().transferFrom(msg.sender, address(pair), amountFei);

        (uint256 amount0Out, uint256 amount1Out) =
            pair.token0() == address(fei())
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
        pair.swap(amount0Out, amount1Out, msg.sender, new bytes(0));

        fei().burnFrom(address(pair), amountFei);
        pair.sync();
        
        return amountOut;
    }
}
