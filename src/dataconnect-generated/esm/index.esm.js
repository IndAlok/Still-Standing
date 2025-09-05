import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'still-standing',
  location: 'us-central1'
};

export const createNewCrewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewCrew', inputVars);
}
createNewCrewRef.operationName = 'CreateNewCrew';

export function createNewCrew(dcOrVars, vars) {
  return executeMutation(createNewCrewRef(dcOrVars, vars));
}

export const getPublicCrewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicCrews');
}
getPublicCrewsRef.operationName = 'GetPublicCrews';

export function getPublicCrews(dc) {
  return executeQuery(getPublicCrewsRef(dc));
}

export const getAllCrewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAllCrews');
}
getAllCrewsRef.operationName = 'GetAllCrews';

export function getAllCrews(dc) {
  return executeQuery(getAllCrewsRef(dc));
}

export const joinCrewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'JoinCrew', inputVars);
}
joinCrewRef.operationName = 'JoinCrew';

export function joinCrew(dcOrVars, vars) {
  return executeMutation(joinCrewRef(dcOrVars, vars));
}

export const getCrewMessagesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCrewMessages', inputVars);
}
getCrewMessagesRef.operationName = 'GetCrewMessages';

export function getCrewMessages(dcOrVars, vars) {
  return executeQuery(getCrewMessagesRef(dcOrVars, vars));
}

export const sendMessageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SendMessage', inputVars);
}
sendMessageRef.operationName = 'SendMessage';

export function sendMessage(dcOrVars, vars) {
  return executeMutation(sendMessageRef(dcOrVars, vars));
}

export const getUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProfile', inputVars);
}
getUserProfileRef.operationName = 'GetUserProfile';

export function getUserProfile(dcOrVars, vars) {
  return executeQuery(getUserProfileRef(dcOrVars, vars));
}

export const createUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUserProfile', inputVars);
}
createUserProfileRef.operationName = 'CreateUserProfile';

export function createUserProfile(dcOrVars, vars) {
  return executeMutation(createUserProfileRef(dcOrVars, vars));
}

export const getCrewMembersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCrewMembers', inputVars);
}
getCrewMembersRef.operationName = 'GetCrewMembers';

export function getCrewMembers(dcOrVars, vars) {
  return executeQuery(getCrewMembersRef(dcOrVars, vars));
}

export const getUserMembershipsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserMemberships', inputVars);
}
getUserMembershipsRef.operationName = 'GetUserMemberships';

export function getUserMemberships(dcOrVars, vars) {
  return executeQuery(getUserMembershipsRef(dcOrVars, vars));
}

