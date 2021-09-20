// SPDX-License-Identifier: GPL-3.0-or-later
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.8.0;

// interface with required methods from Balancer V2 IBasePool
// https://github.com/balancer-labs/balancer-v2-monorepo/blob/389b52f1fc9e468de854810ce9dc3251d2d5b212/pkg/asset-manager-utils/contracts/IAssetManager.sol

interface IAssetManager {
    struct PoolConfig {
        uint64 targetPercentage;
        uint64 criticalPercentage;
        uint64 feePercentage;
    }

    function setPoolConfig(bytes32 poolId, PoolConfig calldata config) external;
}
