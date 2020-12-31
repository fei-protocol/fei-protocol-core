pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapPCVDeposit.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title implementation for an ETH Uniswap LP PCV Deposit
/// @author Fei Protocol
contract EthUniswapPCVDeposit is UniswapPCVDeposit {
    using Address for address payable;

    event Deposit(address indexed _from, uint _amount);

    constructor(address core, address _pair, address _router, address _oracle) public
        UniswapPCVDeposit(core, _pair, _router, _oracle) 
    {}

    function deposit(uint256 ethAmount) external override payable postGenesis {
    	require(ethAmount == msg.value, "Bonding Curve: Sent value does not equal input");
        uint256 feiAmount = _getAmountFeiToDeposit(ethAmount);
        _addLiquidity(ethAmount, feiAmount);
        emit Deposit(msg.sender, ethAmount);
    }

    function _removeLiquidity(uint256 liquidity) internal override returns (uint256) {
        (, uint256 amountWithdrawn) = router.removeLiquidityETH(
            address(fei()),
            liquidity,
            0,
            0,
            address(this),
            uint256(-1)
        );
        return amountWithdrawn;
    }

    function _transferWithdrawn(address to, uint256 amount) internal override {
        payable(to).sendValue(amount);
    }

    function _addLiquidity(uint256 ethAmount, uint256 feiAmount) internal {
        _mintFei(feiAmount);
        router.addLiquidityETH{value : ethAmount}(address(fei()),
            feiAmount,
            0,
            0,
            address(this),
            uint256(-1)
        );
    }

    receive() external payable {

    }
}