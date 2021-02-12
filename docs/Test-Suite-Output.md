Note there are a few flakey tests that depend on time but the `testAll` npm command includes retries which should be sufficient for 100% passing
```
> npm run testAll

EthBondingCurve
    Purchase
      Average Price
        ✓ is accurate (97ms)
      Incorrect ETH sent
        ✓ Too little ETH (100ms)
        ✓ Too much ETH (67ms)
      Correct ETH sent
        Invalid Oracle
          ✓ reverts (140ms)
        Pre Scale
          ✓ Correct FEI sent
          ✓ Updates total purchased
          ✓ stays pre-scale
          ✓ Second purchase moves along curve (185ms)
          ✓ Changes in oracle price (232ms)
          ✓ Correct current price (48ms)
        Crossing Scale
          ✓ registers scale cross (100ms)
          ✓ Correct current price (72ms)
        Post Scale
          ✓ Correct FEI sent
          ✓ Updates total supply (59ms)
          ✓ stays post-scale (94ms)
          ✓ Changes in buffer (541ms)
          ✓ Changes in oracle price (509ms)
          ✓ Correct current price (137ms)
    PCV Splitter
      ✓ Mismatched lengths revert (119ms)
      ✓ Incomplete allocation rule reverts (206ms)
      ✓ Correct allocation rule succeeds (160ms)
      With Purchase
        And Allocation
          ✓ splits funds accurately (264ms)
          ✓ incentivizes (63ms)
          Second Allocation
            ✓ no pcv reverts (135ms)
            ✓ with pcv before period has no incentives (413ms)
            ✓ with pcv after period has incentives (449ms)
        Updated Allocation
          ✓ splits funds accurately (102ms)
          ✓ incentivizes (99ms)
    Access
      Oracle
        ✓ Governor set succeeds (105ms)
        ✓ Non-governor set reverts (121ms)
      Scale
        ✓ Governor set succeeds (142ms)
        ✓ Non-governor set reverts (60ms)
      Buffer
        ✓ Governor set succeeds (121ms)
        ✓ Governor set outside range reverts (90ms)
        ✓ Non-governor set reverts (155ms)
      PCV Splitter
        ✓ Governor set succeeds (224ms)
        ✓ Non-governor set reverts (92ms)
      Core
        ✓ Governor set succeeds (244ms)
        ✓ Non-governor set reverts (78ms)

  Core
    Allocation
      ✓ updates (164ms)
      ✓ not enough reverts (131ms)
    Fei Update
      ✓ updates (140ms)
    Genesis
      Genesis Group
        ✓ governor set succeeds (134ms)
        ✓ non-governor set reverts (66ms)
      Modifiers
        Pre Genesis Completion
          ✓ postGenesis reverts (52ms)
          ✓ non genesis group complete fails (132ms)
        Post Genesis Completion
          ✓ postGenesis succeeds (61ms)
          ✓ second complete reverts (105ms)
    Minter
      Role
        Has access
          ✓ is registered in core (40ms)
        Access revoked
          ✓ is not registered in core (94ms)
        Access renounced
          ✓ is not registered in core (61ms)
        Member Count
          ✓ is one (69ms)
          ✓ updates to two (118ms)
        Admin
          ✓ is governor
      Access
        ✓ onlyMinter succeeds
        ✓ onlyBurner reverts
        ✓ onlyGovernor reverts
        ✓ onlyPCVController reverts
    Burner
      Role
        Has access
          ✓ is registered in core (45ms)
        Access revoked
          ✓ is not registered in core (81ms)
        Access renounced
          ✓ is not registered in core (79ms)
        Member Count
          ✓ is one
          ✓ updates to two (103ms)
        Admin
          ✓ is governor (50ms)
      Access
        ✓ onlyMinter reverts
        ✓ onlyBurner succeeds
        ✓ onlyGovernor reverts (53ms)
        ✓ onlyPCVController reverts (62ms)
    PCV Controller
      Role
        Has access
          ✓ is registered in core (40ms)
        Access revoked
          ✓ is not registered in core
        Access renounced
          ✓ is not registered in core
        Member Count
          ✓ is one
          ✓ updates to two (140ms)
        Admin
          ✓ is governor (49ms)
      Access
        ✓ onlyMinter reverts (69ms)
        ✓ onlyBurner reverts (62ms)
        ✓ onlyGovernor reverts
        ✓ onlyPCVController succeeds (66ms)
    Governor
      Role
        Has access
          ✓ is registered in core
        Access revoked
          ✓ is not registered in core (55ms)
        Access renounced
          ✓ is not registered in core
        Member Count
          ✓ is one (61ms)
          ✓ updates to two (155ms)
        Admin
          ✓ is governor
      Access
        ✓ onlyMinter reverts
        ✓ onlyBurner reverts (43ms)
        ✓ onlyGovernor succeeds (66ms)
        ✓ onlyPCVController reverts
      Access Control
        Minter
          ✓ can grant (99ms)
          ✓ can revoke (81ms)
        Burner
          ✓ can grant (129ms)
          ✓ can revoke (161ms)
        PCV Controller
          ✓ can grant (137ms)
          ✓ can revoke (90ms)
        Governor
          ✓ can grant (68ms)
          ✓ can revoke (143ms)
    Revoker
      Role
        Has access
          ✓ is registered in core (59ms)
        Access revoked
          ✓ is not registered in core (49ms)
        Access renounced
          ✓ is not registered in core (102ms)
        Member Count
          ✓ is one (47ms)
          ✓ updates to two (174ms)
        Admin
          ✓ is governor
      Access
        ✓ onlyMinter reverts
        ✓ onlyBurner reverts (43ms)
        ✓ onlyGovernor reverts (72ms)
        ✓ onlyPCVController reverts (55ms)
      Access Control
        Non-Revoker
          ✓ cannot revoke (66ms)
        Revoker
          ✓ can revoke minter (142ms)
          ✓ can revoke burner (110ms)
          ✓ can revoke pcv controller (185ms)
          ✓ can revoke governor (113ms)
    Create Role
      ✓ governor succeeds (121ms)
      ✓ non-governor fails (56ms)

  TimelockedDelegator
    Timelocks
      Immediate
        ✓ reverts (92ms)
      One Quarter
        ✓ releases tokens (90ms)
        ✓ updates released amounts (97ms)
        Another Quarter
          ✓ releases tokens (82ms)
          ✓ updates released amounts (87ms)
      Total Window
        ✓ releases tokens (99ms)
        ✓ updates released amounts (157ms)
    Delegation
      Not enough Tribe
        ✓ reverts (83ms)
      Enough Tribe
        Single Delegation
          ✓ updates balances (167ms)
          ✓ updates delegated amount (97ms)
          ✓ maintains total token (99ms)
        Double Delegation
          ✓ updates balances (170ms)
          ✓ updates delegated amount (58ms)
          ✓ maintains total token (80ms)
          ✓ original delegatee is deleted
        Undelegation
          ✓ updates balances (169ms)
          ✓ updates delegated amount (98ms)
          ✓ maintains total token (85ms)
          ✓ delegatee is deleted
          Double Undelegation
            ✓ reverts (178ms)
    Token Drop
      ✓ updates total token (44ms)
    Access
      Delegate
        ✓ Non-beneficiary set reverts (139ms)
      Undelegate
        ✓ Non-beneficiary set reverts (129ms)
      Set Pending Beneficiary
        ✓ Beneficiary set succeeds (107ms)
        ✓ Non-beneficiary set reverts (132ms)
      Accept Beneficiary
        ✓ Pending Beneficiary succeeds (161ms)
        ✓ Non pending beneficiary reverts (109ms)
      Release
        ✓ Non-beneficiary set reverts (140ms)

  GenesisGroup
    During Genesis Period
      ✓ is during (128ms)
      Purchase
        No value
          ✓ reverts (279ms)
        Wrong value
          ✓ reverts (161ms)
        With value
          ✓ Updates balances (166ms)
          Second Purchase
            ✓ Updates balances (118ms)
      Get Amount Out
        Inclusive
          No existing
            ✓ reverts (127ms)
          Existing
            ✓ succeeds (111ms)
        Exclusive
          No existing
            ✓ succeeds (89ms)
          Existing
            ✓ succeeds (76ms)
      Launch
        Below max price
          ✓ reverts (130ms)
        Above max price
          ✓ purchases on bondingCurve (59ms)
          ✓ allocates bonding curve (118ms)
          ✓ deploys IDO (147ms)
          ✓ inits Bonding Curve Oracle (110ms)
      Redeem
        ✓ reverts (150ms)
    Pre-Commit
      Single Commit
        Self commit
          ✓ succeeds (115ms)
        Commit other
          ✓ succeeds (170ms)
        Approved commit
          ✓ succeeds (240ms)
        Unapproved commit
          ✓ reverts (98ms)
      Double Commit
        ✓ succeeds (266ms)
        Redeem
          ✓ partial (361ms)
          ✓ total (363ms)
    Post Genesis Period
      ✓ is post (45ms)
      Purchase
        ✓ reverts (71ms)
      Pre-Commit
        ✓ reverts (81ms)
      Exit
        Before window
          ✓ reverts (114ms)
        After window
          Self exit
            ✓ succeeds (184ms)
          Exit other
            ✓ succeeds (174ms)
          Approved exit
            ✓ succeeds (256ms)
          Unapproved exit
            ✓ reverts (80ms)
          Second exit
            ✓ reverts (191ms)
      Launch
        ✓ purchases on bondingCurve (88ms)
        ✓ allocates bonding curve (124ms)
        ✓ deploys IDO (67ms)
        ✓ second launch reverts (144ms)
        ✓ inits Bonding Curve Oracle (114ms)
        ✓ emergencyExit fails (172ms)
      Redeem
        External Redeem
          Approved
            ✓ updates balances (681ms)
          Not Approved
            ✓ reverts (202ms)
        Single Redeem
          ✓ updates balances (522ms)
          ✓ Second redeem reverts (163ms)
        Both Redeem
          ✓ updates balances (658ms)
          ✓ nothing left to redeem (137ms)
        Second Redeem
          ✓ reverts (204ms)

  IDO
    Swap
      Not Genesis Group
        ✓ reverts (112ms)
      From Genesis Group
        Not approved
          ✓ reverts (167ms)
        Approved
          ✓ genesis group balances (59ms)
          ✓ updates pair balances (116ms)
    Bad Duration
      ✓ reverts (190ms)
    Deploy
      Not Genesis Group
        ✓ reverts (96ms)
      From Genesis Group
        ✓ updates ido balances (196ms)
        ✓ updates pair balances (192ms)
        ✓ updates total token (123ms)
        After window
          ✓ all available for release (78ms)
      Beneficiary
        ✓ change succeeds (233ms)
        ✓ unauthorized set fails (123ms)
        ✓ unauthorized accept fails (214ms)

  BondingCurveOracle
    Update
      ✓ updates uniswap oracle (202ms)
    Read
      Uninitialized
        ✓ returns invalid (65ms)
      Initialized
        Kill switch
          ✓ returns invalid (98ms)
        Beginning of Thawing Period
          Pre Scale
            ✓ returns bonding curve oracle info (80ms)
          At Scale
            ✓ returns uniswap oracle info (61ms)
        Halfway through Thawing Period
          Pre Scale
            ✓ returns bonding curve oracle info (98ms)
          At Scale
            ✓ returns uniswap oracle info (148ms)
        End of Thawing Period
          Pre Scale
            ✓ returns bonding curve oracle info (51ms)
          At Scale
            ✓ returns uniswap oracle info (90ms)
    Access
      Kill Switch
        ✓ Governor set succeeds (72ms)
        ✓ Non-governor set reverts (104ms)

  UniswapOracle
    ✓ initializes (153ms)
    Read
      Uninitialized
        ✓ returns invalid (82ms)
      Initialized
        Kill switch
          ✓ returns invalid (58ms)
        No kill switch
          ✓ returns valid (82ms)
    Update
      Within duration
        ✓ no change (130ms)
      Exceeds duration
        ✓ updates (459ms)
      Price Moves
        Upward
          ✓ updates (136ms)
        Downward
          ✓ updates (213ms)
    Access
      Kill Switch
        ✓ Governor set succeeds (151ms)
        ✓ Non-governor set reverts (114ms)
      Duration
        ✓ Governor set succeeds (144ms)
        ✓ Non-governor set reverts (79ms)

  EthUniswapPCVController
    Sole LP
      ✓ pcvDeposit gets all ETH (109ms)
      ✓ controller has no FEI (57ms)
    With Other LP
      At peg
        ✓ reverts (265ms)
      Above peg
        ✓ reverts (186ms)
      Below peg
        Enough to reweight
          ✓ pair gets some ETH in swap (197ms)
          ✓ pcvDeposit gets remaining ETH (206ms)
          ✓ controller has no FEI (309ms)
        Not enough to reweight
          ✓ pair gets all ETH in swap (271ms)
          ✓ pcvDeposit gets no ETH (270ms)
          ✓ controller has no FEI (146ms)
    External Reweight
      Not at incentive parity
        ✓ reverts (389ms)
      Not at min distance
        ✓ reverts (470ms)
      No incentive for caller if controller not minter
        ✓ pair gets some ETH in swap (165ms)
        ✓ pcvDeposit gets remaining ETH (209ms)
        ✓ user FEI balance is 0 (167ms)
      Incentive for caller if controller is a minter
        ✓ pair gets some ETH in swap (201ms)
        ✓ pcvDeposit gets remaining ETH (314ms)
        ✓ user FEI balance updates (225ms)
    Access
      Force Reweight
        ✓ Non-governor call fails (172ms)
      Reweight Incentive
        ✓ Governor set succeeds (174ms)
        ✓ Non-governor set reverts (125ms)
      Reweight Min Distance
        ✓ Governor set succeeds (192ms)
        ✓ Non-governor set reverts (118ms)
      Pair
        ✓ Governor set succeeds (450ms)
        ✓ Non-governor set reverts (117ms)
      PCV Deposit
        ✓ Governor set succeeds (220ms)
        ✓ Non-governor set reverts (153ms)
      Oracle
        ✓ Governor set succeeds (181ms)
        ✓ Non-governor set reverts (165ms)

  EthUniswapPCVDeposit
    Deposit
      No prior LP
        ✓ deposits at oracle price (381ms)
      Pre deposit values
        ✓ liquidityOwned (74ms)
        ✓ pair reserves (146ms)
        ✓ totalValue (91ms)
      Post deposit values
        No existing liquidity
          ✓ liquidityOwned (144ms)
          ✓ pair reserves (244ms)
          ✓ totalValue (274ms)
          ✓ no fei held (101ms)
        With existing liquidity
          ✓ liquidityOwned (151ms)
          ✓ pair reserves (238ms)
          ✓ totalValue (150ms)
          ✓ no fei held (210ms)
        After price move
          ✓ liquidityOwned (202ms)
          ✓ pair reserves (348ms)
          ✓ totalValue (145ms)
          ✓ no fei held (161ms)
        Incorrect ETH amount
          ✓ reverts (159ms)
    Withdraw
      Reverts
        ✓ not pcv controller (140ms)
        ✓ no balance (183ms)
      With Balance
        Partial
          ✓ user balance updates (82ms)
          ✓ no fei held (167ms)
          ✓ pair balances update (283ms)
          ✓ liquidityOwned (237ms)
        Total
          ✓ user balance updates (49ms)
          ✓ no fei held (150ms)
          ✓ liquidityOwned (172ms)
          ✓ pair balances update (260ms)
    Access
      Pair
        ✓ Governor set succeeds (261ms)
        ✓ Non-governor set reverts (129ms)

  Pool
    Governor Withdraw
      ✓ non-governor reverts (249ms)
      ✓ governor succeeds (383ms)
    Before Init
      ✓ deposit reverts (229ms)
      ✓ init reverts (305ms)
    Initialized
      ✓ cant init again (127ms)
      Immediately
        ✓ none released (282ms)
        Deposit To
          ✓ updates balances (424ms)
        With Deposit
          ✓ too much deposit reverts (174ms)
          ✓ updates balances (177ms)
          Halfway
            ✓ some released (160ms)
            Another Deposit
              ✓ updates balances (333ms)
              Complete
                ✓ remainder released (195ms)
                Withdraw
                  ✓ updates balances (887ms)
              Withdraw
                ✓ has event
                ✓ updates balances (505ms)
                Complete
                  ✓ remainder released (190ms)
                  Withdraw
                    ✓ updates balances (371ms)
              Withdraw To
                ✓ has event
                ✓ updates balances (706ms)
              Claim
                ✓ has event
                ✓ updates balances (811ms)
                Complete
                  ✓ remainder released (163ms)
                  Withdraw
                    ✓ updates balances (541ms)
              External Claim
                Claim For
                  Approved
                    ✓ has event
                    ✓ updates balances (490ms)
                  Not Approved
                    ✓ reverts (138ms)
                Claim To
                  Approved
                    ✓ has event
                    ✓ second claim reverts (102ms)
                    ✓ updates balances (449ms)
                  Not Approved
                    ✓ reverts (195ms)
            Transfer
              ✓ updates balances (664ms)
              Complete
                ✓ remainder released (248ms)
                Withdraw
                  ✓ updates balances (568ms)
        No Deposit
          Halfway
            ✓ some released (182ms)
            With Deposit
              ✓ updates balances (128ms)
              Complete
                ✓ remainder released (71ms)
                Withdraw
                  ✓ updates balances (466ms)
                Deposit
                  ✓ reverts (259ms)
            No Deposit
              Complete
                ✓ some released (61ms)

  FeiRouter
    Buy
      Mint
        Not enough mint
          ✓ reverts (200ms)
        Exempt with enough mint
          ✓ reverts (120ms)
        Sufficient mint
          ✓ succeeds (281ms)
      Deadline
        Too late
          ✓ reverts (249ms)
        On time
          ✓ succeeds (428ms)
      Slippage
        Too high
          ✓ reverts (277ms)
        Acceptable
          ✓ succeeds (385ms)
    Sell
      Burn
        Too much burn
          ✓ reverts (241ms)
        Sufficient burn
          ✓ succeeds (339ms)
        Exempt with too much burn
          ✓ reverts (254ms)
      Deadline
        Too late
          ✓ reverts (368ms)
        On time
          ✓ succeeds (330ms)
      Slippage
        Too high
          ✓ reverts (268ms)
        Acceptable
          ✓ succeeds (245ms)

  Fei
    mint
      not from minter
        ✓ reverts (89ms)
      from minter
        ✓ mints new Fei tokens
    burn
      not from burner
        ✓ reverts (62ms)
      from burner to user with sufficient balance
        ✓ burn Fei tokens (101ms)
      from burner to user without sufficient balance
        ✓ burn Fei tokens (87ms)
    incentive contracts
      ✓ incentive contract registered (61ms)
      via transfer
        on sender
          ✓ balances update (62ms)
          ✓ incentive applied (41ms)
        on receiver
          ✓ balances update
          ✓ incentive applied (101ms)
        on all
          ✓ balances update (47ms)
          ✓ incentive applied (77ms)
        on sender and receiver
          ✓ balances update (67ms)
          ✓ incentive applied (283ms)
        on receiver and all
          ✓ balances update (71ms)
          ✓ incentive applied (104ms)
      via transferFrom
        on operator
          ✓ balances update (63ms)
          ✓ incentive applied (64ms)
          ✓ operator approval decrements (73ms)
        on sender and operator
          ✓ balances update (92ms)
          ✓ incentive applied (95ms)
          ✓ operator approval decrements (105ms)
        on operator and all
          ✓ balances update (94ms)
          ✓ incentive applied (85ms)
          ✓ operator approval decrements (102ms)

  UniswapIncentive
    Incentive Parity
      Above Peg
        Inactive Time Weight
          ✓ reverts
        Active Time Weight
          ✓ reverts (114ms)
      At Peg
        Inactive Time Weight
          ✓ reverts (58ms)
        Active Time Weight
          ✓ reverts (115ms)
      Below Peg
        Inactive Time Weight
          ✓ reverts (60ms)
        Active Time Weight
          Below Parity
            ✓ returns false (91ms)
          At Parity
            ✓ returns true (88ms)
          Exceeds Parity
            ✓ returns true (94ms)
    Time Weight
      ✓ granularity (55ms)
      calculation
        ✓ inactive (148ms)
        ✓ default same block (105ms)
        ✓ default future block (173ms)
        ✓ custom growth rate same block (88ms)
        ✓ custom growth rate future block (201ms)
    At peg
      Buy
        ✓ user balance updates (107ms)
        ✓ pair balance updates (116ms)
        ✓ no incentive (186ms)
        ✓ time weight stays inactive (189ms)
      Sell
        not allowed seller
          ✓ reverts (95ms)
        approval for allowed seller
          ✓ succeeds (327ms)
        enough in wallet
          ✓ user balance updates (131ms)
          ✓ pair balance updates (160ms)
          ✓ burn incentive (218ms)
          ✓ activates time weight (231ms)
        not enough in wallet
          ✓ reverts (226ms)
    Above peg
      Buy
        ✓ user balance updates (117ms)
        ✓ pair balance updates (99ms)
        ✓ no incentive (158ms)
      Sell
        short of peg
          ✓ user balance updates (144ms)
          ✓ pair balance updates (185ms)
          ✓ no incentive (161ms)
          ✓ time weight stays inactive (286ms)
        to peg
          ✓ user balance updates (114ms)
          ✓ pair balance updates (131ms)
          ✓ no incentive (163ms)
          ✓ time weight stays inactive (527ms)
        past the peg
          enough in wallet
            ✓ user balance updates (123ms)
            ✓ pair balance updates (135ms)
            ✓ burn incentive (277ms)
            ✓ activates time weight (239ms)
          not enough in wallet
            ✓ reverts (263ms)
    Below peg
      Buy
        not a minter
          ✓ user balance updates (57ms)
          ✓ pair balance updates (463ms)
          ✓ no incentive (120ms)
          ✓ time weight stays active (155ms)
        exempt user
          ✓ user balance updates (100ms)
          ✓ pair balance updates (82ms)
          ✓ no incentive (174ms)
          ✓ time weight stays active (152ms)
        to peg
          ✓ user balance updates (100ms)
          ✓ pair balance updates (108ms)
          ✓ mint incentive (173ms)
          ✓ resets time weight (365ms)
        past peg
          ✓ user balance updates (174ms)
          ✓ pair balance updates (139ms)
          ✓ mint incentive (204ms)
          ✓ resets time weight (226ms)
        short of peg
          ✓ user balance updates (116ms)
          ✓ pair balance updates (102ms)
          ✓ mint incentive (291ms)
          ✓ partially updates time weight (307ms)
        double time weight
          ✓ user balance updates (107ms)
          ✓ pair balance updates (115ms)
          ✓ mint incentive (185ms)
          ✓ resets time weight (282ms)
        double time weight short of peg
          ✓ user balance updates (135ms)
          ✓ pair balance updates (128ms)
          ✓ mint incentive (194ms)
          ✓ partially updates time weight (191ms)
        time weight exceeds burn
          ✓ user balance updates (144ms)
          ✓ pair balance updates (138ms)
          ✓ mint incentive (177ms)
          ✓ resets time weight (314ms)
      Sell
        not a burner
          ✓ user balance updates (54ms)
          ✓ pair balance updates (77ms)
          ✓ burn incentive (117ms)
          ✓ time weight stays active (268ms)
        exempt user
          ✓ user balance updates (78ms)
          ✓ pair balance updates (88ms)
          ✓ burn incentive (160ms)
          ✓ time weight stays active (186ms)
        enough in wallet
          ✓ user balance updates (104ms)
          ✓ pair balance updates (132ms)
          ✓ burn incentive (186ms)
          ✓ time weight updates (234ms)
        time weight too high
          ✓ user balance updates (101ms)
          ✓ pair balance updates (217ms)
          ✓ burn incentive (222ms)
          ✓ time weight update capped (197ms)
        not enough in wallet
          ✓ reverts (163ms)
    Access
      Incentivize
        ✓ Non-Fei call reverts (49ms)
      Growth Rate
        ✓ Governor set succeeds (160ms)
        ✓ Non-governor set reverts (56ms)
      Oracle
        ✓ Governor set succeeds (93ms)
        ✓ Non-governor set reverts (103ms)
      Exempt Addresses
        ✓ Governor set succeeds (195ms)
        ✓ Non-governor set reverts (145ms)
      Sell Allowed Addresses
        ✓ Governor set succeeds (237ms)
        ✓ Non-governor set reverts (271ms)

  Roots
    Cube Root
      Below 8
        ✓ 0 (49ms)
        ✓ 1 (46ms)
        ✓ 7
      Above 8
        ✓ 8
        ✓ 26 (44ms)
        ✓ 27 (54ms)
        ✓ 511
        ✓ 512
        ✓ 10000
        ✓ 999999999 (42ms)
        ✓ 1000000000 (85ms)
        ✓ 100000000000000000000 (122ms)
    2/3 Root
      ✓ 1.129e39 (71ms)


  469 passing (15m)
```