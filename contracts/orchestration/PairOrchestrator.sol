pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "../external/UniswapV2Pair.sol";
import "./IOrchestrator.sol";

contract PairOrchestrator is IPairOrchestrator, Ownable {

    IUniswapV2Factory public constant UNISWAP_FACTORY =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

    function init(
        address tribe,
        address weth,
        address fei
    )
        public
        override
        onlyOwner
        returns (address ethFeiPair, address tribeFeiPair)
    {
        UniswapV2Pair _ethFeiPair = new UniswapV2Pair();
        _ethFeiPair.initialize(fei, weth);
        ethFeiPair = address(_ethFeiPair);
        tribeFeiPair = UNISWAP_FACTORY.createPair(tribe, fei);
        return (ethFeiPair, tribeFeiPair);
    }

    function detonate() public override onlyOwner {
        selfdestruct(payable(owner()));
    }
}
