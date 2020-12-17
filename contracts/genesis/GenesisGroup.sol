pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../bondingcurve/IBondingCurve.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IDOInterface {
	function deploy(Decimal.D256 calldata feiRatio) external;
}

contract GenesisGroup is ERC20, CoreRef {
	using Decimal for Decimal.D256;

	IBondingCurve public bondingcurve;
	IDOInterface public ido;

	uint private constant EXCHANGE_RATE_DISCOUNT = 10;

	constructor(
		address _core, 
		address _bondingcurve,
		address _ido
	) public
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
	{
		bondingcurve = IBondingCurve(_bondingcurve);
		ido = IDOInterface(_ido);
	}

	function purchase(address to, uint value) external payable onlyGenesisPeriod {
		require(msg.value == value, "GenesisGroup: value mismatch");
		require(value != 0, "GenesisGroup: no value sent");
		_mint(to, value);
	}

	function redeem(address to) external postGenesis {
		Decimal.D256 memory ratio = fgenRatio(to);
		require(!ratio.equals(Decimal.zero()), "GensisGroup: No balance to redeem");
		_burn(to, balanceOf(to));
		uint feiAmount = ratio.mul(feiBalance()).asUint256();
		fei().transfer(to, feiAmount);

		uint tribeAmount = ratio.mul(tribeBalance()).asUint256();
		tribe().transfer(to, tribeAmount);
	}

	function launch() external {
		core().completeGenesisGroup();
		address genesisGroup = address(this);
		uint balance = genesisGroup.balance;
		bondingcurve.purchase{value: balance}(balance, genesisGroup);
		ido.deploy(exchangeRate());
	}

	function getAmountOut(uint amountIn, bool inclusive) public view returns (uint feiAmount, uint tribeAmount) {
		// TODO what happens when this number is different from ETH in? i.e. someone force sends ETH
		uint totalIn = totalSupply();
		if (!inclusive) {
			totalIn += amountIn;
		}
		require(amountIn <= totalIn, "GenesisGroup: Not enough supply");
		uint totalFei = bondingcurve.getAmountOut(totalIn);
		uint totalTribe = tribeBalance();
		return (totalFei * amountIn / totalIn, totalTribe * amountIn / totalIn);
	}

	function exchangeRate() public view returns (Decimal.D256 memory) {
		return Decimal.ratio(feiBalance(), tribeBalance()).div(exchangeRateDiscount());
	}

	function exchangeRateDiscount() internal pure returns(uint) {
		return EXCHANGE_RATE_DISCOUNT;
	}

	function fgenRatio(address account) internal view returns (Decimal.D256 memory) {
		return Decimal.ratio(balanceOf(account), totalSupply());
	}
}