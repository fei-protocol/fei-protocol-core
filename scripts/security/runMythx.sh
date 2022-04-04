#!/usr/bin/env bash

##### Upload user specified contracts to MythX for processing  ####

# Example usage:
# MYTHX_API_KEY=1234 ./scripts/security/runMythx.sh deep ./contracts/fei/contract1.sol ./contracts/fei/contract2.sol

# First argument: scan mode 
#    - available options are: quick, standard, deep
# Remaining arguments are the paths to the contracts to be uploaded to MythX
# Pass MYTHX_API_KEY as an environment variable


set -eo pipefail

setupMythX() {
    echo "Creating a virtual environment"
    python3 -m venv venv
    source venv/bin/activate
    pip3 install mythx-cli
    echo "Installed MythX CLI"
    pip3 uninstall "markupsafe" && pip3 install "markupsafe"=="2.0.1"
}

runMythx() {
    # Confirm that an API key is available
    if [ -z "$MYTHX_API_KEY" ]; then
        echo "No MythX API Key found. Exiting."
        exit 1
    fi

    # Scan mode
    SCAN_MODE=$1
    if [ -z "$SCAN_MODE" ]; then
        echo "No scan mode specified. Exiting."
        exit 1
    fi

    # Contract file paths
    CONTRACT_FILE_PATHS=$2
    if [ -z "$CONTRACT_FILE_PATHS" ]; then
        echo "No contracts specified. Exiting."
        exit 1
    fi

    echo "Scan mode: $SCAN_MODE"
    echo "Contracts for upload: $CONTRACT_FILE_PATHS"

    echo "Uploading..."
    # Upload to Mythx API
    api_response=$(mythx --api-key $MYTHX_API_KEY analyze $CONTRACT_FILE_PATHS --async \
        --create-group --group-name "test123" --mode $SCAN_MODE --solc-version 0.8.4 --remap-import @uniswap=node_modules/@uniswap \
        --remap-import @openzeppelin=node_modules/@openzeppelin  --remap-import @chainlink=node_modules/@chainlink)

    echo "Uploaded, Mythx response: "
    echo $api_response
}

teardown() {
    echo "Tearing down environment"
    deactivate
    rm -rf venv
    echo "Removed Python environment"
}

setupMythX 
runMythx $1 ${@:2}
teardown