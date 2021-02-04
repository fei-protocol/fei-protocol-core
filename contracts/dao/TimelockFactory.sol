pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "../utils/LinearTokenTimelock.sol";

/// @title Factory for distributing tokens via LinearTokenTimelocks
/// @author Fei Protocol
contract TimelockFactory is Ownable, Timed {

    IERC20 public timelockFactoryToken;

	/// @notice TimelockFactory constructor
	/// @param _token the timelock factory token address
	/// @param _owner distributor of the timelocked delegators
	/// @param _duration duration of the token timelock window
	constructor(address _token, address _owner, uint32 _duration) public Timed(_duration) {

        transferOwnership(_owner);

		timelockFactoryToken = IERC20(_token);
	}

	function grant(address beneficiary, uint amount) public onlyOwner {
        require(amount != 0, "TimelockFactory: Amount is zero");
		require(amount <= _tokenBalance(), "TimelockFactory: Not enough tokens");

		address grantAddress = _createTimelock(beneficiary);

		TransferHelper.safeTransfer(address(timelockFactoryToken), grantAddress, amount);
	}

    function _tokenBalance() internal view returns (uint256) {
    	return timelockFactoryToken.balanceOf(address(this));
    }

	function _createTimelock(address beneficiary) internal virtual returns(address) {
		return address(new LinearTokenTimelock(
			address(timelockFactoryToken),
			beneficiary,
			remainingTime()
		));
	}
}
