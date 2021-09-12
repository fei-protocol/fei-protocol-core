pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "../utils/Timed.sol";
import "../utils/Incentivized.sol";
import "../utils/RateLimitedMinter.sol";
import "./IFeiTimedMinter.sol";

/// @title FeiTimedMinter
/// @notice a contract which mints FEI to a target address on a timed cadence
contract FeiTimedMinter is IFeiTimedMinter, CoreRef, Timed, Incentivized, RateLimitedMinter {
    
    /// @notice most frequent that mints can happen
    uint256 public constant override MIN_MINT_FREQUENCY = 1 hours; // Min 1 hour per mint

    /// @notice least frequent that mints can happen
    uint256 public constant override MAX_MINT_FREQUENCY = 30 days; // Max 1 month per mint
    
    uint256 private _mintAmount;

    /// @notice the target receiving minted FEI
    address public override target;

    /**
        @notice constructor for FeiTimedMinter
        @param _core the Core address to reference
        @param _target the target for minted FEI
        @param _incentive the incentive amount for calling mint paid in FEI
        @param _frequency the frequency minting happens
        @param _initialMintAmount the initial FEI amount to mint
    */
    constructor(
        address _core,
        address _target,
        uint256 _incentive,
        uint256 _frequency,
        uint256 _initialMintAmount
    ) 
        CoreRef(_core)
        Timed(_frequency)
        Incentivized(_incentive)
        RateLimitedMinter((_initialMintAmount + _incentive) / _frequency, (_initialMintAmount + _incentive), true) 
    {
        _initTimed();

        _setTarget(_target);
        _setMintAmount(_initialMintAmount);
    }

    /// @notice triggers a minting of FEI
    /// @dev timed and incentivized
    function mint() public virtual override whenNotPaused afterTime {

        /// Reset the timer
        _initTimed();

        uint256 amount = mintAmount();

        // incentivizing before minting so if there is a partial mint it goes to target not caller
        _incentivize();

        if (amount != 0) {
            // Calls the overriden RateLimitedMinter _mintFei which includes the rate limiting logic
            _mintFei(target, amount);
        
            emit FeiMinting(msg.sender, amount);
        }
        // After mint called whether a "mint" happens or not to allow incentivized target hooks
        _afterMint();
    }
    
    function mintAmount() public view virtual override returns (uint256) {
        return _mintAmount;
    }

    /// @notice set the new FEI target
    function setTarget(address newTarget) external override onlyGovernor {
        _setTarget(newTarget);
    }

    /// @notice set the mint frequency
    function setFrequency(uint256 newFrequency) external override onlyGovernorOrAdmin {
        require(newFrequency >= MIN_MINT_FREQUENCY, "FeiTimedMinter: frequency low");
        require(newFrequency <= MAX_MINT_FREQUENCY, "FeiTimedMinter: frequency high");

        _setDuration(newFrequency);
    }

    function setMintAmount(uint256 newMintAmount) external override onlyGovernorOrAdmin {
        _setMintAmount(newMintAmount);
    }

    function _setTarget(address newTarget) internal {
        require(newTarget != address(0), "FeiTimedMinter: zero address");
        address oldTarget = target;
        target = newTarget;
        emit TargetUpdate(oldTarget, newTarget);
    }

    function _setMintAmount(uint256 newMintAmount) internal {
        uint256 oldMintAmount = _mintAmount;
        _mintAmount = newMintAmount;
        emit MintAmountUpdate(oldMintAmount, newMintAmount);
    }

    function _mintFei(address to, uint256 amountIn) internal override(CoreRef, RateLimitedMinter) {
      RateLimitedMinter._mintFei(to, amountIn);
    }

    function _afterMint() internal virtual {}
}