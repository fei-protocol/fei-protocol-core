// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";
import "./IUniswapPCVController.sol";
import "../../utils/Incentivized.sol";
import "../../refs/UniRef.sol";
import "../../external/UniswapV2Library.sol";
import "../../utils/Timed.sol";
import "../../Constants.sol";

/// @title a PCV controller for reweighting the Uniswap pair price to a peg
/// @author Fei Protocol
contract UniswapPCVController is IUniswapPCVController, UniRef, Timed, Incentivized {
    using Decimal for Decimal.D256;
    using Babylonian for uint256;

    /// @notice returns the linked pcv deposit contract
    IPCVDeposit public override pcvDeposit;

    Decimal.D256 internal _minDistanceForReweight;

    /// @notice UniswapPCVController constructor
    /// @param _core Fei Core for reference
    /// @param _pcvDeposit PCV Deposit to reweight
    /// @param _oracle oracle for reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _incentiveAmount amount of FEI for triggering a reweight
    /// @param _minDistanceForReweightBPs minimum distance from peg to reweight in basis points
    /// @param _pair Uniswap pair contract to reweight
    /// @param _reweightFrequency the frequency between reweights
    constructor(
        address _core,
        address _pcvDeposit,
        address _oracle,
        address _backupOracle,
        uint256 _incentiveAmount,
        uint256 _minDistanceForReweightBPs,
        address _pair,
        uint256 _reweightFrequency
    ) UniRef(_core, _pair, _oracle, _backupOracle) Timed(_reweightFrequency) Incentivized(_incentiveAmount) {
        pcvDeposit = IPCVDeposit(_pcvDeposit);
        emit PCVDepositUpdate(address(0), _pcvDeposit);

        _minDistanceForReweight = Decimal.ratio(
            _minDistanceForReweightBPs,
            Constants.BASIS_POINTS_GRANULARITY
        );
        emit ReweightMinDistanceUpdate(0, _minDistanceForReweightBPs);

        // start timer
        _initTimed();
    }

    /// @notice reweights the linked PCV Deposit to the peg price. Needs to be reweight eligible
    function reweight() external override whenNotPaused {
        updateOracle();
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
        updateOracle();
        _reweight();
    }

    /// @notice sets the target PCV Deposit address
    function setPCVDeposit(address newPCVDeposit) external override onlyGovernor {
        require(newPCVDeposit != address(0), "UniswapPCVController: zero address");

        address oldPCVDeposit = address(pcvDeposit);
        pcvDeposit = IPCVDeposit(newPCVDeposit);
        emit PCVDepositUpdate(oldPCVDeposit, newPCVDeposit);
    }

    /// @notice sets the reweight min distance in basis points
    function setReweightMinDistance(uint256 newReweightMinDistanceBPs)
        external
        override
        onlyGovernor
    {
        require(newReweightMinDistanceBPs <= Constants.BASIS_POINTS_GRANULARITY, "UniswapPCVController: reweight min distance too high");
        
        uint256 oldReweightMinDistanceBPs = _minDistanceForReweight.mul(Constants.BASIS_POINTS_GRANULARITY).asUint256();
        _minDistanceForReweight = Decimal.ratio(
            newReweightMinDistanceBPs,
            Constants.BASIS_POINTS_GRANULARITY
        );
        emit ReweightMinDistanceUpdate(oldReweightMinDistanceBPs, newReweightMinDistanceBPs);
    }

    /// @notice sets the reweight duration
    function setDuration(uint256 _duration)
        external
        override
        onlyGovernor
    {
       _setDuration(_duration);
    }

    /// @notice signal whether the reweight is available. Must have passed reweight frequency and minimum distance from peg
    function reweightEligible() public view override returns (bool) {
        bool meetsMagnitudeRequirement =
            getDistanceToPeg().greaterThan(_minDistanceForReweight);
        bool meetsTimeRequirement = isTimeEnded();
        return meetsMagnitudeRequirement && meetsTimeRequirement;
    }

    /// @notice return current percent distance from peg
    function getDistanceToPeg()
        public
        view
        override
        returns (Decimal.D256 memory distance)
    {
        Decimal.D256 memory price = _getUniswapPrice();
        Decimal.D256 memory peg = readOracle();

        // Get the absolute value raw distance from peg
        Decimal.D256 memory delta;
        if (price.lessThanOrEqualTo(peg)) {
            delta = peg.sub(price);
        } else {
            delta = price.sub(peg);
        }
        // return percentage by dividing distance by peg
        return delta.div(peg);
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

    function _reweight() internal {
        (uint256 feiReserves, uint256 tokenReserves) = getReserves();
        if (feiReserves == 0 || tokenReserves == 0) {
            return;
        }

        Decimal.D256 memory _peg = readOracle();

        // Determine reweight algorithm based on side of peg
        if (_isBelowPeg(_peg)) {
            _rebase(_peg, feiReserves, tokenReserves);
        } else {
            _reverseReweight(_peg, feiReserves, tokenReserves);
        }

        emit Reweight(msg.sender);
    }

    // Rebases the pool back up to the peg by directly burning FEI
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

    // Restores peg from above by minting and selling FEI
    function _reverseReweight(        
        Decimal.D256 memory _peg,
        uint256 feiReserves, 
        uint256 tokenReserves
    ) internal {
        // calculate amount FEI needed to return to peg then swap
        uint256 amountIn = _getAmountToPegFei(feiReserves, tokenReserves, _peg);

        // mint FEI directly to the pair before swapping
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
        // resupply all held PCV
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(address(this));

        // transfer to PCV deposit and trigger deposit logic
        SafeERC20.safeTransfer(erc20, address(pcvDeposit), balance);
        pcvDeposit.deposit();
    }

    /**
    * @notice utility for calculating absolute distance from peg based on reserves
    * @param reserveTarget pair reserves of the asset desired to trade with
    * @param reserveOther pair reserves of the non-traded asset
    * @param peg the target peg reported as Target per Other
    * 
    * Derivation:
    * Recall Uniswap's price and invariant formula, P = x/y and k = x*y
    * The objective is to return some delta |d| such that 
    *    x' = x + d
    *    y' = k / x'
    *    x'/y' = P' for target peg P'
    * 
    * Plugging in x' and y' to the new price formula gives:
    *    P' = (x + d)^2 / k
    *    sqrt(P' * k) = x + d
    *    sqrt(P' * x * y) - x = d
    * The resulting function returns |d| adjusted for uniswap fees
    */
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

    /// @notice get uniswap price
    /// @return price reported as Fei per X
    function _getUniswapPrice() internal view returns (Decimal.D256 memory) {
        (uint256 reserveFei, uint256 reserveOther) = getReserves();
        return Decimal.ratio(reserveFei, reserveOther);
    }

    /// @notice returns true if price is below the peg
    /// @dev counterintuitively checks if peg < price because price is reported as FEI per X
    function _isBelowPeg(Decimal.D256 memory peg) internal view returns (bool) {
        return peg.lessThan(_getUniswapPrice());
    }
}
