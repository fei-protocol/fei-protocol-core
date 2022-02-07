// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;


/**
 * @title TribeMetadataV1
 * @notice Metadata for Tribe contracts
 * @dev please read https://semver.org/
 */
abstract contract TribeMetadataV1 {
    struct TribeMetadata {
        uint8 major;
        uint8 minor;
        uint8 patch;
        string name;
    }

    TribeMetadata public metadata;

    constructor(
        uint8 major,
        uint8 minor,
        uint8 patch,
        string memory name
    ) {
        metadata.major = major;
        metadata.minor = minor;
        metadata.patch = patch;
        metadata.name = name;
    }
}