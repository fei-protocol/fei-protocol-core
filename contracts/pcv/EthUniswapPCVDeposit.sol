pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapPCVDeposit.sol";

contract EthUniswapPCVDeposit is UniswapPCVDeposit {

    constructor(address _token, address core) public
        UniswapPCVDeposit(_token, core) 
    {}

    function deposit(uint256 ethAmount) external override payable postGenesis {
    	require(ethAmount == msg.value, "Bonding Curve: Sent value does not equal input");
        uint256 feiAmount = getAmountFeiToDeposit(ethAmount);
        addLiquidity(ethAmount, feiAmount);
    }

    function removeLiquidity(uint256 liquidity) internal override returns (uint256) {
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

    function transferWithdrawn(address to, uint256 amount) internal override {
        payable(to).transfer(amount);
    }

    function addLiquidity(uint256 ethAmount, uint256 feiAmount) internal {
        mintFei(feiAmount);
        router.addLiquidityETH{value : ethAmount}(address(fei()),
            feiAmount,
            0,
            0,
            address(this),
            uint256(-1)
        );
    }

    fallback () external payable {

    }
}