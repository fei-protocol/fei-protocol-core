#!/usr/bin/env bash

##### Upload user specified contracts to MythX for processing  ####
# First argument: scan mode 
#    - available options are: quick, standard, deep
# Remaining arguments are the paths to the contracts to be uploaded to MythX

set -eo pipefail

setupMythX() {
    echo "Creating a virtual environment"
    python3 -m venv venv
    source venv/bin/activate
    pip3 install mythx-cli
    echo "Installed MythX CLI"
}

runMythx() {
    # Confirm that an API key is available
    if [ -z "$MYTHX_API_KEY" ]; then
        echo "No MythX API Key found. Exiting."
        exit 1
    fi

    # Scan mode
    if [ -z "$1" ]; then
        echo "No scan mode specified. Exiting."
        exit 1
    fi

    # Contract file paths
    echo "contract file paths"
    echo $CONTRACT_FILE_PATHS

    

    echo "Uploading contracts to MythX"
    # Upload to Mythx API
    api_response=mythx --api-key $MYTHX_API_KEY analyze --async \
        --create-group --mode $SCAN_MODE --remap-import @uniswap=node_modules/@uniswap \
        --remap-import @openzeppelin=node_modules/@openzeppelin  --remap-import @chainlink=node_modules/@chainlink \ 
        --include $CONTRACT_FILE_PATHS

    echo "Uploaded, Mythx response: "
    echo $api_response
}

removeMythX() {
    echo "Tearing down environment"
    deactivate
    rm -rf venv
    echo "Removed Python environment"
}

setupMythX 
runMythx $1 