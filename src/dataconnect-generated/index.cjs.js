const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'still-standing',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const createNewCrewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateNewCrew', inputVars);
}
createNewCrewRef.operationName = 'CreateNewCrew';
exports.createNewCrewRef = createNewCrewRef;

exports.createNewCrew = function createNewCrew(dcOrVars, vars) {
  return executeMutation(createNewCrewRef(dcOrVars, vars));
};

const getPublicCrewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicCrews');
}
getPublicCrewsRef.operationName = 'GetPublicCrews';
exports.getPublicCrewsRef = getPublicCrewsRef;

exports.getPublicCrews = function getPublicCrews(dc) {
  return executeQuery(getPublicCrewsRef(dc));
};

const getAllCrewsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetAllCrews');
}
getAllCrewsRef.operationName = 'GetAllCrews';
exports.getAllCrewsRef = getAllCrewsRef;

exports.getAllCrews = function getAllCrews(dc) {
  return executeQuery(getAllCrewsRef(dc));
};

const joinCrewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'JoinCrew', inputVars);
}
joinCrewRef.operationName = 'JoinCrew';
exports.joinCrewRef = joinCrewRef;

exports.joinCrew = function joinCrew(dcOrVars, vars) {
  return executeMutation(joinCrewRef(dcOrVars, vars));
};

const getCrewMessagesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCrewMessages', inputVars);
}
getCrewMessagesRef.operationName = 'GetCrewMessages';
exports.getCrewMessagesRef = getCrewMessagesRef;

exports.getCrewMessages = function getCrewMessages(dcOrVars, vars) {
  return executeQuery(getCrewMessagesRef(dcOrVars, vars));
};

const sendMessageRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SendMessage', inputVars);
}
sendMessageRef.operationName = 'SendMessage';
exports.sendMessageRef = sendMessageRef;

exports.sendMessage = function sendMessage(dcOrVars, vars) {
  return executeMutation(sendMessageRef(dcOrVars, vars));
};

const getUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProfile', inputVars);
}
getUserProfileRef.operationName = 'GetUserProfile';
exports.getUserProfileRef = getUserProfileRef;

exports.getUserProfile = function getUserProfile(dcOrVars, vars) {
  return executeQuery(getUserProfileRef(dcOrVars, vars));
};

const createUserProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateUserProfile', inputVars);
}
createUserProfileRef.operationName = 'CreateUserProfile';
exports.createUserProfileRef = createUserProfileRef;

exports.createUserProfile = function createUserProfile(dcOrVars, vars) {
  return executeMutation(createUserProfileRef(dcOrVars, vars));
};

const getCrewMembersRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetCrewMembers', inputVars);
}
getCrewMembersRef.operationName = 'GetCrewMembers';
exports.getCrewMembersRef = getCrewMembersRef;

exports.getCrewMembers = function getCrewMembers(dcOrVars, vars) {
  return executeQuery(getCrewMembersRef(dcOrVars, vars));
};

const getUserMembershipsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserMemberships', inputVars);
}
getUserMembershipsRef.operationName = 'GetUserMemberships';
exports.getUserMembershipsRef = getUserMembershipsRef;

exports.getUserMemberships = function getUserMemberships(dcOrVars, vars) {
  return executeQuery(getUserMembershipsRef(dcOrVars, vars));
};
