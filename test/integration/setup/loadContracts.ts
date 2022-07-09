import { MainnetContractsConfigs } from '@protocol/mainnetAddresses';
import { ethers } from 'hardhat';
import { MainnetContracts, MainnetContractsConfig, NamedAddresses } from '@custom-types/types';

export async function getAllContracts(): Promise<MainnetContracts> {
  const addresses = MainnetContractsConfigs as MainnetContractsConfig;
  const contractsAsArrayEntries = await Promise.all(
    Object.entries(addresses)
      .filter((entry) => entry[1].artifactName != 'unknown')
      .map(async (entry) => {
        return [entry[0], await ethers.getContractAt(entry[1].artifactName, entry[1].address)];
      })
  );

  return Object.fromEntries(contractsAsArrayEntries) as MainnetContracts;
}

export function getAllContractAddresses(): NamedAddresses {
  const contracts: NamedAddresses = {};
  const addresses = MainnetContractsConfigs as MainnetContractsConfig;

  for (const mainnetAddressEntryName in addresses) {
    const mainnetAddressEntry = addresses[mainnetAddressEntryName];
    contracts[mainnetAddressEntryName] = mainnetAddressEntry.address;
  }

  return contracts;
}
