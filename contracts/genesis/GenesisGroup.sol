pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IDOInterface.sol";
import "./IGenesisGroup.sol";
import "../bondingcurve/IBondingCurve.sol";
import "../refs/CoreRef.sol";
import "../pool/IPool.sol";
import "../oracle/IBondingCurveOracle.sol";
import "../utils/Timed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

interface IOrchestrator {
	function launchGovernance() external;
	function pool() external returns(address);
	function bondingCurveOracle() external returns(address);
}

/// @title IGenesisGroup implementation
/// @author Fei Protocol
contract GenesisGroup is CoreRef, ERC20, ERC20Burnable, Timed, IGenesisGroup {
	using Decimal for Decimal.D256;

	IOrchestrator private orchestrator;
	IBondingCurve private bondingcurve;
	IDOInterface private ido;

	uint private exchangeRateDiscount;

	/// @notice a cap on the genesis group purchase price
	Decimal.D256 public maxGenesisPrice;

	event Purchase(address indexed _to, uint _value);
	event Redeem(address indexed _to, uint _amountFei, uint _amountTribe);
	event Launch(uint timestamp);

	constructor(
		address _core, 
		address _bondingcurve,
		address _ido,
		uint32 _duration,
		uint _maxPriceBPs,
		uint _exchangeRateDiscount,
		address _orchestrator
	) public
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
		Timed(_duration)
	{
		bondingcurve = IBondingCurve(_bondingcurve);
		ido = IDOInterface(_ido);
		_initTimed();

		maxGenesisPrice = Decimal.ratio(_maxPriceBPs, 10000);
		exchangeRateDiscount = _exchangeRateDiscount;

		orchestrator = IOrchestrator(_orchestrator);
	}

	modifier onlyGenesisPeriod() {
		require(!isTimeEnded(), "GenesisGroup: Not in Genesis Period");
		_;
	}

	function purchase(address to, uint value) external override payable onlyGenesisPeriod {
		require(msg.value == value, "GenesisGroup: value mismatch");
		require(value != 0, "GenesisGroup: no value sent");
		_mint(to, value);
		emit Purchase(to, value);
	}

	function redeem(address to) external override postGenesis {
		Decimal.D256 memory ratio = _fgenRatio(to);
		require(!ratio.equals(Decimal.zero()), "GensisGroup: No balance to redeem");
		burnFrom(to, balanceOf(to));
		uint feiAmount = ratio.mul(feiBalance()).asUint256();
		fei().transfer(to, feiAmount);

		uint tribeAmount = ratio.mul(tribeBalance()).asUint256();
		tribe().transfer(to, tribeAmount);
		emit Redeem(to, feiAmount, tribeAmount);
	}

	function launch() external override {
		require(isTimeEnded() || isAtMaxPrice(), "GenesisGroup: Still in Genesis Period");
		core().completeGenesisGroup();
		orchestrator.launchGovernance();
		IBondingCurveOracle(orchestrator.bondingCurveOracle()).init(_feiEthExchangeRate());
		address genesisGroup = address(this);
		uint balance = genesisGroup.balance;
		bondingcurve.purchase{value: balance}(genesisGroup, balance);
		IPool(orchestrator.pool()).init();
		ido.deploy(_feiTribeExchangeRate());
		// solhint-disable-next-line not-rely-on-time
		emit Launch(now);
	}

	function getAmountOut(
		uint amountIn, 
		bool inclusive
	) public view override returns (uint feiAmount, uint tribeAmount) {
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

	function isAtMaxPrice() public view override returns(bool) {
		uint balance = address(this).balance;
		require(balance != 0, "GenesisGroup: No balance");
		return bondingcurve.getAveragePrice(balance).greaterThanOrEqualTo(maxGenesisPrice);
	}

	function burnFrom(address account, uint amount) public override {
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}

	function _fgenRatio(address account) internal view returns (Decimal.D256 memory) {
		return Decimal.ratio(balanceOf(account), totalSupply());
	}

	function _feiTribeExchangeRate() internal view returns (Decimal.D256 memory) {
		return Decimal.ratio(feiBalance(), tribeBalance()).div(exchangeRateDiscount);
	}

	function _feiEthExchangeRate() internal view returns (Decimal.D256 memory) {
		(uint amountFei, ) = getAmountOut(totalSupply(), true); 
		return Decimal.ratio(amountFei, totalSupply());
	}
}