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

export const tribeCouncilPodConfig: PodConfig = {
  members: tribalCouncilMembers,
  threshold: 5,
  label: '0x54726962616c436f756e63696c00000000000000000000000000000000000000', // TribalCouncil
  ensString: 'tribalCouncil.eth',
  imageUrl: 'tribalCouncil.com',
  minDelay: 345600,
  numMembers: tribalCouncilMembers.length,
  placeHolderMembers: placeHolderCouncilMembers
};

export const protocolPodMembers = [
  '0x0000000000000000000000000000000000000009', // TODO: Complete with real member addresses
  '0x000000000000000000000000000000000000000A',
  '0x000000000000000000000000000000000000000B',
  '0x000000000000000000000000000000000000000C',
  '0x000000000000000000000000000000000000000D'
];

export const placeHolderPodMembers = [
  '0x0000000000000000000000000000000000000004',
  '0x0000000000000000000000000000000000000005',
  '0x0000000000000000000000000000000000000006',
  '0x0000000000000000000000000000000000000007',
  '0x0000000000000000000000000000000000000008'
];

export const protocolPodConfig: PodConfig = {
  members: protocolPodMembers,
  threshold: 3,
  label: '0x50726f746f636f6c506f64000000000000000000000000000000000000000000', // ProtocolPod
  ensString: 'protocolPod.eth',
  imageUrl: 'protocolPod.com',
  minDelay: 172800, // 2 days
  numMembers: protocolPodMembers.length,
  placeHolderMembers: placeHolderPodMembers
};

type PodAdminPriviledges = {
  ADD_MEMBER: string[];
  REMOVE_MEMBER: string[];
};

const GOVERN_ROLE_ID = ethers.utils.id('GOVERN_ROLE');
const ROLE_ADMIN_ID = ethers.utils.id('ROLE_ADMIN');
const GUARDIAN_ROLE_ID = ethers.utils.id('GUARDIAN_ROLE');

export const adminPriviledge = {
  ADD_MEMBER: 0,
  REMOVE_MEMBER: 1
};

// TribeRoles which are granted a form of admin control over the TribalCouncil
export const tribalCouncilAdminTribeRoles: PodAdminPriviledges = {
  ADD_MEMBER: [GOVERN_ROLE_ID],
  REMOVE_MEMBER: [GOVERN_ROLE_ID, GUARDIAN_ROLE_ID]
};

// TribeRoles which are granted a form of control over the ProtocolTier pod
export const protocolPodAdminTribeRoles: PodAdminPriviledges = {
  ADD_MEMBER: [GOVERN_ROLE_ID, ROLE_ADMIN_ID],
  REMOVE_MEMBER: [GOVERN_ROLE_ID, ROLE_ADMIN_ID, GUARDIAN_ROLE_ID]
};
