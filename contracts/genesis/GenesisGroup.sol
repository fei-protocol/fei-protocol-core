pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IGenesisGroup.sol";
import "./IDOInterface.sol";
import "../utils/Timed.sol";
import "../refs/CoreRef.sol";
import "../oracle/IBondingCurveOracle.sol";
import "../bondingcurve/IBondingCurve.sol";

/// @title Equal access to the first bonding curve transaction and the IDO
/// @author Fei Protocol
contract GenesisGroup is IGenesisGroup, CoreRef, ERC20, Timed {
    using Decimal for Decimal.D256;

    IBondingCurve private bondingcurve;

    IBondingCurveOracle private bondingCurveOracle;

    IDOInterface private ido;
    uint256 private exchangeRateDiscount;

    /// @notice amount of FGEN pre-committed and burned per account
    mapping(address => uint256) public override committedFGEN;

    /// @notice total amount of FGEN pre-committed and burned
    uint256 public override totalCommittedFGEN;

    /// @notice total amount of TRIBE coming from the IDO and pre-committed FGEN
    /// @dev is 0 pre-launch
    uint256 public override totalCommittedTribe;
    
    /// @notice the block number of the genesis launch
    uint256 public override launchBlock;

    /// @notice GenesisGroup constructor
    /// @param _core Fei Core address to reference
    /// @param _bondingcurve Bonding curve address for purchase
    /// @param _ido IDO contract to deploy
    /// @param _oracle Bonding curve oracle
    /// @param _duration duration of the Genesis Period
    /// @param _exchangeRateDiscount a divisor on the FEI/TRIBE ratio at Genesis to deploy to the IDO
    constructor(
        address _core,
        address _bondingcurve,
        address _ido,
        address _oracle,
        uint256 _duration,
        uint256 _exchangeRateDiscount
    )
        public
        CoreRef(_core)
        ERC20("Fei Genesis Group", "FGEN")
        Timed(_duration)
    {
        bondingcurve = IBondingCurve(_bondingcurve);

        exchangeRateDiscount = _exchangeRateDiscount;
        ido = IDOInterface(_ido);

        uint256 maxTokens = uint256(-1);
        fei().approve(_ido, maxTokens);

        bondingCurveOracle = IBondingCurveOracle(_oracle);
    }

    function initGenesis() external override onlyGovernor {
        _initTimed();
    }

    /// @notice allows for entry into the Genesis Group via ETH. Only callable during Genesis Period.
    /// @param to address to send FGEN Genesis tokens to
    /// @param value amount of ETH to deposit
    function purchase(address to, uint256 value)
        external
        payable
        override
        duringTime
    {
        require(msg.value == value, "GenesisGroup: value mismatch");
        require(value != 0, "GenesisGroup: no value sent");

        _mint(to, value);

        emit Purchase(to, value);
    }

    /// @notice commit Genesis FEI to purchase TRIBE in DEX offering
    /// @param from address to source FGEN Genesis shares from
    /// @param to address to earn TRIBE and redeem post launch
    /// @param amount of FGEN Genesis shares to commit
    function commit(
        address from,
        address to,
        uint256 amount
    ) external override duringTime {
        _burnFrom(from, amount);

        committedFGEN[to] = committedFGEN[to].add(amount);
        totalCommittedFGEN = totalCommittedFGEN.add(amount);

        emit Commit(from, to, amount);
    }

    /// @notice redeem FGEN genesis tokens for FEI and TRIBE. Only callable post launch
    /// @param to address to send redeemed FEI and TRIBE to.
    function redeem(address to) external override {
        (uint256 feiAmount, uint256 genesisTribe, uint256 idoTribe) =
            getAmountsToRedeem(to);
        require(
            block.number > launchBlock,
            "GenesisGroup: No redeeming in launch block"
        );

        // Total tribe to redeem
        uint256 tribeAmount = genesisTribe.add(idoTribe);
        require(tribeAmount != 0, "GenesisGroup: No redeemable TRIBE");

        // Burn FGEN
        uint256 amountIn = balanceOf(to);
        _burnFrom(to, amountIn);

        // Reset committed
        uint256 committed = committedFGEN[to];
        committedFGEN[to] = 0;
        totalCommittedFGEN = totalCommittedFGEN.sub(committed);

        totalCommittedTribe = totalCommittedTribe.sub(idoTribe);

        // send FEI and TRIBE
        if (feiAmount != 0) {
            fei().transfer(to, feiAmount);
        }
        tribe().transfer(to, tribeAmount);

        emit Redeem(to, amountIn, feiAmount, tribeAmount);
    }

    /// @notice launch Fei Protocol. Callable once Genesis Period has ended
    function launch() external override nonContract afterTime {

        // Complete Genesis
        core().completeGenesisGroup();
        launchBlock = block.number;

        address genesisGroup = address(this);
        uint256 balance = genesisGroup.balance;

        // Initialize bonding curve oracle
        bondingCurveOracle.init(bondingcurve.getAverageUSDPrice(balance));

        // bonding curve purchase and PCV allocation
        bondingcurve.purchase{value: balance}(genesisGroup, balance);
        bondingcurve.allocate();

        ido.deploy(_feiTribeExchangeRate());

        // swap pre-committed FEI on IDO and store TRIBE
        uint256 amountFei =
            feiBalance().mul(totalCommittedFGEN) /
                (totalSupply().add(totalCommittedFGEN));
        if (amountFei != 0) {
            totalCommittedTribe = ido.swapFei(amountFei);
        }

        // solhint-disable-next-line not-rely-on-time
        emit Launch(block.timestamp);
    }

    // Add a backdoor out of Genesis in case of brick
    function emergencyExit(address from, address payable to) external override {
        require(
            // solhint-disable-next-line not-rely-on-time
            block.timestamp > (startTime + duration + 3 days),
            "GenesisGroup: Not in exit window"
        );
        require(
            !core().hasGenesisGroupCompleted(),
            "GenesisGroup: Launch already happened"
        );

        uint256 heldFGEN = balanceOf(from);
        uint256 committed = committedFGEN[from];
        uint256 total = heldFGEN.add(committed);

        require(total != 0, "GenesisGroup: No FGEN or committed balance");
        require(
            msg.sender == from || allowance(from, msg.sender) >= total,
            "GenesisGroup: Not approved for emergency withdrawal"
        );
        assert(address(this).balance >= total); // ETH can only be removed by launch which blocks this method or this method in event of launch failure

        _burnFrom(from, heldFGEN);
        committedFGEN[from] = 0;
        totalCommittedFGEN = totalCommittedFGEN.sub(committed);

        to.transfer(total);
    }

    /// @notice calculate amount of FEI and TRIBE redeemable by an account post-genesis
    /// @return feiAmount the amount of FEI received by the user
    /// @return genesisTribe the amount of TRIBE received by the user per GenesisGroup
    /// @return idoTribe the amount of TRIBE received by the user per pre-committed FEI trading in the IDO
    /// @dev this function is only callable post launch
    function getAmountsToRedeem(address to)
        public
        view
        override
        postGenesis
        returns (
            uint256 feiAmount,
            uint256 genesisTribe,
            uint256 idoTribe
        )
    {
        uint256 userFGEN = balanceOf(to);
        uint256 userCommittedFGEN = committedFGEN[to];

        uint256 circulatingFGEN = totalSupply();
        uint256 totalFGEN = circulatingFGEN.add(totalCommittedFGEN);

        // subtract IDO purchased TRIBE amount
        uint256 totalGenesisTribe = tribeBalance().sub(totalCommittedTribe);

        if (circulatingFGEN != 0) {
            // portion of remaining uncommitted FEI
            feiAmount = feiBalance().mul(userFGEN) / circulatingFGEN;
        }

        if (totalFGEN != 0) {
            // portion including both committed and uncommitted FGEN
            genesisTribe =
                totalGenesisTribe.mul(userFGEN.add(userCommittedFGEN)) /
                totalFGEN;
        }

        if (totalCommittedFGEN != 0) {
            // portion including only committed FGEN of IDO TRIBE
            idoTribe =
                totalCommittedTribe.mul(userCommittedFGEN) /
                totalCommittedFGEN;
        }

        return (feiAmount, genesisTribe, idoTribe);
    }

    /// @notice calculate amount of FEI and TRIBE received if the Genesis Group ended now.
    /// @param amountIn amount of FGEN held or equivalently amount of ETH purchasing with
    /// @param inclusive if true, assumes the `amountIn` is part of the existing FGEN supply. Set to false to simulate a new purchase.
    /// @return feiAmount the amount of FEI received by the user
    /// @return tribeAmount the amount of TRIBE received by the user
    function getAmountOut(uint256 amountIn, bool inclusive)
        public
        view
        override
        returns (uint256 feiAmount, uint256 tribeAmount)
    {
        uint256 totalIn = totalSupply().add(totalCommittedFGEN);
        if (!inclusive) {
            // exclusive from current supply, so we add it in
            totalIn = totalIn.add(amountIn);
        }
        require(amountIn <= totalIn, "GenesisGroup: Not enough supply");

        uint256 totalFei = bondingcurve.getAmountOut(totalIn);
        uint256 totalTribe = tribeBalance();

        // return portions of total FEI and TRIBE
        return (
            totalFei.mul(amountIn) / totalIn,
            totalTribe.mul(amountIn) / totalIn
        );
    }

    function _burnFrom(address account, uint256 amount) internal {
        if (msg.sender != account) {
            uint256 decreasedAllowance =
                allowance(account, _msgSender()).sub(
                    amount,
                    "GenesisGroup: burn amount exceeds allowance"
                );
            _approve(account, _msgSender(), decreasedAllowance);
        }
        _burn(account, amount);
    }

    function _feiTribeExchangeRate()
        internal
        view
        returns (Decimal.D256 memory)
    {
        return
            Decimal.ratio(feiBalance(), tribeBalance()).div(
                exchangeRateDiscount
            );
    }
}
