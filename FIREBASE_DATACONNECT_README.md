# Firebase Data Connect Setup - CrewConnect

Your Firebase Data Connect is now successfully configured! 🎉

## What was generated:

### 1. **Database Schema** (`dataconnect/schema/schema.gql`)
- **User**: User profiles with Firebase Auth integration
- **Crew**: Group chat rooms with metadata
- **Membership**: User-crew relationships with roles
- **Message**: Chat messages with media support

### 2. **GraphQL Operations** (`dataconnect/example/queries.gql`)
- `CreateNewCrew`: Create a new group chat
- `GetPublicCrews`: List all public crews
- `GetAllCrews`: Get all crews for authenticated users
- `JoinCrew`: Join an existing crew
- `GetCrewMessages`: Retrieve messages for a crew
- `SendMessage`: Send a new message
- `GetUserProfile`: Get user profile by Firebase UID
- `CreateUserProfile`: Create user profile on first login
- `GetCrewMembers`: Get all members of a crew
- `GetUserMemberships`: Get user's crew memberships

### 3. **TypeScript SDK** (`src/lib/dataconnect-generated/`)
Auto-generated TypeScript SDK with:
- Type-safe operations
- React hooks for easy integration
- Full IntelliSense support

### 4. **Integration Helper** (`src/lib/dataconnect.js`)
Simplified helper functions for common operations.

## How to use in your React components:

### 1. **Create User Profile** (on first login)
```javascript
import { dataConnectHelpers } from '../lib/dataconnect';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../services/firebase';

function Profile() {
  const [user] = useAuthState(auth);

  const handleCreateProfile = async () => {
    if (user) {
      await dataConnectHelpers.createUserProfile(user, {
        bio: "Hello, I'm new to CrewConnect!"
      });
    }
  };

  return <button onClick={handleCreateProfile}>Create Profile</button>;
}
```

### 2. **List and Join Crews**
```javascript
import { dataConnectHelpers } from '../lib/dataconnect';

function CrewList() {
  const [crews, setCrews] = useState([]);

  useEffect(() => {
    dataConnectHelpers.getPublicCrews().then(result => {
      setCrews(result.data.crews);
    });
  }, []);

  const joinCrew = async (crewId) => {
    await dataConnectHelpers.joinCrew(crewId);
    // Refresh the list or update UI
  };

  return (
    <div>
      {crews.map(crew => (
        <div key={crew.id}>
          <h3>{crew.name}</h3>
          <p>{crew.description}</p>
          <button onClick={() => joinCrew(crew.id)}>Join</button>
        </div>
      ))}
    </div>
  );
}
```

### 3. **Chat Messages**
```javascript
import { dataConnectHelpers } from '../lib/dataconnect';

function Chat({ crewId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    // Load messages
    dataConnectHelpers.getCrewMessages(crewId).then(result => {
      setMessages(result.data.messages.reverse()); // Reverse for chronological order
    });
  }, [crewId]);

  const sendMessage = async () => {
    if (newMessage.trim()) {
      await dataConnectHelpers.sendMessage(crewId, newMessage);
      setNewMessage('');
      // Reload messages or use real-time updates
      const result = await dataConnectHelpers.getCrewMessages(crewId);
      setMessages(result.data.messages.reverse());
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <strong>{msg.sender.displayName}: </strong>
            <span>{msg.content}</span>
            <small>{new Date(msg.sentAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
```

### 4. **Using React Hooks** (Advanced)
```javascript
import { useQuery, useMutation } from 'firebase/data-connect';
import { getPublicCrews, createNewCrew } from '../lib/dataconnect-generated';

function CrewsWithHooks() {
  // Use generated hooks for reactive data
  const { data: crewsData, loading, error } = useQuery(getPublicCrews);
  const [createCrew] = useMutation(createNewCrew);

  const handleCreateCrew = async () => {
    await createCrew({
      name: "New Crew",
      description: "A fresh crew for everyone!"
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleCreateCrew}>Create New Crew</button>
      {crewsData?.crews.map(crew => (
        <div key={crew.id}>{crew.name}</div>
      ))}
    </div>
  );
}
```

## Next Steps:

1. **Deploy your schema**: Run \`firebase deploy --only dataconnect\`
2. **Start the emulator**: Run \`firebase emulators:start --only dataconnect\` for development
3. **Test your operations**: Use the generated SDK in your React components
4. **Set up real-time updates**: Consider using Firebase Firestore listeners for live updates

## Files to update in your existing code:

1. **Update AuthContext** to create user profiles on first login
2. **Update Groups page** to use Data Connect operations
3. **Update Chat page** to send/receive messages via Data Connect
4. **Update Dashboard** to show real crew data

## Important Notes:

- The schema is optimized for your CrewConnect application
- All operations include proper authentication with Firebase Auth
- The SDK provides TypeScript types for all operations
- Use the helper functions in \`dataconnect.js\` for simpler integration

Your Firebase Data Connect is now ready to power your real-time group chat application! 🚀
