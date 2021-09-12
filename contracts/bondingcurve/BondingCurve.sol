// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IBondingCurve.sol";
import "../refs/OracleRef.sol";
import "../pcv/utils/PCVSplitter.sol";
import "../utils/Incentivized.sol";
import "../pcv/IPCVDeposit.sol";
import "../utils/Timed.sol";
import "../Constants.sol";

/**
 * @title a bonding curve for purchasing FEI with ERC-20 tokens
 * @author Fei Protocol
 * 
 */ 
contract BondingCurve is IPCVDepositBalances, IBondingCurve, OracleRef, PCVSplitter, Timed, Incentivized {
    using Decimal for Decimal.D256;

    /// @notice the Scale target at which bonding curve price fixes
    uint256 public override scale;

    /// @notice the ERC20 token for this bonding curve
    IERC20 public immutable override token;

    /// @notice the total amount of FEI purchased on bonding curve
    uint256 public override totalPurchased;

    /// @notice the buffer applied on top of the peg purchase price once at Scale
    uint256 public override buffer;
    
    /// @notice the discount applied on top of peg before at Scale
    uint256 public override discount;

    /// @notice the cap on how much FEI can be minted by the bonding curve
    uint256 public override mintCap;

    /// @notice constructor
    /// @param _core Fei Core to reference
    /// @param _oracle the price oracle to reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _scale the Scale target where peg fixes
    /// @param _pcvDeposits the PCV Deposits for the PCVSplitter
    /// @param _ratios the ratios for the PCVSplitter
    /// @param _duration the duration between incentivizing allocations
    /// @param _incentive the amount rewarded to the caller of an allocation
    /// @param _token the ERC20 token associated with this curve, null if ETH
    /// @param _discount the discount applied to FEI purchases before reaching scale in basis points (1/10000)
    /// @param _buffer the buffer applied to FEI purchases after reaching scale in basis points (1/10000)
    constructor(
        address _core,
        address _oracle,
        address _backupOracle,
        uint256 _scale,
        address[] memory _pcvDeposits,
        uint256[] memory _ratios,
        uint256 _duration,
        uint256 _incentive,
        IERC20 _token,
        uint256 _discount,
        uint256 _buffer
    )
        OracleRef(_core, _oracle, _backupOracle, 0, false)
        PCVSplitter(_pcvDeposits, _ratios)
        Timed(_duration)
        Incentivized(_incentive)
    {
        _setMintCap(_scale); // default mint cap is scale
        _setScale(_scale);
        token = _token;

        discount = _discount;
        emit DiscountUpdate(0, _discount);

        buffer = _buffer;
        emit BufferUpdate(0, _buffer);

        _initTimed();

        if (address(_token) != address(0)) {
            _setDecimalsNormalizerFromToken(address(_token));
        }
    }

    /// @notice purchase FEI for underlying tokens
    /// @param to address to receive FEI
    /// @param amountIn amount of underlying tokens input
    /// @return amountOut amount of FEI received
    function purchase(address to, uint256 amountIn)
        external
        payable
        virtual
        override
        whenNotPaused
        returns (uint256 amountOut)
    {
        require(msg.value == 0, "BondingCurve: unexpected ETH input");
        SafeERC20.safeTransferFrom(token, msg.sender, address(this), amountIn);
        return _purchase(amountIn, to);
    }

    /// @notice balance of the bonding curve
    /// @return the amount of PCV held in contract and ready to be allocated
    function balance() public view virtual override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    /// @notice returns a manipulation resistant account of both the balance of underlying and protocol owned FEI
    function resistantBalanceAndFei() public view override returns(uint256, uint256) {
      return (balance(), 0);
    }

    /// @notice sets the bonding curve Scale target
    function setScale(uint256 newScale) external override onlyGovernorOrAdmin {
        _setScale(newScale);
    }

    /// @notice resets the totalPurchased
    function reset() external override onlyGovernorOrAdmin {
        uint256 oldTotalPurchased = totalPurchased;
        totalPurchased = 0;
        emit Reset(oldTotalPurchased);
    }

    /// @notice sets the bonding curve price buffer
    function setBuffer(uint256 newBuffer) external override onlyGovernorOrAdmin {
        require(
            newBuffer < Constants.BASIS_POINTS_GRANULARITY,
            "BondingCurve: Buffer exceeds or matches granularity"
        );
        uint256 oldBuffer = buffer;
        buffer = newBuffer;
        emit BufferUpdate(oldBuffer, newBuffer);
    }

    /// @notice sets the bonding curve price discount
    function setDiscount(uint256 newDiscount) external override onlyGovernorOrAdmin {
        require(
            newDiscount < Constants.BASIS_POINTS_GRANULARITY,
            "BondingCurve: Buffer exceeds or matches granularity"
        );
        uint256 oldDiscount = discount;
        discount = newDiscount;
        emit DiscountUpdate(oldDiscount, newDiscount);
    }

    /// @notice sets the allocate incentive frequency
    function setIncentiveFrequency(uint256 _frequency) external override onlyGovernorOrAdmin {
        _setDuration(_frequency);
    }

    /// @notice sets the mint cap for the bonding curve
    function setMintCap(uint256 _mintCap) external override onlyGovernorOrAdmin {
        _setMintCap(_mintCap);
    }

    /// @notice batch allocate held PCV
    function allocate() external override whenNotPaused {
        uint256 amount = balance();
        uint256 usdValueHeld = readOracle().mul(amount).asUint256();
        // the premium is the USD value held multiplied by the buffer that a user would pay to get FEI assuming FEI is $1
        uint256 premium = usdValueHeld * buffer / Constants.BASIS_POINTS_GRANULARITY;

        // this requirement mitigates gaming the allocate function and ensures it is only called when sufficient demand has been met
        require(premium >= incentiveAmount, "BondingCurve: Not enough PCV held");

        _allocate(amount);

        // if window has passed, reward caller and reset window
        if (isTimeEnded()) {
            _initTimed(); // reset window
            _incentivize();
        }
    }

    /// @notice a boolean signalling whether Scale has been reached
    function atScale() public view override returns (bool) {
        return totalPurchased >= scale;
    }

    /// @notice returns how close to the minting cap we are
    function availableToMint() public view override returns (uint256) {
        return mintCap - totalPurchased;
    }

    /// @notice return current instantaneous bonding curve price
    /// @return price reported as FEI per USD
    /// @dev Can be inaccurate if outdated, need to call `oracle().isOutdated()` to check
    function getCurrentPrice()
        public
        view
        override
        returns (Decimal.D256 memory)
    {
        if (atScale()) {
            return _getBufferMultiplier();
        }
        return _getBondingCurvePriceMultiplier();
    }

    /// @notice return amount of FEI received after a bonding curve purchase
    /// @param amountIn the amount of underlying used to purchase
    /// @return amountOut the amount of FEI received
    /// @dev Can be innacurate if outdated, need to call `oracle().isOutdated()` to check
    function getAmountOut(uint256 amountIn)
        public
        view
        override
        returns (uint256 amountOut)
    {
        // the FEI value of the input amount
        uint256 feiValueOfAmountIn = readOracle().mul(amountIn).asUint256();

        Decimal.D256 memory price = getCurrentPrice();

        if (!atScale()) {
            uint256 preScaleAmount = scale - totalPurchased;

            // crossing scale
            if (feiValueOfAmountIn > preScaleAmount) {
                uint256 postScaleAmount = feiValueOfAmountIn - preScaleAmount;
                // combined pricing of pre-scale price times the amount to reach scale and post-scale price times remainder
                return price.mul(preScaleAmount).add(_getBufferMultiplier().mul(postScaleAmount)).asUint256();
            }
        }

        amountOut = price.mul(feiValueOfAmountIn).asUint256();
    }

    /// @notice mint FEI and send to buyer destination
    function _purchase(uint256 amountIn, address to)
        internal
        returns (uint256 amountOut)
    {
        updateOracle();

        amountOut = getAmountOut(amountIn);

        require(availableToMint() >= amountOut, "BondingCurve: exceeds mint cap");

        _incrementTotalPurchased(amountOut);
        _mintFei(to, amountOut);

        emit Purchase(to, amountIn, amountOut);

        return amountOut;
    }

    function _incrementTotalPurchased(uint256 amount) internal {
        totalPurchased = totalPurchased + amount;
    }

    function _setScale(uint256 newScale) internal {
        require(newScale != 0, "BondingCurve: zero scale");

        uint256 oldScale = scale;
        scale = newScale;
        emit ScaleUpdate(oldScale, newScale);
    }

    function _setMintCap(uint256 newMintCap) internal {
        require(newMintCap != 0, "BondingCurve: zero mint cap");

        uint256 oldMintCap = mintCap;
        mintCap = newMintCap;

        emit MintCapUpdate(oldMintCap, newMintCap);
    }

    /// @notice the bonding curve price multiplier used before Scale
    function _getBondingCurvePriceMultiplier()
        internal
        view
        virtual
        returns (Decimal.D256 memory)
    {
        uint256 granularity = Constants.BASIS_POINTS_GRANULARITY;
        // uses 1/1-b because the oracle price is inverted
        return Decimal.ratio(granularity, granularity - discount);
    }

    /// @notice returns the buffer on the post-scale bonding curve price
    function _getBufferMultiplier() internal view returns (Decimal.D256 memory) {
        uint256 granularity = Constants.BASIS_POINTS_GRANULARITY;
        // uses 1/1+b because the oracle price is inverted
        return Decimal.ratio(granularity, granularity + buffer);
    }

    // Allocates a portion of escrowed PCV to a target PCV deposit
    function _allocateSingle(uint256 amount, address pcvDeposit)
        internal
        virtual
        override
    {
        SafeERC20.safeTransfer(token, pcvDeposit, amount);
        IPCVDeposit(pcvDeposit).deposit();
    }
}
