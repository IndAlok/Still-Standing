import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface CreateNewCrewData {
  crew_insert: Crew_Key;
}

export interface CreateNewCrewVariables {
  name: string;
  description?: string | null;
  isPublic?: boolean | null;
}

export interface CreateUserProfileData {
  user_insert: User_Key;
}

export interface CreateUserProfileVariables {
  firebaseUID: string;
  username: string;
  email: string;
  displayName?: string | null;
  profilePictureUrl?: string | null;
}

export interface Crew_Key {
  id: UUIDString;
  __typename?: 'Crew_Key';
}

export interface GetAllCrewsData {
  crews: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    avatarUrl?: string | null;
    isPublic: boolean;
    maxMembers?: number | null;
    createdAt: TimestampString;
    createdBy: {
      displayName?: string | null;
      username: string;
      profilePictureUrl?: string | null;
    };
  } & Crew_Key)[];
}

export interface GetCrewMembersData {
  memberships: ({
    user: {
      id: UUIDString;
      displayName?: string | null;
      profilePictureUrl?: string | null;
      username: string;
      isOnline?: boolean | null;
      lastActiveAt?: TimestampString | null;
    } & User_Key;
      role: string;
      joinedAt: TimestampString;
      canInvite?: boolean | null;
      canModerate?: boolean | null;
  })[];
}

export interface GetCrewMembersVariables {
  crewId: UUIDString;
}

export interface GetCrewMessagesData {
  messages: ({
    id: UUIDString;
    sender: {
      id: UUIDString;
      displayName?: string | null;
      profilePictureUrl?: string | null;
      username: string;
    } & User_Key;
      content: string;
      messageType: string;
      sentAt: TimestampString;
      imageUrl?: string | null;
      videoUrl?: string | null;
      reactions?: string[] | null;
      mentions?: string[] | null;
  } & Message_Key)[];
}

export interface GetCrewMessagesVariables {
  crewId: UUIDString;
  limit?: number | null;
}

export interface GetPublicCrewsData {
  crews: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    avatarUrl?: string | null;
    createdAt: TimestampString;
    maxMembers?: number | null;
    createdBy: {
      displayName?: string | null;
      username: string;
    };
  } & Crew_Key)[];
}

export interface GetUserMembershipsData {
  memberships: ({
    crew: {
      id: UUIDString;
      name: string;
      description?: string | null;
      avatarUrl?: string | null;
      isPublic: boolean;
    } & Crew_Key;
      role: string;
      joinedAt: TimestampString;
  })[];
}

export interface GetUserMembershipsVariables {
  userId: UUIDString;
}

export interface GetUserProfileData {
  users: ({
    id: UUIDString;
    username: string;
    email: string;
    displayName?: string | null;
    profilePictureUrl?: string | null;
    bio?: string | null;
    lastActiveAt?: TimestampString | null;
    createdAt: TimestampString;
    isOnline?: boolean | null;
  } & User_Key)[];
}

export interface GetUserProfileVariables {
  firebaseUID: string;
}

export interface JoinCrewData {
  membership_insert: Membership_Key;
}

export interface JoinCrewVariables {
  crewId: UUIDString;
}

export interface Membership_Key {
  userId: UUIDString;
  crewId: UUIDString;
  __typename?: 'Membership_Key';
}

export interface Message_Key {
  id: UUIDString;
  __typename?: 'Message_Key';
}

export interface SendMessageData {
  message_insert: Message_Key;
}

export interface SendMessageVariables {
  crewId: UUIDString;
  content: string;
  messageType?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateNewCrewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewCrewVariables): MutationRef<CreateNewCrewData, CreateNewCrewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateNewCrewVariables): MutationRef<CreateNewCrewData, CreateNewCrewVariables>;
  operationName: string;
}
export const createNewCrewRef: CreateNewCrewRef;

export function createNewCrew(vars: CreateNewCrewVariables): MutationPromise<CreateNewCrewData, CreateNewCrewVariables>;
export function createNewCrew(dc: DataConnect, vars: CreateNewCrewVariables): MutationPromise<CreateNewCrewData, CreateNewCrewVariables>;

interface GetPublicCrewsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicCrewsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicCrewsData, undefined>;
  operationName: string;
}
export const getPublicCrewsRef: GetPublicCrewsRef;

export function getPublicCrews(): QueryPromise<GetPublicCrewsData, undefined>;
export function getPublicCrews(dc: DataConnect): QueryPromise<GetPublicCrewsData, undefined>;

interface GetAllCrewsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllCrewsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetAllCrewsData, undefined>;
  operationName: string;
}
export const getAllCrewsRef: GetAllCrewsRef;

export function getAllCrews(): QueryPromise<GetAllCrewsData, undefined>;
export function getAllCrews(dc: DataConnect): QueryPromise<GetAllCrewsData, undefined>;

interface JoinCrewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: JoinCrewVariables): MutationRef<JoinCrewData, JoinCrewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: JoinCrewVariables): MutationRef<JoinCrewData, JoinCrewVariables>;
  operationName: string;
}
export const joinCrewRef: JoinCrewRef;

export function joinCrew(vars: JoinCrewVariables): MutationPromise<JoinCrewData, JoinCrewVariables>;
export function joinCrew(dc: DataConnect, vars: JoinCrewVariables): MutationPromise<JoinCrewData, JoinCrewVariables>;

interface GetCrewMessagesRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCrewMessagesVariables): QueryRef<GetCrewMessagesData, GetCrewMessagesVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCrewMessagesVariables): QueryRef<GetCrewMessagesData, GetCrewMessagesVariables>;
  operationName: string;
}
export const getCrewMessagesRef: GetCrewMessagesRef;

export function getCrewMessages(vars: GetCrewMessagesVariables): QueryPromise<GetCrewMessagesData, GetCrewMessagesVariables>;
export function getCrewMessages(dc: DataConnect, vars: GetCrewMessagesVariables): QueryPromise<GetCrewMessagesData, GetCrewMessagesVariables>;

interface SendMessageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendMessageVariables): MutationRef<SendMessageData, SendMessageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SendMessageVariables): MutationRef<SendMessageData, SendMessageVariables>;
  operationName: string;
}
export const sendMessageRef: SendMessageRef;

export function sendMessage(vars: SendMessageVariables): MutationPromise<SendMessageData, SendMessageVariables>;
export function sendMessage(dc: DataConnect, vars: SendMessageVariables): MutationPromise<SendMessageData, SendMessageVariables>;

interface GetUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
  operationName: string;
}
export const getUserProfileRef: GetUserProfileRef;

export function getUserProfile(vars: GetUserProfileVariables): QueryPromise<GetUserProfileData, GetUserProfileVariables>;
export function getUserProfile(dc: DataConnect, vars: GetUserProfileVariables): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface CreateUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserProfileVariables): MutationRef<CreateUserProfileData, CreateUserProfileVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserProfileVariables): MutationRef<CreateUserProfileData, CreateUserProfileVariables>;
  operationName: string;
}
export const createUserProfileRef: CreateUserProfileRef;

export function createUserProfile(vars: CreateUserProfileVariables): MutationPromise<CreateUserProfileData, CreateUserProfileVariables>;
export function createUserProfile(dc: DataConnect, vars: CreateUserProfileVariables): MutationPromise<CreateUserProfileData, CreateUserProfileVariables>;

interface GetCrewMembersRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCrewMembersVariables): QueryRef<GetCrewMembersData, GetCrewMembersVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetCrewMembersVariables): QueryRef<GetCrewMembersData, GetCrewMembersVariables>;
  operationName: string;
}
export const getCrewMembersRef: GetCrewMembersRef;

export function getCrewMembers(vars: GetCrewMembersVariables): QueryPromise<GetCrewMembersData, GetCrewMembersVariables>;
export function getCrewMembers(dc: DataConnect, vars: GetCrewMembersVariables): QueryPromise<GetCrewMembersData, GetCrewMembersVariables>;

interface GetUserMembershipsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserMembershipsVariables): QueryRef<GetUserMembershipsData, GetUserMembershipsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetUserMembershipsVariables): QueryRef<GetUserMembershipsData, GetUserMembershipsVariables>;
  operationName: string;
}
export const getUserMembershipsRef: GetUserMembershipsRef;

export function getUserMemberships(vars: GetUserMembershipsVariables): QueryPromise<GetUserMembershipsData, GetUserMembershipsVariables>;
export function getUserMemberships(dc: DataConnect, vars: GetUserMembershipsVariables): QueryPromise<GetUserMembershipsData, GetUserMembershipsVariables>;

