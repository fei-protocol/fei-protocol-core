pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

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
contract GenesisGroup is IGenesisGroup, CoreRef, ERC20, Timed {
	using Decimal for Decimal.D256;

	IBondingCurve private bondingcurve;

	IBondingCurveOracle private bondingCurveOracle;

	IPool private pool;

	IDOInterface private ido;
	uint private exchangeRateDiscount;

	mapping(address => uint) public committedFGEN;
	uint public totalCommittedFGEN;

	uint public totalCommittedTribe;

	uint public constant ORACLE_LISTING_PERCENT = 90;
	uint public launchBlock;

	/// @notice GenesisGroup constructor
	/// @param _core Fei Core address to reference
	/// @param _bondingcurve Bonding curve address for purchase
	/// @param _ido IDO contract to deploy
	/// @param _oracle Bonding curve oracle
	/// @param _pool Staking Pool
	/// @param _duration duration of the Genesis Period
	/// @param _exchangeRateDiscount a divisor on the FEI/TRIBE ratio at Genesis to deploy to the IDO
	constructor(
		address _core, 
		address _bondingcurve,
		address _ido,
		address _oracle,
		address _pool,
		uint _duration,
		uint _exchangeRateDiscount
	) public
		CoreRef(_core)
		ERC20("Fei Genesis Group", "FGEN")
		Timed(_duration)
	{
		bondingcurve = IBondingCurve(_bondingcurve);

		exchangeRateDiscount = _exchangeRateDiscount;
		ido = IDOInterface(_ido);

		uint maxTokens = uint(-1);
		fei().approve(_ido, maxTokens);

		pool = IPool(_pool);
		bondingCurveOracle = IBondingCurveOracle(_oracle);

		_initTimed();
	}

	modifier onlyGenesisPeriod() {
		require(!isTimeEnded() && !core().hasGenesisGroupCompleted(), "GenesisGroup: Not in Genesis Period");
		_;
	}

	function purchase(address to, uint value) external override payable onlyGenesisPeriod {
		require(msg.value == value, "GenesisGroup: value mismatch");
		require(value != 0, "GenesisGroup: no value sent");

		_mint(to, value);

		emit Purchase(to, value);
	}

	function commit(address from, address to, uint amount) external override onlyGenesisPeriod {
		_burnFrom(from, amount);

		committedFGEN[to] = committedFGEN[to].add(amount);
		totalCommittedFGEN = totalCommittedFGEN.add(amount);

		emit Commit(from, to, amount);
	}

	function redeem(address to) external override {
		(uint feiAmount, uint genesisTribe, uint idoTribe) = getAmountsToRedeem(to); 
		require(block.number > launchBlock, "GenesisGroup: No redeeming in launch block");

		uint tribeAmount = genesisTribe.add(idoTribe);

		require(tribeAmount != 0, "GenesisGroup: No redeemable TRIBE");

		uint amountIn = balanceOf(to);
		_burnFrom(to, amountIn);

		uint committed = committedFGEN[to];
		committedFGEN[to] = 0;
		totalCommittedFGEN = totalCommittedFGEN.sub(committed);

		totalCommittedTribe = totalCommittedTribe.sub(idoTribe);


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
		uint totalFGEN = circulatingFGEN.add(totalCommittedFGEN);

		// subtract purchased TRIBE amount
		uint totalGenesisTribe = tribeBalance().sub(totalCommittedTribe);

		if (circulatingFGEN != 0) {
			feiAmount = feiBalance().mul(userFGEN) / circulatingFGEN;
		}

		if (totalFGEN != 0) {
			genesisTribe = totalGenesisTribe.mul(userFGEN.add(userCommittedFGEN)) / totalFGEN;
		}

		if (totalCommittedFGEN != 0) {
			idoTribe = totalCommittedTribe.mul(userCommittedFGEN) / totalCommittedFGEN;
		}

		return (feiAmount, genesisTribe, idoTribe);
	}

	function launch() external override {
		require(isTimeEnded(), "GenesisGroup: Still in Genesis Period");

		core().completeGenesisGroup();
		launchBlock = block.number;

		address genesisGroup = address(this);
		uint balance = genesisGroup.balance;

		Decimal.D256 memory oraclePrice = bondingcurve.getAveragePrice(balance).mul(ORACLE_LISTING_PERCENT).div(100);
		bondingCurveOracle.init(oraclePrice);

		bondingcurve.purchase{value: balance}(genesisGroup, balance);
		bondingcurve.allocate();

		pool.init();

		ido.deploy(_feiTribeExchangeRate());

		uint amountFei = feiBalance().mul(totalCommittedFGEN) / (totalSupply().add(totalCommittedFGEN));
		if (amountFei != 0) {
			totalCommittedTribe = ido.swapFei(amountFei);
		}

		// solhint-disable-next-line not-rely-on-time
		emit Launch(block.timestamp);
	}

	// Add a backdoor out of Genesis in case of brick
	function emergencyExit(address from, address payable to) external {
		require(block.timestamp > (startTime + duration + 3 days), "GenesisGroup: Not in exit window");
		require(!core().hasGenesisGroupCompleted(), "GenesisGroup: Launch already happened");

		uint heldFGEN = balanceOf(from);
		uint committed = committedFGEN[from];
		uint total = heldFGEN.add(committed);

		require(total != 0, "GenesisGroup: No FGEN or committed balance");
		require(address(this).balance >= total, "GenesisGroup: Not enough ETH to redeem");
		require(msg.sender == from || allowance(from, msg.sender) >= total, "GenesisGroup: Not approved for emergency withdrawal");

		_burnFrom(from, heldFGEN);
		committedFGEN[from] = 0;
		totalCommittedFGEN = totalCommittedFGEN.sub(committed);

		to.transfer(total);
	}

	function getAmountOut(
		uint amountIn, 
		bool inclusive
	) public view override returns (uint feiAmount, uint tribeAmount) {
		uint totalIn = totalSupply();
		if (!inclusive) {
			totalIn = totalIn.add(amountIn);
		}
		require(amountIn <= totalIn, "GenesisGroup: Not enough supply");

		uint totalFei = bondingcurve.getAmountOut(totalIn);
		uint totalTribe = tribeBalance();

		return (totalFei.mul(amountIn) / totalIn, totalTribe.mul(amountIn) / totalIn);
	}


	function _burnFrom(address account, uint amount) internal {
		if (msg.sender != account) {
			uint256 decreasedAllowance = allowance(account, _msgSender()).sub(amount, "GenesisGroup: burn amount exceeds allowance");
			_approve(account, _msgSender(), decreasedAllowance);
		}
        _burn(account, amount);
	}

	function _feiTribeExchangeRate() public view returns (Decimal.D256 memory) {
		return Decimal.ratio(feiBalance(), tribeBalance()).div(exchangeRateDiscount);
	}
}