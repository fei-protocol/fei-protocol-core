pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./ITribalChief.sol";

/// @title StakingTokenWrapper for TribalChief
/// @notice Allows the TribalChief to distribute TRIBE to a beneficiary contract
/// The beneficiary is the sole holder of a dummy token staked in the TribalChief
contract StakingTokenWrapper is ERC20, Initializable {
    /// @notice the TribalChief staking rewards contract
    ITribalChief public tribalChief;

    /// @notice the pool id of the corresponding pool in the TribalChief
    uint256 public pid;

    /// @notice the recipient of all harvested TRIBE
    address public beneficiary;

    /// @notice constructor for the StakingTokenWrapper
    /// @param _tribalChief the TribalChief contract
    /// @param _beneficiary the recipient of all harvested TRIBE
    constructor(ITribalChief _tribalChief, address _beneficiary)
        ERC20("TribalChief Staking Wrapper", "TKN")
    {
        tribalChief = _tribalChief;
        beneficiary = _beneficiary;
    }

    /// @notice initialize the pool with this token as the sole staker
    /// @param _pid the pool id of the staking pool associated with this token
    function init(uint256 _pid) external initializer {
        require(
            address(tribalChief.stakedToken(_pid)) == address(this),
            "StakedTokenWrapper: invalid pid"
        );
        pid = _pid;

        uint256 amount = 1e18;
        _mint(address(this), amount);

        _approve(address(this), address(tribalChief), amount);
        tribalChief.deposit(pid, amount, 0);
    }

    /// @notice send rewards to the beneficiary
    function harvest() external {
        tribalChief.harvest(pid, beneficiary);
    }
}
