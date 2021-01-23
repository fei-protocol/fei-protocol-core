pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IGenesisGroup.sol";
import "./IDOInterface.sol";
import "../utils/Timed.sol";
import "../refs/CoreRef.sol";
import "../pool/IPool.sol";
import "../oracle/IBondingCurveOracle.sol";
import "../bondingcurve/IBondingCurve.sol";

/// @title IGenesisGroup implementation
/// @author Fei Protocol
contract GenesisGroup is IGenesisGroup, CoreRef, ERC20, ERC20Burnable, Timed {
	using Decimal for Decimal.D256;

	IBondingCurve private bondingcurve;

	IBondingCurveOracle private bondingCurveOracle;

	IPool private pool;

	IDOInterface private ido;
	uint private exchangeRateDiscount;

	mapping(address => uint) public committedFGEN;
	uint public totalCommittedFGEN;

	uint public totalCommittedTribe;

	/// @notice a cap on the genesis group purchase price
	Decimal.D256 public maxGenesisPrice;

	/// @notice GenesisGroup constructor
	/// @param _core Fei Core address to reference
	/// @param _bondingcurve Bonding curve address for purchase
	/// @param _ido IDO contract to deploy
	/// @param _oracle Bonding curve oracle
	/// @param _pool Staking Pool
	/// @param _duration duration of the Genesis Period
	/// @param _maxPriceBPs max price of FEI allowed in Genesis Group in dollar terms
	/// @param _exchangeRateDiscount a divisor on the FEI/TRIBE ratio at Genesis to deploy to the IDO
	constructor(
		address _core, 
		address _bondingcurve,
		address _ido,
		address _oracle,
		address _pool,
		uint32 _duration,
		uint _maxPriceBPs,
		uint _exchangeRateDiscount
	) public
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
		Timed(_duration)
	{
		bondingcurve = IBondingCurve(_bondingcurve);

		exchangeRateDiscount = _exchangeRateDiscount;
		ido = IDOInterface(_ido);
		fei().approve(_ido, uint(-1));

		pool = IPool(_pool);
		bondingCurveOracle = IBondingCurveOracle(_oracle);

		_initTimed();

		maxGenesisPrice = Decimal.ratio(_maxPriceBPs, 10000);
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

	function commit(address from, address to, uint amount) external override onlyGenesisPeriod {
		burnFrom(from, amount);

		committedFGEN[to] = amount;
		totalCommittedFGEN += amount;

		emit Commit(from, to, amount);
	}

	function redeem(address to) external override {
		(uint feiAmount, uint genesisTribe, uint idoTribe) = getAmountsToRedeem(to); 

		uint tribeAmount = genesisTribe + idoTribe;

		require(tribeAmount != 0, "GenesisGroup: No redeemable TRIBE");

		uint amountIn = balanceOf(to);
		burnFrom(to, amountIn);

		uint committed = committedFGEN[to];
		committedFGEN[to] = 0;
		totalCommittedFGEN -= committed;

		totalCommittedTribe -= idoTribe;


		if (feiAmount != 0) {
			fei().transfer(to, feiAmount);
		}
		
		tribe().transfer(to, tribeAmount);

		emit Redeem(to, amountIn, feiAmount, tribeAmount);
	}

	function getAmountsToRedeem(address to) public view postGenesis returns (uint feiAmount, uint genesisTribe, uint idoTribe) {
		
		uint userFGEN = balanceOf(to);
		uint userCommittedFGEN = committedFGEN[to];

		uint circulatingFGEN = totalSupply();
		uint totalFGEN = circulatingFGEN + totalCommittedFGEN;

		// subtract purchased TRIBE amount
		uint totalGenesisTribe = tribeBalance() - totalCommittedTribe;

		if (circulatingFGEN != 0) {
			feiAmount = feiBalance() * userFGEN / circulatingFGEN;
		}

		if (totalFGEN != 0) {
			genesisTribe = totalGenesisTribe * (userFGEN + userCommittedFGEN) / totalFGEN;
		}

		if (totalCommittedFGEN != 0) {
			idoTribe = totalCommittedTribe * userCommittedFGEN / totalCommittedFGEN;
		}

		return (feiAmount, genesisTribe, idoTribe);
	}

	function launch() external override {
		require(isTimeEnded() || isAtMaxPrice(), "GenesisGroup: Still in Genesis Period");

		core().completeGenesisGroup();

		address genesisGroup = address(this);
		uint balance = genesisGroup.balance;

		bondingCurveOracle.init(bondingcurve.getAveragePrice(balance));

		bondingcurve.purchase{value: balance}(genesisGroup, balance);
		bondingcurve.allocate();

		pool.init();

		ido.deploy(_feiTribeExchangeRate());

		uint amountFei = feiBalance() * totalCommittedFGEN / (totalSupply() + totalCommittedFGEN);
		if (amountFei != 0) {
			totalCommittedTribe = ido.swapFei(amountFei);
		}

		// solhint-disable-next-line not-rely-on-time
		emit Launch(now);
	}

	// Add a backdoor out of Genesis in case of brick
	function emergencyExit(address from, address to) external {
		require(now > (startTime + duration + 3 days), "GenesisGroup: Not in exit window");

		uint amountFGEN = balanceOf(from);
		uint total = amountFGEN + committedFGEN[from];

		require(total != 0, "GenesisGroup: No FGEN or committed balance");
		require(address(this).balance >= total, "GenesisGroup: Not enough ETH to redeem");
		require(msg.sender == from || allowance(from, msg.sender) >= total, "GenesisGroup: Not approved for emergency withdrawal");

		burnFrom(from, amountFGEN);
		committedFGEN[from] = 0;

		payable(to).transfer(total);
	}

	function getAmountOut(
		uint amountIn, 
		bool inclusive
	) public view override returns (uint feiAmount, uint tribeAmount) {
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
		// Sender doesn't need approval
		if (msg.sender == account) {
			increaseAllowance(account, amount);
		}
		super.burnFrom(account, amount);
	}

	function _feiTribeExchangeRate() public view returns (Decimal.D256 memory) {
		return Decimal.ratio(feiBalance(), tribeBalance()).div(exchangeRateDiscount);
	}
}