pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../bondingcurve/IBondingCurve.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "../pool/IPool.sol";
import "../oracle/IBondingCurveOracle.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

interface IDOInterface {
	function deploy(Decimal.D256 calldata feiRatio) external;
}

interface IOrchestrator {
	function launchGovernance() external;
	function pool() external returns(address);
	function bondingCurveOracle() external returns(address);
}

contract GenesisGroup is CoreRef, ERC20, ERC20Burnable {
	using Decimal for Decimal.D256;

	IOrchestrator public orchestrator;
	IBondingCurve public bondingcurve;
	IDOInterface public ido;

	uint public startTime;
	uint public duration;
	uint private exchangeRateDiscount;

	Decimal.D256 public maxGenesisPrice;

	event Purchase(address indexed _to, uint _value);
	event Redeem(address indexed _to, uint _amountFei, uint _amountTribe);
	event Launch(uint timestamp);

	constructor(
		address _core, 
		address _bondingcurve,
		address _ido,
		uint _duration,
		uint _maxPriceBPs,
		uint _exchangeRateDiscount,
		address _orchestrator
	) public
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
	{
		bondingcurve = IBondingCurve(_bondingcurve);
		ido = IDOInterface(_ido);
		duration = _duration;
		// solhint-disable-next-line not-rely-on-time
		startTime = now;

		maxGenesisPrice = Decimal.ratio(_maxPriceBPs, 10000);
		exchangeRateDiscount = _exchangeRateDiscount;

		orchestrator = IOrchestrator(_orchestrator);
	}

	modifier onlyGenesisPeriod() {
		require(isGenesisPeriod(), "GenesisGroup: Not in Genesis Period");
		_;
	}

	function purchase(address to, uint value) external payable onlyGenesisPeriod {
		require(msg.value == value, "GenesisGroup: value mismatch");
		require(value != 0, "GenesisGroup: no value sent");
		_mint(to, value);
		emit Purchase(to, value);
	}

	function redeem(address to) external postGenesis {
		Decimal.D256 memory ratio = fgenRatio(to);
		require(!ratio.equals(Decimal.zero()), "GensisGroup: No balance to redeem");
		burnFrom(to, balanceOf(to));
		uint feiAmount = ratio.mul(feiBalance()).asUint256();
		fei().transfer(to, feiAmount);

		uint tribeAmount = ratio.mul(tribeBalance()).asUint256();
		tribe().transfer(to, tribeAmount);
		emit Redeem(to, feiAmount, tribeAmount);
	}

	function launch() external {
		require(!isGenesisPeriod() || isAtMaxPrice(), "GenesisGroup: Still in Genesis Period");
		core().completeGenesisGroup();
		orchestrator.launchGovernance();
		IBondingCurveOracle(orchestrator.bondingCurveOracle()).init(feiEthExchangeRate());
		address genesisGroup = address(this);
		uint balance = genesisGroup.balance;
		bondingcurve.purchase{value: balance}(balance, genesisGroup);
		IPool(orchestrator.pool()).init();
		ido.deploy(exchangeRate());
		// solhint-disable-next-line not-rely-on-time
		emit Launch(now);
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
		return Decimal.ratio(feiBalance(), tribeBalance()).div(exchangeRateDiscount);
	}

	function feiEthExchangeRate() public view returns (Decimal.D256 memory) {
		(uint amountFei, ) = getAmountOut(totalSupply(), true); 
		return Decimal.ratio(amountFei, totalSupply());
	}

	function fgenRatio(address account) internal view returns (Decimal.D256 memory) {
		return Decimal.ratio(balanceOf(account), totalSupply());
	}

	function isGenesisPeriod() public view returns(bool) {
		// solhint-disable-next-line not-rely-on-time
		return now - startTime < duration;
	}

	function isAtMaxPrice() public view returns(bool) {
		uint balance = address(this).balance;
		require(balance != 0, "GenesisGroup: No balance");
		return bondingcurve.getAveragePrice(balance).greaterThanOrEqualTo(maxGenesisPrice);
	}

	function burnFrom(address account, uint256 amount) public override {
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}
}