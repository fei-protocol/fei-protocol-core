pragma solidity ^0.8.0;

import "./FeiTimedMinter.sol";
import "./IPCVEquityMinter.sol";
import "../Constants.sol";
import "../pcv/IPCVSwapper.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title PCVEquityMinter
/// @notice A FeiTimedMinter that mints based on a percentage of PCV equity
contract PCVEquityMinter is IPCVEquityMinter, FeiTimedMinter {
    using SafeCast for int256;

    /// @notice The maximum percentage of PCV equity to be minted per year, in basis points 
    uint256 public constant override MAX_APR_BASIS_POINTS = 2000; // Max 20% per year

    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant FEI_MINTING_LIMIT_PER_SECOND = 1000e18; // 1000 FEI/s or ~86m FEI/day

    /// @notice the collateralization oracle used to determine PCV equity
    ICollateralizationOracle public override collateralizationOracle;

    /// @notice the APR paid out from pcv equity per year expressed in basis points
    uint256 public override aprBasisPoints;

    /**
        @notice constructor for PCVEquityMinter
        @param _core the Core address to reference
        @param _target the target to receive minted FEI
        @param _incentive the incentive amount for calling buy paid in FEI
        @param _frequency the frequency buybacks happen
        @param _collateralizationOracle the collateralization oracle used for PCV equity calculations
        @param _aprBasisPoints the APR paid out from pcv equity per year expressed in basis points
    */
    constructor(
        address _core,
        address _target,
        uint256 _incentive,
        uint256 _frequency,
        ICollateralizationOracle _collateralizationOracle,
        uint256 _aprBasisPoints
    ) 
        FeiTimedMinter(_core, _target, _incentive, _frequency, FEI_MINTING_LIMIT_PER_SECOND * _frequency)
    {
        _setCollateralizationOracle(_collateralizationOracle);
        _setAPRBasisPoints(_aprBasisPoints);
    }

    /// @notice triggers a minting of FEI based on the PCV equity
    function mint() public override {
        collateralizationOracle.update();
        super.mint();
    }

    function mintAmount() public view override returns (uint256) {
        (,,int256 equity, bool valid) = collateralizationOracle.pcvStats();

        require(equity > 0, "PCVEquityMinter: Equity is nonpositive");
        require(valid, "PCVEquityMinter: invalid CR oracle");

        // return total equity scaled proportionally by the APR and the ratio of the mint frequency to the entire year
        return equity.toUint256() * aprBasisPoints / Constants.BASIS_POINTS_GRANULARITY * duration / SECONDS_PER_YEAR;
    }
    
    /// @notice set the collateralization oracle
    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) external override onlyGovernor {
        _setCollateralizationOracle(newCollateralizationOracle);
    }

    /// @notice sets the new APR for determining buyback size from PCV equity
    function setAPRBasisPoints(uint256 newAprBasisPoints) external override onlyGovernorOrAdmin {
        _setAPRBasisPoints(newAprBasisPoints);
    }

    function _setAPRBasisPoints(uint256 newAprBasisPoints) internal {
        require(newAprBasisPoints != 0, "PCVEquityMinter: zero APR");
        require(newAprBasisPoints <= MAX_APR_BASIS_POINTS, "PCVEquityMinter: APR above max");

        uint256 oldAprBasisPoints = aprBasisPoints;
        aprBasisPoints = newAprBasisPoints;
        emit APRUpdate(oldAprBasisPoints, newAprBasisPoints);
    }

    function _setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) internal {
        require(address(newCollateralizationOracle) != address(0), "PCVEquityMinter: zero address");
        address oldCollateralizationOracle = address(collateralizationOracle);
        collateralizationOracle = newCollateralizationOracle;
        emit CollateralizationOracleUpdate(address(oldCollateralizationOracle), address(newCollateralizationOracle));
    }

    function _afterMint() internal override {
        IPCVSwapper(target).swap();
    }
}