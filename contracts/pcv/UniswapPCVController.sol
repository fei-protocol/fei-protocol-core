// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "./IUniswapPCVController.sol";
import "../refs/UniRef.sol";
import "../external/UniswapV2Library.sol";
import "../utils/Timed.sol";

/// @title a PCV controller for reweighting the Uniswap pair price to a peg
/// @author Fei Protocol
contract UniswapPCVController is IUniswapPCVController, UniRef, Timed {
    using Decimal for Decimal.D256;
    using Babylonian for uint256;

    uint256 internal constant BASIS_POINTS_GRANULARITY = 10000;

    /// @notice returns the linked pcv deposit contract
    IPCVDeposit public override pcvDeposit;

    /// @notice gets the FEI reward incentive for reweighting
    uint256 public override reweightIncentiveAmount;
    Decimal.D256 internal _minDistanceForReweight;

    /// @notice UniswapPCVController constructor
    /// @param _core Fei Core for reference
    /// @param _pcvDeposit PCV Deposit to reweight
    /// @param _oracle oracle for reference
    /// @param _incentiveAmount amount of FEI for triggering a reweight
    /// @param _minDistanceForReweightBPs minimum distance from peg to reweight in basis points
    /// @param _pair Uniswap pair contract to reweight
    /// @param _reweightFrequency the frequency between reweights
    constructor(
        address _core,
        address _pcvDeposit,
        address _oracle,
        uint256 _incentiveAmount,
        uint256 _minDistanceForReweightBPs,
        address _pair,
        uint256 _reweightFrequency
    ) UniRef(_core, _pair, _oracle) Timed(_reweightFrequency) {
        pcvDeposit = IPCVDeposit(_pcvDeposit);

        reweightIncentiveAmount = _incentiveAmount;
        _minDistanceForReweight = Decimal.ratio(
            _minDistanceForReweightBPs,
            BASIS_POINTS_GRANULARITY
        );

        // start timer
        _initTimed();
    }

    /// @notice reweights the linked PCV Deposit to the peg price. Needs to be reweight eligible
    function reweight() external override whenNotPaused {
        require(
            reweightEligible(),
            "UniswapPCVController: Not passed reweight time or not at min distance"
        );
        _reweight();
        _incentivize();

        // reset timer
        _initTimed();
    }

    /// @notice reweights regardless of eligibility
    function forceReweight() external override onlyGuardianOrGovernor {
        _reweight();
    }

    /// @notice sets the target PCV Deposit address
    function setPCVDeposit(address _pcvDeposit) external override onlyGovernor {
        pcvDeposit = IPCVDeposit(_pcvDeposit);
        emit PCVDepositUpdate(_pcvDeposit);
    }

    /// @notice sets the reweight incentive amount
    function setReweightIncentive(uint256 amount)
        external
        override
        onlyGovernor
    {
        reweightIncentiveAmount = amount;
        emit ReweightIncentiveUpdate(amount);
    }

    /// @notice sets the reweight min distance in basis points
    function setReweightMinDistance(uint256 basisPoints)
        external
        override
        onlyGovernor
    {
        _minDistanceForReweight = Decimal.ratio(
            basisPoints,
            BASIS_POINTS_GRANULARITY
        );
        emit ReweightMinDistanceUpdate(basisPoints);
    }

    /// @notice sets the reweight duration
    function setDuration(uint256 _duration)
        external
        override
        onlyGovernor
    {
       _setDuration(_duration);
    }

    /// @notice signal whether the reweight is available. Must have incentive parity and minimum distance from peg
    function reweightEligible() public view override returns (bool) {
        bool magnitude =
            _getDistanceToPeg().greaterThan(_minDistanceForReweight);
        // incentive parity is achieved after a certain time relative to distance from peg
        bool time = isTimeEnded();
        return magnitude && time;
    }

    /// @notice minimum distance as a percentage from the peg for a reweight to be eligible
    function minDistanceForReweight()
        external
        view
        override
        returns (Decimal.D256 memory)
    {
        return _minDistanceForReweight;
    }

    /// @notice get deviation from peg as a percent given price
    /// @dev will return Decimal.zero() if above peg
    function deviationBelowPeg(
        Decimal.D256 calldata price,
        Decimal.D256 calldata peg
    ) external pure returns (Decimal.D256 memory) {
        return _deviationBelowPeg(price, peg);
    }

    function _incentivize() internal ifMinterSelf {
        fei().mint(msg.sender, reweightIncentiveAmount);
    }

    function _reweight() internal {
        (uint256 feiReserves, uint256 tokenReserves) = getReserves();
        if (feiReserves == 0 || tokenReserves == 0) {
            return;
        }

        updateOracle();

        Decimal.D256 memory _peg = readOracle();

        if (_isBelowPeg(_peg)) {
            _rebase(_peg, feiReserves, tokenReserves);
        } else {
            _reverseReweight(_peg, feiReserves, tokenReserves);
        }

        emit Reweight(msg.sender);
    }

    function _rebase(
        Decimal.D256 memory _peg,
        uint256 feiReserves, 
        uint256 tokenReserves
    ) internal {
        // Calculate the ideal amount of FEI in the pool for the reserves of the non-FEI token
        uint256 targetAmount = _peg.mul(tokenReserves).asUint256();

        // burn the excess FEI not needed from the pool
        uint256 burnAmount = feiReserves - targetAmount;
        fei().burnFrom(address(pair), burnAmount);

        // sync the pair to restore the reserves 
        pair.sync();
    }

    function _reverseReweight(        
        Decimal.D256 memory _peg,
        uint256 feiReserves, 
        uint256 tokenReserves
    ) internal {
        // calculate amount FEI needed to return to peg then swap
        uint256 amountIn = _getAmountToPegFei(feiReserves, tokenReserves, _peg);

        IFei _fei = fei();
        _fei.mint(address(pair), amountIn);

        _swap(address(_fei), amountIn, feiReserves, tokenReserves);

        // Redeposit purchased tokens
        _deposit();
    }

    function _swap(
        address tokenIn,
        uint256 amount,
        uint256 reservesIn,
        uint256 reservesOut
    ) internal returns (uint256 amountOut) {

        amountOut = UniswapV2Library.getAmountOut(amount, reservesIn, reservesOut);

        (uint256 amount0Out, uint256 amount1Out) =
            pair.token0() == tokenIn
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
        pair.swap(amount0Out, amount1Out, address(this), new bytes(0));
    }

    function _deposit() internal {
        // resupply PCV at peg ratio
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(address(this));

        SafeERC20.safeTransfer(erc20, address(pcvDeposit), balance);
        pcvDeposit.deposit();
    }

    /// @notice utility for calculating absolute distance from peg based on reserves
    /// @param reserveTarget pair reserves of the asset desired to trade with
    /// @param reserveOther pair reserves of the non-traded asset
    /// @param peg the target peg reported as Target per Other
    function _getAmountToPeg(
        uint256 reserveTarget,
        uint256 reserveOther,
        Decimal.D256 memory peg
    ) internal pure returns (uint256) {
        uint256 radicand = peg.mul(reserveTarget).mul(reserveOther).asUint256();
        uint256 root = radicand.sqrt();
        if (root > reserveTarget) {
            return (root - reserveTarget) * 1000 / 997; // divide to include the .3% uniswap fee
        }
        return (reserveTarget - root) * 1000 / 997; // divide to include the .3% uniswap fee
    }

    /// @notice calculate amount of Fei needed to trade back to the peg
    function _getAmountToPegFei(
        uint256 feiReserves,
        uint256 tokenReserves,
        Decimal.D256 memory peg
    ) internal pure returns (uint256) {
        return _getAmountToPeg(feiReserves, tokenReserves, peg);
    }

    /// @notice get uniswap price and reserves
    /// @return price reported as Fei per X
    /// @return reserveFei fei reserves
    /// @return reserveOther non-fei reserves
    function _getUniswapPrice()
        internal
        view
        returns (
            Decimal.D256 memory,
            uint256 reserveFei,
            uint256 reserveOther
        )
    {
        (reserveFei, reserveOther) = getReserves();
        return (
            Decimal.ratio(reserveFei, reserveOther),
            reserveFei,
            reserveOther
        );
    }

    /// @notice returns true if price is below the peg
    /// @dev counterintuitively checks if peg < price because price is reported as FEI per X
    function _isBelowPeg(Decimal.D256 memory peg) internal view returns (bool) {
        (Decimal.D256 memory price, , ) = _getUniswapPrice();
        return peg.lessThan(price);
    }

    /// @notice return current percent distance from peg
    /// @dev will return Decimal.zero() if above peg
    function _getDistanceToPeg()
        internal
        view
        returns (Decimal.D256 memory distance)
    {
        (Decimal.D256 memory price, , ) = _getUniswapPrice();
        return _deviationBelowPeg(price, readOracle());
    }

    /// @notice get deviation from peg as a percent given price
    /// @dev will return Decimal.zero() if above peg
    function _deviationBelowPeg(
        Decimal.D256 memory price,
        Decimal.D256 memory peg
    ) internal pure returns (Decimal.D256 memory) {
        // If price <= peg, then FEI is more expensive and above peg
        // In this case we can just return zero for deviation
        if (price.lessThanOrEqualTo(peg)) {
            return Decimal.zero();
        }
        Decimal.D256 memory delta = price.sub(peg, "Impossible underflow");
        return delta.div(peg);
    }
}
