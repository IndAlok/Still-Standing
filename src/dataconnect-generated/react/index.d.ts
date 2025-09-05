import { CreateNewCrewData, CreateNewCrewVariables, GetPublicCrewsData, GetAllCrewsData, JoinCrewData, JoinCrewVariables, GetCrewMessagesData, GetCrewMessagesVariables, SendMessageData, SendMessageVariables, GetUserProfileData, GetUserProfileVariables, CreateUserProfileData, CreateUserProfileVariables, GetCrewMembersData, GetCrewMembersVariables, GetUserMembershipsData, GetUserMembershipsVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateNewCrew(options?: useDataConnectMutationOptions<CreateNewCrewData, FirebaseError, CreateNewCrewVariables>): UseDataConnectMutationResult<CreateNewCrewData, CreateNewCrewVariables>;
export function useCreateNewCrew(dc: DataConnect, options?: useDataConnectMutationOptions<CreateNewCrewData, FirebaseError, CreateNewCrewVariables>): UseDataConnectMutationResult<CreateNewCrewData, CreateNewCrewVariables>;

export function useGetPublicCrews(options?: useDataConnectQueryOptions<GetPublicCrewsData>): UseDataConnectQueryResult<GetPublicCrewsData, undefined>;
export function useGetPublicCrews(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicCrewsData>): UseDataConnectQueryResult<GetPublicCrewsData, undefined>;

export function useGetAllCrews(options?: useDataConnectQueryOptions<GetAllCrewsData>): UseDataConnectQueryResult<GetAllCrewsData, undefined>;
export function useGetAllCrews(dc: DataConnect, options?: useDataConnectQueryOptions<GetAllCrewsData>): UseDataConnectQueryResult<GetAllCrewsData, undefined>;

export function useJoinCrew(options?: useDataConnectMutationOptions<JoinCrewData, FirebaseError, JoinCrewVariables>): UseDataConnectMutationResult<JoinCrewData, JoinCrewVariables>;
export function useJoinCrew(dc: DataConnect, options?: useDataConnectMutationOptions<JoinCrewData, FirebaseError, JoinCrewVariables>): UseDataConnectMutationResult<JoinCrewData, JoinCrewVariables>;

export function useGetCrewMessages(vars: GetCrewMessagesVariables, options?: useDataConnectQueryOptions<GetCrewMessagesData>): UseDataConnectQueryResult<GetCrewMessagesData, GetCrewMessagesVariables>;
export function useGetCrewMessages(dc: DataConnect, vars: GetCrewMessagesVariables, options?: useDataConnectQueryOptions<GetCrewMessagesData>): UseDataConnectQueryResult<GetCrewMessagesData, GetCrewMessagesVariables>;

export function useSendMessage(options?: useDataConnectMutationOptions<SendMessageData, FirebaseError, SendMessageVariables>): UseDataConnectMutationResult<SendMessageData, SendMessageVariables>;
export function useSendMessage(dc: DataConnect, options?: useDataConnectMutationOptions<SendMessageData, FirebaseError, SendMessageVariables>): UseDataConnectMutationResult<SendMessageData, SendMessageVariables>;

export function useGetUserProfile(vars: GetUserProfileVariables, options?: useDataConnectQueryOptions<GetUserProfileData>): UseDataConnectQueryResult<GetUserProfileData, GetUserProfileVariables>;
export function useGetUserProfile(dc: DataConnect, vars: GetUserProfileVariables, options?: useDataConnectQueryOptions<GetUserProfileData>): UseDataConnectQueryResult<GetUserProfileData, GetUserProfileVariables>;

export function useCreateUserProfile(options?: useDataConnectMutationOptions<CreateUserProfileData, FirebaseError, CreateUserProfileVariables>): UseDataConnectMutationResult<CreateUserProfileData, CreateUserProfileVariables>;
export function useCreateUserProfile(dc: DataConnect, options?: useDataConnectMutationOptions<CreateUserProfileData, FirebaseError, CreateUserProfileVariables>): UseDataConnectMutationResult<CreateUserProfileData, CreateUserProfileVariables>;

export function useGetCrewMembers(vars: GetCrewMembersVariables, options?: useDataConnectQueryOptions<GetCrewMembersData>): UseDataConnectQueryResult<GetCrewMembersData, GetCrewMembersVariables>;
export function useGetCrewMembers(dc: DataConnect, vars: GetCrewMembersVariables, options?: useDataConnectQueryOptions<GetCrewMembersData>): UseDataConnectQueryResult<GetCrewMembersData, GetCrewMembersVariables>;

export function useGetUserMemberships(vars: GetUserMembershipsVariables, options?: useDataConnectQueryOptions<GetUserMembershipsData>): UseDataConnectQueryResult<GetUserMembershipsData, GetUserMembershipsVariables>;
export function useGetUserMemberships(dc: DataConnect, vars: GetUserMembershipsVariables, options?: useDataConnectQueryOptions<GetUserMembershipsData>): UseDataConnectQueryResult<GetUserMembershipsData, GetUserMembershipsVariables>;
