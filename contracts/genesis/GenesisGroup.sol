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

	function purchase(address to) public payable onlyGenesisPeriod {
		uint value = msg.value;
		require(value != 0, "GenesisGroup: no value sent");
		_mint(to, value);
	}

	function redeem(address to) public postGenesis {
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

	function getAmountOut(uint amountIn, bool inclusive) public view returns (uint) {
		// TODO what happens when this number is different from ETH in?
		uint totalIn = totalSupply();
		if (!inclusive) {
			totalIn += amountIn;
		}
		require(amountIn <= totalIn, "GenesisGroup: Not enough supply");
		uint totalOut = bondingcurve.getAmountOut(totalIn);
		return totalOut * amountIn / totalIn;
	}

	function exchangeRate() public view returns (Decimal.D256 memory) {
		return Decimal.ratio(feiBalance(), tribeBalance());
	}

	function fgenRatio(address account) internal view returns (Decimal.D256 memory) {
		return Decimal.ratio(balanceOf(account), totalSupply());
	}
}