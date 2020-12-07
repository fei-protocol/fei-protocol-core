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
	)
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
	public {
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
		uint feiAmount = ratio.mul(feiBalance()).asUint256();
		fei().transfer(to, feiAmount);

		uint tribeAmount = ratio.mul(tribeBalance()).asUint256();
		tribe().transfer(to, tribeAmount);
	}

	function launch() external {
		core().completeGenesisGroup();
		address genesisGroup = address(this);
		bondingcurve.purchase(genesisGroup.balance, genesisGroup);
		ido.deploy(exchangeRate());
	}

	function getAmountOut(uint amountIn, bool inclusive) public view returns (uint) {
		uint totalIn = totalSupply();
		if (!inclusive) {
			totalIn += amountIn;
		}
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