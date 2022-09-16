import balances from "./balances.json"
import { ethers } from "ethers"
import { getAddress } from "ethers/lib/utils"

export const balancesChecksummed = Object.fromEntries(
    Object.entries(balances)
        .map(([ctokenAddress, userBalances]) => 
            [ctokenAddress, Object.fromEntries(
                Object.entries(userBalances)
                    .map((balances) => (getAddress(balances[0]), balances[1]))
            )
        )
    )