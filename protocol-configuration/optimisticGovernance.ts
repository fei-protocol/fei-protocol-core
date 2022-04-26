import { ethers } from 'ethers';

export type PodConfig = {
  members: string[];
  threshold: number;
  label: string;
  ensString: string;
  imageUrl: string;
  minDelay: number;
  numMembers: number;
  placeHolderMembers: string[];
};

export type PodCreationConfig = {
  members: string[];
  threshold: number;
  label: string;
  ensString: string;
  imageUrl: string;
  admin: string;
  minDelay: number;
};

export const tribalCouncilMembers = [
  '0x000000000000000000000000000000000000000D', // TODO: Complete with real member addresses
  '0x000000000000000000000000000000000000000E',
  '0x000000000000000000000000000000000000000F',
  '0x0000000000000000000000000000000000000010',
  '0x0000000000000000000000000000000000000011',
  '0x0000000000000000000000000000000000000012',
  '0x0000000000000000000000000000000000000013',
  '0x0000000000000000000000000000000000000014',
  '0x0000000000000000000000000000000000000015'
];

export const placeHolderCouncilMembers = [
  '0x0000000000000000000000000000000000000004',
  '0x0000000000000000000000000000000000000005',
  '0x0000000000000000000000000000000000000006',
  '0x0000000000000000000000000000000000000007',
  '0x0000000000000000000000000000000000000008',
  '0x0000000000000000000000000000000000000009',
  '0x000000000000000000000000000000000000000a',
  '0x000000000000000000000000000000000000000b',
  '0x000000000000000000000000000000000000000c'
];

export const MIN_TIMELOCK_DELAY = 86400; // 1 day

export const tribeCouncilPodConfig: PodConfig = {
  members: tribalCouncilMembers,
  threshold: 5,
  label: '0x54726962616c436f756e63696c00000000000000000000000000000000000000', // TribalCouncil
  ensString: 'tribalcouncil',
  imageUrl: '',
  minDelay: 86400 * 4, // 4 days
  numMembers: tribalCouncilMembers.length,
  placeHolderMembers: placeHolderCouncilMembers
};