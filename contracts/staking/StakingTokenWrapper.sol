pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "./IMasterChief.sol";

/// @title StakingTokenWrapper for masterChief
/// @notice Allows the MasterChief to distribute TRIBE to a beneficiary contract 
/// The beneficiary is the sole holder of a dummy token staked in the MasterChief
contract StakingTokenWrapper is ERC20, Initializable {
    IMasterChief public masterChief;
    
    uint256 public pid;

    address public beneficiary;

    constructor(
        IMasterChief _masterChief, 
        address _beneficiary
    ) ERC20("Tribe MasterChief Staking Wrapper", "TKN") {
        masterChief = _masterChief;
        beneficiary = _beneficiary;
    }

    function init(uint256 _pid) external initializer {
        pid = _pid;
        uint256 amount = 1e18;
        _mint(address(this), amount);
        _approve(address(this), address(masterChief), amount);
        masterChief.deposit(pid, amount, address(this));
    }

    function harvest() external {
        masterChief.harvest(pid, beneficiary);
    }
}