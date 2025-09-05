# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetPublicCrews*](#getpubliccrews)
  - [*GetAllCrews*](#getallcrews)
  - [*GetCrewMessages*](#getcrewmessages)
  - [*GetUserProfile*](#getuserprofile)
  - [*GetCrewMembers*](#getcrewmembers)
  - [*GetUserMemberships*](#getusermemberships)
- [**Mutations**](#mutations)
  - [*CreateNewCrew*](#createnewcrew)
  - [*JoinCrew*](#joincrew)
  - [*SendMessage*](#sendmessage)
  - [*CreateUserProfile*](#createuserprofile)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetPublicCrews
You can execute the `GetPublicCrews` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicCrews(): QueryPromise<GetPublicCrewsData, undefined>;

interface GetPublicCrewsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicCrewsData, undefined>;
}
export const getPublicCrewsRef: GetPublicCrewsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicCrews(dc: DataConnect): QueryPromise<GetPublicCrewsData, undefined>;

interface GetPublicCrewsRef {
  ...
  (dc: DataConnect): QueryRef<GetPublicCrewsData, undefined>;
}
export const getPublicCrewsRef: GetPublicCrewsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicCrewsRef:
```typescript
const name = getPublicCrewsRef.operationName;
console.log(name);
```

### Variables
The `GetPublicCrews` query has no variables.
### Return Type
Recall that executing the `GetPublicCrews` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicCrewsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetPublicCrews`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicCrews } from '@dataconnect/generated';


// Call the `getPublicCrews()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicCrews();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicCrews(dataConnect);

console.log(data.crews);

// Or, you can use the `Promise` API.
getPublicCrews().then((response) => {
  const data = response.data;
  console.log(data.crews);
});
```

### Using `GetPublicCrews`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicCrewsRef } from '@dataconnect/generated';


// Call the `getPublicCrewsRef()` function to get a reference to the query.
const ref = getPublicCrewsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicCrewsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.crews);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.crews);
});
```

## GetAllCrews
You can execute the `GetAllCrews` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getAllCrews(): QueryPromise<GetAllCrewsData, undefined>;

interface GetAllCrewsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetAllCrewsData, undefined>;
}
export const getAllCrewsRef: GetAllCrewsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getAllCrews(dc: DataConnect): QueryPromise<GetAllCrewsData, undefined>;

interface GetAllCrewsRef {
  ...
  (dc: DataConnect): QueryRef<GetAllCrewsData, undefined>;
}
export const getAllCrewsRef: GetAllCrewsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getAllCrewsRef:
```typescript
const name = getAllCrewsRef.operationName;
console.log(name);
```

### Variables
The `GetAllCrews` query has no variables.
### Return Type
Recall that executing the `GetAllCrews` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetAllCrewsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetAllCrews`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getAllCrews } from '@dataconnect/generated';


// Call the `getAllCrews()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getAllCrews();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getAllCrews(dataConnect);

console.log(data.crews);

// Or, you can use the `Promise` API.
getAllCrews().then((response) => {
  const data = response.data;
  console.log(data.crews);
});
```

### Using `GetAllCrews`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getAllCrewsRef } from '@dataconnect/generated';


// Call the `getAllCrewsRef()` function to get a reference to the query.
const ref = getAllCrewsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getAllCrewsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.crews);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.crews);
});
```

## GetCrewMessages
You can execute the `GetCrewMessages` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCrewMessages(vars: GetCrewMessagesVariables): QueryPromise<GetCrewMessagesData, GetCrewMessagesVariables>;

interface GetCrewMessagesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCrewMessagesVariables): QueryRef<GetCrewMessagesData, GetCrewMessagesVariables>;
}
export const getCrewMessagesRef: GetCrewMessagesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCrewMessages(dc: DataConnect, vars: GetCrewMessagesVariables): QueryPromise<GetCrewMessagesData, GetCrewMessagesVariables>;

interface GetCrewMessagesRef {
  ...
  (dc: DataConnect, vars: GetCrewMessagesVariables): QueryRef<GetCrewMessagesData, GetCrewMessagesVariables>;
}
export const getCrewMessagesRef: GetCrewMessagesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCrewMessagesRef:
```typescript
const name = getCrewMessagesRef.operationName;
console.log(name);
```

### Variables
The `GetCrewMessages` query requires an argument of type `GetCrewMessagesVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCrewMessagesVariables {
  crewId: UUIDString;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `GetCrewMessages` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCrewMessagesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCrewMessages`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCrewMessages, GetCrewMessagesVariables } from '@dataconnect/generated';

// The `GetCrewMessages` query requires an argument of type `GetCrewMessagesVariables`:
const getCrewMessagesVars: GetCrewMessagesVariables = {
  crewId: ..., 
  limit: ..., // optional
};

// Call the `getCrewMessages()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCrewMessages(getCrewMessagesVars);
// Variables can be defined inline as well.
const { data } = await getCrewMessages({ crewId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCrewMessages(dataConnect, getCrewMessagesVars);

console.log(data.messages);

// Or, you can use the `Promise` API.
getCrewMessages(getCrewMessagesVars).then((response) => {
  const data = response.data;
  console.log(data.messages);
});
```

### Using `GetCrewMessages`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCrewMessagesRef, GetCrewMessagesVariables } from '@dataconnect/generated';

// The `GetCrewMessages` query requires an argument of type `GetCrewMessagesVariables`:
const getCrewMessagesVars: GetCrewMessagesVariables = {
  crewId: ..., 
  limit: ..., // optional
};

// Call the `getCrewMessagesRef()` function to get a reference to the query.
const ref = getCrewMessagesRef(getCrewMessagesVars);
// Variables can be defined inline as well.
const ref = getCrewMessagesRef({ crewId: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCrewMessagesRef(dataConnect, getCrewMessagesVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.messages);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.messages);
});
```

## GetUserProfile
You can execute the `GetUserProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserProfile(vars: GetUserProfileVariables): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface GetUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
}
export const getUserProfileRef: GetUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserProfile(dc: DataConnect, vars: GetUserProfileVariables): QueryPromise<GetUserProfileData, GetUserProfileVariables>;

interface GetUserProfileRef {
  ...
  (dc: DataConnect, vars: GetUserProfileVariables): QueryRef<GetUserProfileData, GetUserProfileVariables>;
}
export const getUserProfileRef: GetUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserProfileRef:
```typescript
const name = getUserProfileRef.operationName;
console.log(name);
```

### Variables
The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserProfileVariables {
  firebaseUID: string;
}
```
### Return Type
Recall that executing the `GetUserProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserProfile, GetUserProfileVariables } from '@dataconnect/generated';

// The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`:
const getUserProfileVars: GetUserProfileVariables = {
  firebaseUID: ..., 
};

// Call the `getUserProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserProfile(getUserProfileVars);
// Variables can be defined inline as well.
const { data } = await getUserProfile({ firebaseUID: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserProfile(dataConnect, getUserProfileVars);

console.log(data.users);

// Or, you can use the `Promise` API.
getUserProfile(getUserProfileVars).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

### Using `GetUserProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserProfileRef, GetUserProfileVariables } from '@dataconnect/generated';

// The `GetUserProfile` query requires an argument of type `GetUserProfileVariables`:
const getUserProfileVars: GetUserProfileVariables = {
  firebaseUID: ..., 
};

// Call the `getUserProfileRef()` function to get a reference to the query.
const ref = getUserProfileRef(getUserProfileVars);
// Variables can be defined inline as well.
const ref = getUserProfileRef({ firebaseUID: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserProfileRef(dataConnect, getUserProfileVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.users);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.users);
});
```

## GetCrewMembers
You can execute the `GetCrewMembers` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getCrewMembers(vars: GetCrewMembersVariables): QueryPromise<GetCrewMembersData, GetCrewMembersVariables>;

interface GetCrewMembersRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetCrewMembersVariables): QueryRef<GetCrewMembersData, GetCrewMembersVariables>;
}
export const getCrewMembersRef: GetCrewMembersRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getCrewMembers(dc: DataConnect, vars: GetCrewMembersVariables): QueryPromise<GetCrewMembersData, GetCrewMembersVariables>;

interface GetCrewMembersRef {
  ...
  (dc: DataConnect, vars: GetCrewMembersVariables): QueryRef<GetCrewMembersData, GetCrewMembersVariables>;
}
export const getCrewMembersRef: GetCrewMembersRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getCrewMembersRef:
```typescript
const name = getCrewMembersRef.operationName;
console.log(name);
```

### Variables
The `GetCrewMembers` query requires an argument of type `GetCrewMembersVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetCrewMembersVariables {
  crewId: UUIDString;
}
```
### Return Type
Recall that executing the `GetCrewMembers` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetCrewMembersData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetCrewMembers`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getCrewMembers, GetCrewMembersVariables } from '@dataconnect/generated';

// The `GetCrewMembers` query requires an argument of type `GetCrewMembersVariables`:
const getCrewMembersVars: GetCrewMembersVariables = {
  crewId: ..., 
};

// Call the `getCrewMembers()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getCrewMembers(getCrewMembersVars);
// Variables can be defined inline as well.
const { data } = await getCrewMembers({ crewId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getCrewMembers(dataConnect, getCrewMembersVars);

console.log(data.memberships);

// Or, you can use the `Promise` API.
getCrewMembers(getCrewMembersVars).then((response) => {
  const data = response.data;
  console.log(data.memberships);
});
```

### Using `GetCrewMembers`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getCrewMembersRef, GetCrewMembersVariables } from '@dataconnect/generated';

// The `GetCrewMembers` query requires an argument of type `GetCrewMembersVariables`:
const getCrewMembersVars: GetCrewMembersVariables = {
  crewId: ..., 
};

// Call the `getCrewMembersRef()` function to get a reference to the query.
const ref = getCrewMembersRef(getCrewMembersVars);
// Variables can be defined inline as well.
const ref = getCrewMembersRef({ crewId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getCrewMembersRef(dataConnect, getCrewMembersVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.memberships);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.memberships);
});
```

## GetUserMemberships
You can execute the `GetUserMemberships` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserMemberships(vars: GetUserMembershipsVariables): QueryPromise<GetUserMembershipsData, GetUserMembershipsVariables>;

interface GetUserMembershipsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetUserMembershipsVariables): QueryRef<GetUserMembershipsData, GetUserMembershipsVariables>;
}
export const getUserMembershipsRef: GetUserMembershipsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserMemberships(dc: DataConnect, vars: GetUserMembershipsVariables): QueryPromise<GetUserMembershipsData, GetUserMembershipsVariables>;

interface GetUserMembershipsRef {
  ...
  (dc: DataConnect, vars: GetUserMembershipsVariables): QueryRef<GetUserMembershipsData, GetUserMembershipsVariables>;
}
export const getUserMembershipsRef: GetUserMembershipsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserMembershipsRef:
```typescript
const name = getUserMembershipsRef.operationName;
console.log(name);
```

### Variables
The `GetUserMemberships` query requires an argument of type `GetUserMembershipsVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetUserMembershipsVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `GetUserMemberships` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserMembershipsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserMemberships`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserMemberships, GetUserMembershipsVariables } from '@dataconnect/generated';

// The `GetUserMemberships` query requires an argument of type `GetUserMembershipsVariables`:
const getUserMembershipsVars: GetUserMembershipsVariables = {
  userId: ..., 
};

// Call the `getUserMemberships()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserMemberships(getUserMembershipsVars);
// Variables can be defined inline as well.
const { data } = await getUserMemberships({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserMemberships(dataConnect, getUserMembershipsVars);

console.log(data.memberships);

// Or, you can use the `Promise` API.
getUserMemberships(getUserMembershipsVars).then((response) => {
  const data = response.data;
  console.log(data.memberships);
});
```

### Using `GetUserMemberships`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserMembershipsRef, GetUserMembershipsVariables } from '@dataconnect/generated';

// The `GetUserMemberships` query requires an argument of type `GetUserMembershipsVariables`:
const getUserMembershipsVars: GetUserMembershipsVariables = {
  userId: ..., 
};

// Call the `getUserMembershipsRef()` function to get a reference to the query.
const ref = getUserMembershipsRef(getUserMembershipsVars);
// Variables can be defined inline as well.
const ref = getUserMembershipsRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserMembershipsRef(dataConnect, getUserMembershipsVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.memberships);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.memberships);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateNewCrew
You can execute the `CreateNewCrew` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createNewCrew(vars: CreateNewCrewVariables): MutationPromise<CreateNewCrewData, CreateNewCrewVariables>;

interface CreateNewCrewRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateNewCrewVariables): MutationRef<CreateNewCrewData, CreateNewCrewVariables>;
}
export const createNewCrewRef: CreateNewCrewRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createNewCrew(dc: DataConnect, vars: CreateNewCrewVariables): MutationPromise<CreateNewCrewData, CreateNewCrewVariables>;

interface CreateNewCrewRef {
  ...
  (dc: DataConnect, vars: CreateNewCrewVariables): MutationRef<CreateNewCrewData, CreateNewCrewVariables>;
}
export const createNewCrewRef: CreateNewCrewRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createNewCrewRef:
```typescript
const name = createNewCrewRef.operationName;
console.log(name);
```

### Variables
The `CreateNewCrew` mutation requires an argument of type `CreateNewCrewVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateNewCrewVariables {
  name: string;
  description?: string | null;
  isPublic?: boolean | null;
}
```
### Return Type
Recall that executing the `CreateNewCrew` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateNewCrewData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateNewCrewData {
  crew_insert: Crew_Key;
}
```
### Using `CreateNewCrew`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createNewCrew, CreateNewCrewVariables } from '@dataconnect/generated';

// The `CreateNewCrew` mutation requires an argument of type `CreateNewCrewVariables`:
const createNewCrewVars: CreateNewCrewVariables = {
  name: ..., 
  description: ..., // optional
  isPublic: ..., // optional
};

// Call the `createNewCrew()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createNewCrew(createNewCrewVars);
// Variables can be defined inline as well.
const { data } = await createNewCrew({ name: ..., description: ..., isPublic: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createNewCrew(dataConnect, createNewCrewVars);

console.log(data.crew_insert);

// Or, you can use the `Promise` API.
createNewCrew(createNewCrewVars).then((response) => {
  const data = response.data;
  console.log(data.crew_insert);
});
```

### Using `CreateNewCrew`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createNewCrewRef, CreateNewCrewVariables } from '@dataconnect/generated';

// The `CreateNewCrew` mutation requires an argument of type `CreateNewCrewVariables`:
const createNewCrewVars: CreateNewCrewVariables = {
  name: ..., 
  description: ..., // optional
  isPublic: ..., // optional
};

// Call the `createNewCrewRef()` function to get a reference to the mutation.
const ref = createNewCrewRef(createNewCrewVars);
// Variables can be defined inline as well.
const ref = createNewCrewRef({ name: ..., description: ..., isPublic: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createNewCrewRef(dataConnect, createNewCrewVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.crew_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.crew_insert);
});
```

## JoinCrew
You can execute the `JoinCrew` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
joinCrew(vars: JoinCrewVariables): MutationPromise<JoinCrewData, JoinCrewVariables>;

interface JoinCrewRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: JoinCrewVariables): MutationRef<JoinCrewData, JoinCrewVariables>;
}
export const joinCrewRef: JoinCrewRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
joinCrew(dc: DataConnect, vars: JoinCrewVariables): MutationPromise<JoinCrewData, JoinCrewVariables>;

interface JoinCrewRef {
  ...
  (dc: DataConnect, vars: JoinCrewVariables): MutationRef<JoinCrewData, JoinCrewVariables>;
}
export const joinCrewRef: JoinCrewRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the joinCrewRef:
```typescript
const name = joinCrewRef.operationName;
console.log(name);
```

### Variables
The `JoinCrew` mutation requires an argument of type `JoinCrewVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface JoinCrewVariables {
  crewId: UUIDString;
}
```
### Return Type
Recall that executing the `JoinCrew` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `JoinCrewData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface JoinCrewData {
  membership_insert: Membership_Key;
}
```
### Using `JoinCrew`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, joinCrew, JoinCrewVariables } from '@dataconnect/generated';

// The `JoinCrew` mutation requires an argument of type `JoinCrewVariables`:
const joinCrewVars: JoinCrewVariables = {
  crewId: ..., 
};

// Call the `joinCrew()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await joinCrew(joinCrewVars);
// Variables can be defined inline as well.
const { data } = await joinCrew({ crewId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await joinCrew(dataConnect, joinCrewVars);

console.log(data.membership_insert);

// Or, you can use the `Promise` API.
joinCrew(joinCrewVars).then((response) => {
  const data = response.data;
  console.log(data.membership_insert);
});
```

### Using `JoinCrew`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, joinCrewRef, JoinCrewVariables } from '@dataconnect/generated';

// The `JoinCrew` mutation requires an argument of type `JoinCrewVariables`:
const joinCrewVars: JoinCrewVariables = {
  crewId: ..., 
};

// Call the `joinCrewRef()` function to get a reference to the mutation.
const ref = joinCrewRef(joinCrewVars);
// Variables can be defined inline as well.
const ref = joinCrewRef({ crewId: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = joinCrewRef(dataConnect, joinCrewVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.membership_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.membership_insert);
});
```

## SendMessage
You can execute the `SendMessage` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
sendMessage(vars: SendMessageVariables): MutationPromise<SendMessageData, SendMessageVariables>;

interface SendMessageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SendMessageVariables): MutationRef<SendMessageData, SendMessageVariables>;
}
export const sendMessageRef: SendMessageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
sendMessage(dc: DataConnect, vars: SendMessageVariables): MutationPromise<SendMessageData, SendMessageVariables>;

interface SendMessageRef {
  ...
  (dc: DataConnect, vars: SendMessageVariables): MutationRef<SendMessageData, SendMessageVariables>;
}
export const sendMessageRef: SendMessageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the sendMessageRef:
```typescript
const name = sendMessageRef.operationName;
console.log(name);
```

### Variables
The `SendMessage` mutation requires an argument of type `SendMessageVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SendMessageVariables {
  crewId: UUIDString;
  content: string;
  messageType?: string | null;
}
```
### Return Type
Recall that executing the `SendMessage` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SendMessageData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SendMessageData {
  message_insert: Message_Key;
}
```
### Using `SendMessage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, sendMessage, SendMessageVariables } from '@dataconnect/generated';

// The `SendMessage` mutation requires an argument of type `SendMessageVariables`:
const sendMessageVars: SendMessageVariables = {
  crewId: ..., 
  content: ..., 
  messageType: ..., // optional
};

// Call the `sendMessage()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await sendMessage(sendMessageVars);
// Variables can be defined inline as well.
const { data } = await sendMessage({ crewId: ..., content: ..., messageType: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await sendMessage(dataConnect, sendMessageVars);

console.log(data.message_insert);

// Or, you can use the `Promise` API.
sendMessage(sendMessageVars).then((response) => {
  const data = response.data;
  console.log(data.message_insert);
});
```

### Using `SendMessage`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, sendMessageRef, SendMessageVariables } from '@dataconnect/generated';

// The `SendMessage` mutation requires an argument of type `SendMessageVariables`:
const sendMessageVars: SendMessageVariables = {
  crewId: ..., 
  content: ..., 
  messageType: ..., // optional
};

// Call the `sendMessageRef()` function to get a reference to the mutation.
const ref = sendMessageRef(sendMessageVars);
// Variables can be defined inline as well.
const ref = sendMessageRef({ crewId: ..., content: ..., messageType: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = sendMessageRef(dataConnect, sendMessageVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.message_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.message_insert);
});
```

## CreateUserProfile
You can execute the `CreateUserProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createUserProfile(vars: CreateUserProfileVariables): MutationPromise<CreateUserProfileData, CreateUserProfileVariables>;

interface CreateUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserProfileVariables): MutationRef<CreateUserProfileData, CreateUserProfileVariables>;
}
export const createUserProfileRef: CreateUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createUserProfile(dc: DataConnect, vars: CreateUserProfileVariables): MutationPromise<CreateUserProfileData, CreateUserProfileVariables>;

interface CreateUserProfileRef {
  ...
  (dc: DataConnect, vars: CreateUserProfileVariables): MutationRef<CreateUserProfileData, CreateUserProfileVariables>;
}
export const createUserProfileRef: CreateUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createUserProfileRef:
```typescript
const name = createUserProfileRef.operationName;
console.log(name);
```

### Variables
The `CreateUserProfile` mutation requires an argument of type `CreateUserProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateUserProfileVariables {
  firebaseUID: string;
  username: string;
  email: string;
  displayName?: string | null;
  profilePictureUrl?: string | null;
}
```
### Return Type
Recall that executing the `CreateUserProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateUserProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateUserProfileData {
  user_insert: User_Key;
}
```
### Using `CreateUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createUserProfile, CreateUserProfileVariables } from '@dataconnect/generated';

// The `CreateUserProfile` mutation requires an argument of type `CreateUserProfileVariables`:
const createUserProfileVars: CreateUserProfileVariables = {
  firebaseUID: ..., 
  username: ..., 
  email: ..., 
  displayName: ..., // optional
  profilePictureUrl: ..., // optional
};

// Call the `createUserProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createUserProfile(createUserProfileVars);
// Variables can be defined inline as well.
const { data } = await createUserProfile({ firebaseUID: ..., username: ..., email: ..., displayName: ..., profilePictureUrl: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createUserProfile(dataConnect, createUserProfileVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createUserProfile(createUserProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateUserProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createUserProfileRef, CreateUserProfileVariables } from '@dataconnect/generated';

// The `CreateUserProfile` mutation requires an argument of type `CreateUserProfileVariables`:
const createUserProfileVars: CreateUserProfileVariables = {
  firebaseUID: ..., 
  username: ..., 
  email: ..., 
  displayName: ..., // optional
  profilePictureUrl: ..., // optional
};

// Call the `createUserProfileRef()` function to get a reference to the mutation.
const ref = createUserProfileRef(createUserProfileVars);
// Variables can be defined inline as well.
const ref = createUserProfileRef({ firebaseUID: ..., username: ..., email: ..., displayName: ..., profilePictureUrl: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createUserProfileRef(dataConnect, createUserProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

